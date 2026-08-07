# Microphones.Like.audio

A browsable catalogue of 1,761 microphones and 70 wireless systems from 166
brands, read against the **AES-X230** draft microphone profile.

The point of the project is the last part. X230 describes a microphone as a set
of AES70 control objects; this catalogue describes microphones as specification
sheets. Putting the two side by side shows exactly where a published spec can
answer a control model and where it cannot — which is the sort of evidence a
standards draft needs and rarely has.

## Data sources and attribution

**The microphone dataset is derived from [recordinghacks.com](https://recordinghacks.com/microphones),
whose work this project depends on entirely.** The specification pages,
frequency-response charts, editorial descriptions, product-lineage notes and tag
vocabulary are all theirs. `Research/microphones.json` is a structured extraction
of 1,761 of those profile pages.

**It is used here without permission, for research and standards-development
purposes.** No commercial use is intended or made. If recordinghacks would like
the dataset or this site taken down, changed, or credited differently, that
request will be honoured — open an issue or get in touch.

Other sources:

| Source | Used for |
|---|---|
| recordinghacks.com | the microphone catalogue (1,761 records) |
| `Research/Wireless Microphone_RF_Components.json` | 70 wireless systems, 305 tuning ranges |
| AES X230 object-list workbook (`X230-Mic-Profile-ObjectList-180502`) | the profile: 38 parameters, blocks, enumerations |
| AES X230 typical block diagrams (`X230-Mic-Profile-TypicalBlockDiagrams-180502`) | the three reference signal chains |

The X230 documents are AES working material, transcribed here to make the model
machine-readable. Every transcribed row carries the workbook row it came from.

## Structure

```
Research/microphones.json            source dataset (~22 MB, 1,761 records)
Research/microphone.schema.json      what a microphone record is
Research/rf_component.schema.json    what a wireless system record is
Research/aes_x230_profile.json       the X230 profile, transcribed
Research/aes_x230_profile.schema.json    the X230 data model, as a schema
Research/aes_x230_device.schema.json     one device read against the profile

docs/index.html          the browser app — no dependencies, no build step
docs/css/app.css         every style; the markup carries no <style> of its own
docs/js/                 ES modules, one job each — the brand tree, the model
                         list, the device page, the signal chain and its
                         drawing, gallery, tags, wireless, statistics, X230
docs/vocabulary.py       every facet, chip, column and band the UI offers
docs/build_data.py       splits the dataset into the files the app fetches
docs/build_rf.py         normalises the wireless dataset
docs/build_x230.py       validates and ships the profile
docs/x230_read.py        reads each record against the profile
docs/fetch_media.py      mirrors the catalogue's images into Media/
docs/data/               generated — not committed
Media/<brand>/<model>/   fetched images — not committed
```

The app ships no vocabulary of its own. Filter chips, dropdown options, table
columns, CSV columns, chart series and score bands all come from
`data/config.json`, built from `docs/vocabulary.py` and **counted against the
corpus** — a facet the data cannot satisfy ships with count 0 and never reaches
the page.

`build_data.py` writes:

- `data/index.json` — every brand plus a compact row per model, so the tree,
  global search, filtering and the statistics view work from one request.
- `data/brands/<brand>.json` — full records for one brand, fetched on demand.
- `data/tags.json`, `data/rf.json`, `data/config.json`, `data/x230.json`.
- `data/x230_report.json` — the schemas in full plus corpus-wide coverage
  statistics. Its own file because only the X230 tab needs it.

## Running locally

```bash
python3 docs/build_data.py
python3 -m http.server -d docs 8000
```

Then open <http://localhost:8000/>. The app needs HTTP — browsers block `fetch()`
and ES modules from `file://`, so opening `docs/index.html` directly shows a
notice instead of data.

`pip install jsonschema` is optional: with it, the build validates the X230
profile against its schema. Without it, the build's own cross-reference checks
still run.

## Media mirror

```bash
python3 docs/fetch_media.py --limit 5 --dry-run    # see the plan
python3 docs/fetch_media.py                        # ~6,200 files, ~25 minutes
```

Every photo, thumbnail and frequency-response chart the catalogue points at,
saved as `Media/<brand>/<model>/`, with a `manifest.json` per model recording
which file came from which URL. Runs are resumable — files already on disk are
never fetched twice — and anything that fails lands in `Media/_failures.tsv`.

The images belong to recordinghacks.com and are mirrored under the same terms
as the dataset above, so `Media/` is gitignored and never published. The
defaults are deliberately unhurried: four workers, a quarter-second between
requests, `robots.txt` honoured. `--workers` and `--delay` will change that;
the source's bandwidth bill is the reason not to.

## Browse

Three panes under one filter bar: brands on the left, that brand's models in the
middle, the selected model in full on the right. The bar spans the top rather
than living in the model pane, because those facets narrow the brand tree as
much as the list.

- `/` focuses search; it filters brands and models together.
- The buttons beside the search box filter the whole catalogue — cardioid, omni,
  figure-8, super, hyper, wide, shotgun, stereo, switchable, and wireless.
  Several can be on at once and a record matches if it answers any of them. Each
  polar icon is that pattern's actual equation, plotted.
- Filter by transducer type, form factor, price band, **X230 score band**, and
  availability; sort by name, price, year or X230 score.
- Selection lives in the URL hash (`#/Neumann/U-87-Ai`), so views are linkable.

A switchable mic matches every pattern it actually offers: the source collapses
those into one "9 polar patterns" icon, so `build_data.py` unions it with the
per-pattern spec rows. A C 414 XL II therefore answers to Cardioid, Omni,
Hypercardioid, Figure-8 and Wide alike.

On a narrow screen the panes stack and the model list drops out: the brand tree
already folds out to models and routes straight to the device, so a second list
of the same rows only costs screen. The header stacks with it — search takes a
row of its own, and the pattern buttons and filter chips become strips that
scroll sideways rather than wrapping into columns tall enough to push the panes
off the page. A wide window is used rather than padded: the device pane has no
column cap, and only running prose keeps a measure.

## Gallery

Every model as a picture, grouped by manufacturer and ordered naturally within
one (C 414 before C 3000), with a filter box over brand and model names. Browse
answers what is known about a microphone; this answers what it looks like.

It reads `index.json`, already in memory from boot, so the view costs no
request, and it draws the whole catalogue in one pass — a "show more" button in
the middle of a gallery is a wall. The photos are the only cost, and the browser
fetches each one lazily as the grid scrolls it into view.

## The signal chain

Every device page draws its own chain, in the manner of the X230 typical
block-diagram sheets: boxes left to right, feeds arriving from below, a terminal
label where the signal leaves. The blocks and their order are config
(`vocabulary.MIC_CHAIN` / `RF_CHAIN`); whether a block appears at all is decided
by an extractor reading the record, which is what makes each drawing specific —
a mic with no pad gets no attenuator, and a passive ribbon gets no preamp,
because drawing one would be a lie.

Under the drawing is the table that makes it worth having: every box, what it
shows, and the record fields it was built from. No box appears that cannot be
pointed back at data.

Two kinds of record need more than one row of boxes, and some need both:

| Case | Records | Drawn as |
|---|---|---|
| **Stereo** — `classification.is_stereo` | 138 | two paths meeting at the connector, LEFT/RIGHT — or MID/SIDE when mid-side is the only array pattern, since calling those two paths left and right would misname them |
| **Dual-diaphragm** — omni *and* figure-8 among the element patterns, or three or more of them | 240 | front and rear elements feeding a **pattern matrix** |
| **Both** — e.g. the Josephson C700S | 14 | each channel with its own pair of diaphragms and its own matrix |

The dual-diaphragm rule is physics, not a tag lookup: no single element hears
both omnidirectionally and in a figure-8, so a mic offering the pair has two
diaphragms being summed with variable polarity, and that summing is the matrix.
Three or more selectable element patterns says the same thing the long way
round, and catches the omni/cardioid/figure-8 classic.

Patterns that describe how a *pair* is combined — X/Y, mid-side, Blumlein,
binaural — belong to the array rather than to a diaphragm, so they are cited
against the stereo split instead of being printed inside each capsule.

The drawing scales down to fit the pane rather than scrolling, but only to about
three quarters: past that the captions stop being legible and a scrollbar is the
better answer.

## The X230 reading

Every record is read against the profile at build time (`docs/x230_read.py`) and
each parameter lands in one of six states:

| State | Meaning |
|---|---|
| **mapped** | the catalogue supplies a value |
| **not implemented** | the catalogue positively records the function absent — the profile's own `N` code |
| **unknown** | the parameter applies but nothing can answer it. The value is **NULL**, and printed as one |
| **n/a** | the parameter's block is not instantiated on this device |
| **open in draft** | X230 itself left the binding open, so there is nothing to conform to |
| **per-device** | a serial number or a user's label — a value that exists only on a live unit |

The **score** is mapped ÷ applicable, as a percentage. It appears on every model
card, at the head of the device panel, and as a filter and sort order. A C 414
B-XL II scores 67% (6 of 9); a Royer R-10 33%; a wireless system 12%.

The last three states are all excluded from the denominator, for the same
reason: a record should not be marked down for failing to answer a question that
was never asked of it. A microphone with no converter has no ADC block to
describe; the draft's four unbound parameters have nothing to conform to; and no
catalogue of *models* can hold a serial number or the name someone will type in
after installing the thing. The keys left out on that last ground are named in
the profile's `crosswalk.not_scorable`, not buried in code — and if a record ever
does supply one, it counts.

Read the score carefully: it measures **this catalogue against the profile**, not
a microphone against the standard. No record here publishes an AES70 device
model, so a mapped parameter means the catalogue knows the value — not that the
microphone exposes the object. Where the two differ the panel says so: nearly
every pad and filter in the corpus is marked "(Via Switch)", which is a function
you can put your thumb on, not a control point a network can reach.

The reading is done once, in Python, because the score is a facet the model list
filters and sorts on — so it must exist before the first card is drawn. The
browser expands and renders the report it is handed rather than deriving a
second, drifting copy.

## The X230 tab

An explanation of the profile itself: its purpose, the four-part binding
(parameter → class → block → role → property) worked through a real row, the
blocks and how they follow the signal, the radio half's applicability grid, how
an object list is written, all three block diagrams summarised, both parameter
tables, the polar-pattern position enumeration, and what the draft leaves open.

It also carries:

- **The schema, in JSON** — both schemas rendered in full, switchable: the
  profile model and the per-device report. They are shipped as parsed objects
  and pretty-printed in the page, so what you read is the schema the build
  actually validates against.
- **How complete the catalogue is** — the corpus read against the profile.
  Headline counts, a score histogram, and a fill rate for every parameter with
  its denominator: the records the parameter was actually *asked* of. Blocks a
  device never instantiates and parameters the draft never bound are left out
  rather than counted as failures.

The finding is worth stating plainly. **9 of the profile's 38 parameters are
answered by at least one record; 23 are answered by none.** Four are answered
every time they are asked — Manufacturer, Device name, Frequency Select,
Frequency Band Select — and after those the best covered are Polar pattern
(84%), Sensitivity (75%) and Pattern parameter (70%). Pad (24%) and Low-Cut
(26%) have a column in the source that is empty on most pages. The 23 silent
ones are the profile's control surface: gain, polarity, mute, dynamics, EQ,
clocking, radio state. Gain is asked of all 1,831 records and answered by none.

That is the gap the profile exists to close: a specification sheet describes
what a microphone *is*, and X230 describes what a controller can *do to it*.

Every word of the tab comes from `Research/aes_x230_profile.json` and the
build's own statistics, so it cannot drift from the profile the device pages are
scored against.

## Statistics

A data explorer over the whole collection: headline tiles, distributions across
types, patterns, form factors, price and release decade, transducer mix by
brand, and a sortable table of every model with CSV export of the filtered set.
Computed in the browser from `index.json`, so it always agrees with the tree and
costs no extra request.

Chart colours use a fixed categorical palette validated for colour-vision
separation in both light and dark themes; each type keeps the same hue in the
tree, the model list and the charts.

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
