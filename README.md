# Microphones.Like.audio

A browsable catalogue of 1,761 microphones from 157 brands, built from the
recordinghacks dataset in `Research/microphones.json`.

## Structure

```
Research/microphones.json    source dataset (~22 MB, 1761 records)
Research/microphone.schema.json
docs/index.html              the browser app (single file, no dependencies)
docs/build_data.py           splits the dataset into the files the app fetches
docs/data/                   generated — not committed
```

`build_data.py` writes:

- `docs/data/index.json` — every brand plus a compact row per model (~580 KB), so
  the tree and global search work from one request.
- `docs/data/brands/<brand>.json` — the full records for one brand, fetched only
  when that brand is opened.

## Running locally

```bash
python3 docs/build_data.py
python3 -m http.server -d docs 8000
```

Then open <http://localhost:8000/>. The app needs HTTP — browsers block `fetch()`
from `file://`, so opening `docs/index.html` directly will show a notice instead
of data.

## Using it

Three panes: brands on the left (expandable to their models), the selected
brand's models in the middle, and the selected model's full detail on the right.

- `/` focuses search; it filters brands and models together.
- Filter the model list by transducer type or current availability, and sort by
  name, price, or year.
- Selection lives in the URL hash (`#/Neumann/U87`), so views are linkable.
- Related microphones and set contents link straight to their own detail pages.

## Publishing

`.github/workflows/deploy.yml` rebuilds `docs/data/` and uploads `docs/` to
microphones.like.audio over FTPS on every push to `main`, or on demand via
**Actions → Publish to microphones.like.audio → Run workflow**.

It reads three repository secrets — `FTP_SERVER`, `FTP_USERNAME`,
`FTP_PASSWORD` — and one optional repository variable, `FTP_SERVER_DIR`, which
defaults to `./` (set it to e.g. `/public_html/` if the FTP account does not land
in the web root).

The action syncs incrementally using `.ftp-deploy-sync-state.json` on the server.
Run the workflow manually with **full_sync** checked to ignore that state and
re-upload everything.
