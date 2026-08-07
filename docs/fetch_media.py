#!/usr/bin/env python3
"""Mirror every image the catalogue points at, sorted by brand and model.

Reads Research/microphones.json — the master dataset, not the generated
docs/data/ files — and writes:

    Media/<Brand>/<Model>/thumb.jpg          the list thumbnail
    Media/<Brand>/<Model>/full.jpg           the full-size photo
    Media/<Brand>/<Model>/graph-*.png        frequency-response charts
    Media/<Brand>/<Model>/image-*.jpg        the page's other photos
    Media/<Brand>/<Model>/inline-*.jpg       images embedded in the description
    Media/<Brand>/<Model>/manifest.json      what each file is and where it came from
    Media/_failures.tsv                      anything that could not be fetched

Media/ is gitignored: it is roughly 7,000 files of someone else's photography.
The dataset is derived from recordinghacks.com and used for research under the
terms in README.md — so is this mirror. The defaults here are deliberately
polite (four workers, a pause between requests, robots.txt honoured); raise
them only if you know you are entitled to.

Runs are resumable: a file already on disk is never fetched again, so an
interrupted run can simply be repeated. Partial writes land on a .part file
and are renamed only once complete, so a killed download cannot masquerade as
a finished one.

Run:  python3 docs/fetch_media.py                     # everything
      python3 docs/fetch_media.py --brand Shure       # one brand
      python3 docs/fetch_media.py --limit 5 --dry-run # see the plan first
"""

import argparse
import json
import os
import re
import shutil
import sys
import threading
import time
import urllib.robotparser as robotparser
from collections import namedtuple
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "Research", "microphones.json")
OUT = os.path.join(ROOT, "Media")

UA = ("MicrophonesLikeAudio-media/1.0 (research mirror; "
      "https://github.com/LikeDotAudio/Microphones.Like.audio)")

# One image tag's src, however the scraped markup quoted it.
IMG_SRC = re.compile(r"<img[^>]+src=[\"']([^\"']+)[\"']", re.I)

KNOWN_EXT = {"jpg", "jpeg", "png", "gif", "webp", "bmp", "tif", "tiff", "svg"}
CTYPE_EXT = {
    "image/jpeg": "jpg", "image/pjpeg": "jpg", "image/png": "png",
    "image/gif": "gif", "image/webp": "webp", "image/bmp": "bmp",
    "image/tiff": "tif", "image/svg+xml": "svg",
}

Job = namedtuple("Job", "kind url name alt")


# ------------------------------------------------------------------ naming

def safe_slug(value):
    """Filesystem-safe path segment. Same rule build_data.py uses for files."""
    return re.sub(r"[^A-Za-z0-9._-]", "_", value or "").strip("_") or "unknown"


def short_slug(value, limit=40):
    """A readable, lowercase fragment for inside a filename."""
    s = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return s[:limit].strip("-")


def ext_of(url, ctype=None):
    """Extension for a saved file: the URL's if it looks like one, else the
    server's content type. Some graph URLs carry no suffix at all."""
    tail = urlparse(url).path.rsplit("/", 1)[-1]
    if "." in tail:
        ext = tail.rsplit(".", 1)[-1].lower()
        if ext in KNOWN_EXT:
            return "jpg" if ext == "jpeg" else ext
    return CTYPE_EXT.get(ctype or "", "bin")


# ------------------------------------------------------------------- plan

def jobs_for(mic, opts):
    """Every image one microphone record points at, named and de-duplicated.

    The same URL turns up more than once — a frequency graph is both a
    frequency_graphs entry and an <img> in the description — so the first
    claim on a URL wins and the rest are dropped. Ordering therefore matters:
    the named, meaningful slots come first.
    """
    media = mic.get("media") or {}
    base = (mic.get("source") or {}).get("url") or ""
    jobs, seen = [], set()

    def add(kind, url, name, alt=None):
        if not url:
            return
        url = urljoin(base, url.strip())
        if not urlparse(url).scheme.startswith("http") or url in seen:
            return
        seen.add(url)
        jobs.append(Job(kind, url, name, alt))

    photo = media.get("primary_photo") or {}
    add("primary-thumb", photo.get("thumb_url"), "thumb", photo.get("alt"))
    add("primary-full", photo.get("full_url"), "full", photo.get("alt"))

    for i, g in enumerate(mic.get("frequency_graphs") or [], 1):
        tag = short_slug(g.get("pattern")) or "response"
        gid = safe_slug(g.get("graph_id") or str(i))
        add("graph", g.get("image_url"), "graph-%s-%s" % (tag, gid), g.get("alt"))

    for i, im in enumerate(media.get("images") or [], 1):
        # The pattern icons are site furniture — the same 27px glyph on every
        # page that offers that pattern — and the app draws its own.
        thumb = im.get("thumb_url") or ""
        if not opts.icons and "/icons/" in thumb:
            continue
        stem = short_slug(im.get("alt")) or short_slug(
            urlparse(thumb).path.rsplit("/", 1)[-1].rsplit(".", 1)[0])
        label = "image-%02d%s" % (i, "-" + stem if stem else "")
        add("image", thumb, label, im.get("alt"))
        add("image-full", im.get("full_url"), label + "-full", im.get("alt"))

    if opts.inline:
        html = (mic.get("content") or {}).get("description_html") or ""
        for i, src in enumerate(IMG_SRC.findall(html), 1):
            stem = short_slug(urlparse(src).path.rsplit("/", 1)[-1].rsplit(".", 1)[0])
            add("inline", src, "inline-%02d%s" % (i, "-" + stem if stem else ""))

    return jobs


def wanted(mic, opts):
    """Does this record pass the --brand / --model filters?"""
    src, ident = mic.get("source") or {}, mic.get("identity") or {}
    brand = (src.get("brand_slug") or ident.get("manufacturer") or "").lower()
    model = (src.get("model_slug") or ident.get("model") or "").lower()
    if opts.brand and not any(b.lower() in brand for b in opts.brand):
        return False
    if opts.model and not any(m.lower() in model for m in opts.model):
        return False
    return True


# --------------------------------------------------------------- fetching

class Fetcher:
    """One shared HTTP client: robots rules per host, a URL→path cache so a
    shared image is pulled once, and a delay so we stay a polite guest."""

    def __init__(self, opts):
        self.opts = opts
        self.robots = {}
        self.done = {}                    # url -> path already on disk
        self.lock = threading.Lock()
        self.next_at = 0.0                # earliest time the next request may go

    def allowed(self, url):
        if self.opts.ignore_robots:
            return True
        host = urlparse(url).netloc
        with self.lock:
            rp = self.robots.get(host)
        if rp is None:
            rp = robotparser.RobotFileParser()
            rp.set_url("%s://%s/robots.txt" % (urlparse(url).scheme, host))
            try:
                rp.read()
            except Exception:
                rp.allow_all = True       # no robots.txt served: nothing to obey
            with self.lock:
                self.robots[host] = rp
        return rp.can_fetch(UA, url)

    def _pace(self):
        """Serialise the *start* of requests, so --delay is a site-wide rate
        rather than a per-worker one."""
        with self.lock:
            wait = self.next_at - time.monotonic()
            self.next_at = max(self.next_at, time.monotonic()) + self.opts.delay
        if wait > 0:
            time.sleep(wait)

    def read(self, url):
        """Bytes for one URL, or an exception describing why not."""
        last = None
        for attempt in range(self.opts.retries):
            self._pace()
            try:
                req = Request(url, headers={"User-Agent": UA, "Accept": "image/*,*/*"})
                with urlopen(req, timeout=self.opts.timeout) as r:
                    data, ctype = r.read(), r.headers.get_content_type()
                if not data:
                    raise ValueError("empty response")
                if ctype.startswith("text/"):
                    # An error page dressed as a 200 — saving it would poison
                    # the mirror with HTML named .jpg.
                    raise ValueError("served %s, not an image" % ctype)
                return data, ctype
            except HTTPError as e:
                if e.code in (401, 403, 404, 410):
                    raise                 # a retry cannot change any of these
                last = e
            except (URLError, ValueError, OSError) as e:
                last = e
            time.sleep(0.6 * (2 ** attempt))
        raise last

    def save(self, url, folder, stem):
        """Fetch one URL into folder/<stem>.<ext>. Returns (path, bytes, note)."""
        with self.lock:
            cached = self.done.get(url)
        if cached and os.path.exists(cached):
            path = os.path.join(folder, stem + "." + cached.rsplit(".", 1)[-1])
            if not os.path.exists(path):
                shutil.copyfile(cached, path)   # shared image, already paid for
            return path, os.path.getsize(path), "copied"

        # Resume: any extension of this stem already on disk counts as done.
        if not self.opts.overwrite:
            for ext in sorted(KNOWN_EXT) + ["bin"]:
                path = os.path.join(folder, stem + "." + ext)
                if os.path.exists(path) and os.path.getsize(path):
                    with self.lock:
                        self.done.setdefault(url, path)
                    return path, os.path.getsize(path), "kept"

        if not self.allowed(url):
            raise PermissionError("robots.txt disallows " + url)

        data, ctype = self.read(url)
        path = os.path.join(folder, stem + "." + ext_of(url, ctype))
        part = path + ".part"
        with open(part, "wb") as fh:
            fh.write(data)
        os.replace(part, path)              # only a whole file gets the real name
        with self.lock:
            self.done[url] = path
        return path, len(data), "fetched"


# ------------------------------------------------------------------- work

class Tally:
    def __init__(self):
        self.lock = threading.Lock()
        self.models = self.fetched = self.kept = self.copied = self.failed = 0
        self.bytes = 0
        self.failures = []

    def add(self, note, size=0):
        with self.lock:
            setattr(self, note, getattr(self, note) + 1)
            self.bytes += size

    def fail(self, brand, model, job, err):
        with self.lock:
            self.failed += 1
            self.failures.append((brand, model, job.kind, job.url, str(err)))


def do_model(mic, opts, fetcher, tally, say):
    src, ident = mic.get("source") or {}, mic.get("identity") or {}
    brand = safe_slug(src.get("brand_slug") or ident.get("manufacturer"))
    model = safe_slug(src.get("model_slug") or ident.get("model"))
    jobs = jobs_for(mic, opts)
    if not jobs:
        return

    folder = os.path.join(opts.out, brand, model)
    if opts.dry_run:
        say("%s/%s  %d file%s" % (brand, model, len(jobs), "" if len(jobs) == 1 else "s"))
        for j in jobs:
            say("    %-13s %s" % (j.kind, j.url))
        tally.add("models")
        return

    os.makedirs(folder, exist_ok=True)
    files, missing = [], []
    for job in jobs:
        try:
            path, size, note = fetcher.save(job.url, folder, job.name)
        except Exception as err:                      # noqa: BLE001 — logged, not raised
            tally.fail(brand, model, job, err)
            missing.append({"kind": job.kind, "url": job.url, "error": str(err)})
            continue
        tally.add(note, size if note == "fetched" else 0)
        files.append({
            "file": os.path.basename(path), "kind": job.kind,
            "url": job.url, "alt": job.alt, "bytes": size,
        })

    manifest = {
        "brand": ident.get("manufacturer") or brand,
        "model": ident.get("model") or model,
        "full_name": ident.get("full_name"),
        "mic_id": src.get("mic_id"),
        "source": src.get("url"),
        "files": files,
        "missing": missing,
    }
    with open(os.path.join(folder, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
        fh.write("\n")

    tally.add("models")
    say("%-28s %-24s %2d file%s%s" % (
        brand, model, len(files), " " if len(files) == 1 else "s",
        "  (%d missing)" % len(missing) if missing else ""))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=OUT, help="destination folder (default: Media/)")
    ap.add_argument("--brand", action="append", help="only brands matching this (repeatable)")
    ap.add_argument("--model", action="append", help="only models matching this (repeatable)")
    ap.add_argument("--limit", type=int, help="stop after this many microphones")
    ap.add_argument("--workers", type=int, default=4, help="parallel microphones (default: 4)")
    ap.add_argument("--delay", type=float, default=0.25,
                    help="seconds between requests, site-wide (default: 0.25)")
    ap.add_argument("--timeout", type=float, default=30.0, help="per-request timeout")
    ap.add_argument("--retries", type=int, default=3, help="attempts per URL (default: 3)")
    ap.add_argument("--overwrite", action="store_true", help="re-fetch files already on disk")
    ap.add_argument("--no-inline", dest="inline", action="store_false",
                    help="skip images embedded in the description text")
    ap.add_argument("--icons", action="store_true",
                    help="also save the shared polar-pattern icons")
    ap.add_argument("--ignore-robots", action="store_true", help="do not read robots.txt")
    ap.add_argument("--dry-run", action="store_true", help="list what would be fetched")
    ap.add_argument("--quiet", action="store_true", help="only print the summary")
    opts = ap.parse_args(argv)

    if not os.path.exists(SRC):
        sys.exit("Not found: %s" % SRC)
    with open(SRC) as fh:
        mics = json.load(fh)

    picked = [m for m in mics if wanted(m, opts)]
    if opts.limit:
        picked = picked[:opts.limit]
    if not picked:
        sys.exit("No microphones matched those filters.")

    print("%d microphone%s → %s%s" % (
        len(picked), "" if len(picked) == 1 else "s", opts.out,
        "   (dry run)" if opts.dry_run else ""))

    out_lock = threading.Lock()

    def say(line):
        if opts.quiet:
            return
        with out_lock:
            print(line, flush=True)

    fetcher, tally = Fetcher(opts), Tally()
    started = time.monotonic()
    try:
        with ThreadPoolExecutor(max_workers=max(1, opts.workers)) as pool:
            list(pool.map(lambda m: do_model(m, opts, fetcher, tally, say), picked))
    except KeyboardInterrupt:
        print("\nStopped. Re-run the same command to pick up where this left off.")

    if tally.failures and not opts.dry_run:
        os.makedirs(opts.out, exist_ok=True)
        report = os.path.join(opts.out, "_failures.tsv")
        with open(report, "w") as fh:
            fh.write("brand\tmodel\tkind\turl\terror\n")
            for row in sorted(tally.failures):
                fh.write("\t".join(row) + "\n")
        print("%d could not be fetched — see %s" % (len(tally.failures), report))

    print("%d microphones · %d fetched · %d already there · %d shared · %d missing · %.1f MB · %.0fs"
          % (tally.models, tally.fetched, tally.kept, tally.copied, tally.failed,
             tally.bytes / 1e6, time.monotonic() - started))
    return 0


if __name__ == "__main__":
    sys.exit(main())
