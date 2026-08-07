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

## Browse

Three panes: brands on the left (expandable to their models), the selected
brand's models in the middle, and the selected model's full detail on the right.

- `/` focuses search; it filters brands and models together.
- The polar-pattern buttons beside the search box filter the whole catalogue —
  cardioid, omni, figure-8, super, hyper, wide, shotgun, stereo and switchable.
  Several can be on at once and a mic matches if it offers any of them. Each
  icon is the pattern's actual polar equation, plotted.
- Filter the model list by transducer type or availability, and sort by name,
  price, or year.
- Selection lives in the URL hash (`#/Neumann/U-87-Ai`), so views are linkable.
- Related microphones and set contents link straight to their own detail pages.

A switchable mic is matched on every pattern it actually offers: the source
collapses those to a single "9 polar patterns" icon, so `build_data.py` unions
that with the per-pattern spec rows. A C 414 XL II therefore answers to
Cardioid, Omni, Hypercardioid, Figure-8 and Wide alike.

## Statistics

The **Statistics** tab is a data explorer over the whole collection:

- **Headline tiles** — catalogue and brand counts, median MSRP and price range,
  type mix, tube and multipattern counts, discontinued share, release-year span.
- **Distributions** — transducer types, polar patterns, form factors, price
  histogram, releases by decade, and attribute shares.
- **Transducer mix by brand** — stacked bars per brand, orderable by catalogue
  size or by share of condenser/dynamic/ribbon, for the top 25/50/100 or all
  157 brands. Click a brand to open it in Browse.
- **Data explorer** — every model in a sortable table, filterable by text,
  type, pattern and availability, with CSV export of the filtered set. Click a
  row to jump to that microphone.

It is computed in the browser from `index.json`, so it always agrees with the
tree and costs no extra request. Chart colours use a fixed categorical palette
validated for colour-vision separation in both light and dark themes; each type
keeps the same hue in the tree, the model list and the charts.

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
