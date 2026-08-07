#!/usr/bin/env python3
"""The controlled vocabularies the browser's UI is built from.

Everything the page offers as a choice — transducer types, form factors, polar
pattern buttons, price bands, sort orders, table and CSV columns — is described
here and shipped as data/config.json. The page holds no vocabulary of its own,
so adding a facet or a CSV column is an edit to this file plus a rebuild, with
no markup or JavaScript to touch.

Entries carrying `match` or `path` are checked against the corpus at build time
(see build_config), which is what stops the UI from quietly offering a filter
the data can never satisfy.
"""

# ---------------------------------------------------------------- facets

# Transducer types, in the order the chips appear. `key` is the value stored in
# a model row.
#
# "mixed" is a kit whose microphones are not all of one type — a drum pack of
# dynamics and condensers. Such a kit also answers to each type it contains, so
# it appears under Condenser and Dynamic as well as here (docs/kits.py).
# "unclassified" is left in place although nothing carries it: every record that
# once did was a kit, and the chip should return the moment the corpus grows a
# record that genuinely has no type.
TYPES = [
    {"key": "all", "label": "All"},
    {"key": "condenser", "label": "Condenser"},
    {"key": "dynamic", "label": "Dynamic"},
    {"key": "ribbon", "label": "Ribbon"},
    {"key": "boundary", "label": "Boundary"},
    {"key": "hybrid", "label": "Hybrid"},
    {"key": "mixed", "label": "Mixed kit"},
    {"key": "wireless", "label": "Wireless"},
    {"key": "unknown", "label": "Unclassified"},
]

# What a catalogue entry is. Microphones and RF systems keep separate record
# schemas but share the brand tree and the model list, so every index row says
# which of the two it is.
KINDS = [
    {"key": "all", "label": "Everything"},
    {"key": "mic", "label": "Microphones"},
    {"key": "rf", "label": "Wireless systems"},
]

FORM_LABELS = {
    "side-address": "Side-address",
    "end-address": "End-address",
    "pencil": "Pencil",
    "handheld": "Handheld",
    "shotgun": "Shotgun",
    "boundary": "Boundary",
    "lavalier": "Lavalier",
}

# Boolean columns on a model row that read well as a toggle.
TRAITS = [
    {"key": "tube", "label": "Tube"},
    {"key": "multi", "label": "Multipattern"},
    {"key": "stereo", "label": "Stereo"},
]

# MSRP bands, [min, max) in dollars. `none` selects mics with no listed price.
PRICE_BANDS = [
    {"key": "any", "label": "Any price"},
    {"key": "0-100", "label": "Under $100", "min": 0, "max": 100},
    {"key": "100-300", "label": "$100 – $300", "min": 100, "max": 300},
    {"key": "300-700", "label": "$300 – $700", "min": 300, "max": 700},
    {"key": "700-1500", "label": "$700 – $1,500", "min": 700, "max": 1500},
    {"key": "1500-4000", "label": "$1,500 – $4,000", "min": 1500, "max": 4000},
    {"key": "4000-", "label": "$4,000 and up", "min": 4000},
    {"key": "none", "label": "No price listed", "none": True},
]

SORTS = [
    {"key": "name", "label": "Name"},
    {"key": "price", "label": "Price ↑"},
    {"key": "price-desc", "label": "Price ↓"},
    {"key": "year", "label": "Newest"},
    {"key": "x230-desc", "label": "X230 score ↓"},
    {"key": "x230", "label": "X230 score ↑"},
]

# Bands of the AES-X230 score: what percentage of the profile parameters that
# apply to a device the catalogue can actually fill in. See docs/x230_read.py.
# The score is a measure of this dataset against the profile, not of the
# microphone against the standard — no record here publishes an AES70 device
# model, so a high score means the catalogue is well documented, not that the
# microphone is compliant. [min, max) in percent.
X230_BANDS = [
    {"key": "any", "label": "Any X230 score"},
    {"key": "0-20", "label": "Under 20%", "min": 0, "max": 20},
    {"key": "20-40", "label": "20 – 39%", "min": 20, "max": 40},
    {"key": "40-60", "label": "40 – 59%", "min": 40, "max": 60},
    {"key": "60-80", "label": "60 – 79%", "min": 60, "max": 80},
    {"key": "80-", "label": "80% and up", "min": 80},
    {"key": "none", "label": "No score", "none": True},
]

TAG_SORTS = [
    {"key": "count", "label": "Most used"},
    {"key": "count-asc", "label": "Least used"},
    {"key": "name", "label": "A → Z"},
    {"key": "name-desc", "label": "Z → A"},
]

AVAILABILITY = [
    {"key": "all", "label": "Any status"},
    {"key": "current", "label": "Current"},
    {"key": "discontinued", "label": "Discontinued"},
]

# ------------------------------------------------------------- patterns

# One button per polar-pattern facet. `match` lists the pattern names exactly as
# they appear in the corpus; `icon` is the polar curve(s) to draw, by name of
# the equation in js/polar.js. `multi` matches the is_multipattern flag instead
# of a pattern name, and `kind` matches the record kind — the one button on this
# bar that is not a pattern at all, because a wireless system has no capsule to
# have one. It draws a `glyph` from js/polar.js rather than a curve.
PATTERNS = [
    {"key": "cardioid", "label": "Cardioid", "match": ["Cardioid"],
     "icon": [{"shape": "cardioid"}]},
    {"key": "omni", "label": "Omnidirectional", "match": ["Omnidirectional"],
     "icon": [{"shape": "omni", "scale": 0.92}]},
    {"key": "fig8", "label": "Bidirectional (figure-8)", "match": ["Bidirectional"],
     "icon": [{"shape": "fig8"}]},
    {"key": "super", "label": "Supercardioid", "match": ["Supercardioid"],
     "icon": [{"shape": "super"}]},
    {"key": "hyper", "label": "Hypercardioid", "match": ["Hypercardioid"],
     "icon": [{"shape": "hyper"}]},
    {"key": "wide", "label": "Wide cardioid", "match": ["Wide Cardioid"],
     "icon": [{"shape": "wide"}]},
    {"key": "shotgun", "label": "Shotgun / lobar", "match": ["Shotgun"],
     "icon": [{"shape": "shotgun"}]},
    {"key": "stereo", "label": "Stereo (X/Y, M-S, Blumlein, binaural)",
     "match": ["X/Y Stereo", "Mid-Side Stereo", "Blumlein", "Binaural"],
     "icon": [{"shape": "cardioid", "rot": -0.75, "scale": 0.8},
              {"shape": "cardioid", "rot": 0.75, "scale": 0.8}]},
    {"key": "multi", "label": "Switchable / multipattern", "multi": True,
     "match": ["9 polar patterns", "continuously variable pattern selection"],
     "icon": [{"shape": "cardioid", "scale": 0.66},
              {"shape": "omni", "scale": 0.95, "stroke": True}]},
    {"key": "wireless", "label": "Wireless systems", "kind": "rf", "match": [],
     "noun": "systems", "glyph": "antenna"},
]

# Long corpus names shortened for tables and chart axes.
PATTERN_DISPLAY = {
    "9 polar patterns": "9 switchable",
    "continuously variable pattern selection": "continuously variable",
}

# ------------------------------------------------------------- wireless

# VHF/UHF, as the RF source marks them.
RF_BANDS = [
    {"key": "UHF", "label": "UHF"},
    {"key": "VHF", "label": "VHF"},
]

# Spectrum segments for the Wireless tab. A system matches a segment if any part
# of its coverage overlaps it, so a wideband tuner appears under each one it
# reaches rather than only where it starts.
RF_SPECTRUM = [
    {"key": "all", "label": "Any spectrum", "min": 0},
    {"key": "vhf", "label": "VHF · under 300 MHz", "min": 0, "max": 300},
    {"key": "low-uhf", "label": "Low UHF · 300–500 MHz", "min": 300, "max": 500},
    {"key": "tv-core", "label": "TV core · 500–600 MHz", "min": 500, "max": 600},
    {"key": "600", "label": "600 MHz · 600–700 MHz", "min": 600, "max": 700},
    {"key": "700", "label": "700 MHz · 700–800 MHz", "min": 700, "max": 800},
    {"key": "900", "label": "Above 800 MHz", "min": 800},
]

RF_SORTS = [
    {"key": "brand", "label": "Brand"},
    {"key": "model", "label": "Model"},
    {"key": "low", "label": "Lowest frequency"},
    {"key": "span", "label": "Widest coverage"},
    {"key": "ranges", "label": "Most ranges"},
]

# Columns of the per-range table in a wireless system's detail pane. `path` is a
# dotted path into one entry of rf.ranges.
RF_RANGE_COLUMNS = [
    {"label": "Range", "path": "name"},
    {"label": "Band", "path": "band"},
    {"label": "Start", "path": "start_mhz", "unit": " MHz", "num": True},
    {"label": "End", "path": "end_mhz", "unit": " MHz", "num": True},
    {"label": "Width", "path": "width_mhz", "unit": " MHz", "num": True},
    {"label": "Presets", "path": "presets", "num": True},
    {"label": "Bandwidth", "path": "bandwidth", "kind": "setting"},
    {"label": "IMD3", "path": "imd_3", "kind": "setting"},
    {"label": "IMD3 TX 3rd", "path": "imd_3_tx_3rd", "kind": "setting"},
    {"label": "IMD5", "path": "imd_5", "kind": "setting"},
]

# ---------------------------------------------------------- signal chain

# Block diagrams, in the spirit of the AES X230 typical-block-diagram sheets.
#
# Each entry is one block in a left-to-right signal chain. `source` names an
# extractor in js/chain.js that reads the record and returns the block's caption
# lines plus the fields it read — those fields are what the detail table under
# the drawing lists, so the drawing can always be traced back to data.
#
# `optional` blocks are omitted when their extractor finds nothing, which is
# what makes the drawing specific to one microphone rather than a generic
# diagram: a mic with no pad simply has no attenuator in its chain.
#
#   shape:  box | circle | triangle | antenna
#   flow:   audio (default) | digital | rf | control | power
MIC_CHAIN = [
    {"key": "transducer", "label": "TRANSDUCER", "shape": "circle", "source": "transducer"},
    {"key": "matrix", "label": "PATTERN MATRIX", "source": "patternMatrix", "optional": True},
    {"key": "pad", "label": "ATTENUATOR", "source": "pads", "optional": True},
    {"key": "filter", "label": "FILTER", "source": "filters", "optional": True},
    {"key": "preamp", "label": "PREAMP", "shape": "triangle", "source": "preamp", "optional": True},
    {"key": "output", "label": "OUTPUT", "source": "output", "optional": True},
    {"key": "connector", "label": "CONNECTOR", "source": "connector", "terminal": True},
]

# The wireless chain, following the X230 "MICROPHONE" sheet: the analog front
# end, then conversion, then the radio.
RF_CHAIN = [
    {"key": "transducer", "label": "TRANSDUCER", "shape": "circle", "source": "rfTransducer"},
    {"key": "preamp", "label": "PREAMP", "shape": "triangle", "source": "rfPreamp"},
    {"key": "adc", "label": "ADC", "source": "rfAdc", "flow": "digital"},
    {"key": "transmitter", "label": "TRANSMITTER", "source": "rfTransmitter", "flow": "digital"},
    {"key": "antenna", "label": "ANTENNA", "shape": "antenna", "source": "rfAntenna", "flow": "rf"},
    {"key": "out", "label": "RF (out)", "source": "rfOut", "terminal": True, "flow": "rf"},
]

# A microphone with more than one signal path. js/chain.js decides which case a
# record is — a stereo pair of capsules, the two diaphragms of a dual-backplate
# capsule feeding a pattern matrix, or both at once — and these are the words
# each one is drawn and tabulated with.
CHAIN_SPLITS = [
    {"key": "stereo", "label": "SIGNAL PATHS", "labels": ["LEFT", "RIGHT"]},
    {"key": "mid-side", "label": "SIGNAL PATHS", "labels": ["MID", "SIDE"]},
    {"key": "dual", "label": "DIAPHRAGMS", "labels": ["FRONT", "REAR"]},
]

# Feeds drawn entering the chain from below rather than in line with it.
# `kinds` keeps each feed to the record type whose fields its extractor reads.
CHAIN_FEEDS = [
    {"key": "power", "label": "POWER", "source": "power", "into": "preamp",
     "flow": "power", "optional": True, "kinds": ["mic"]},
    {"key": "control", "label": "CONTROL", "source": "rfControl", "into": "transmitter",
     "flow": "control", "optional": True, "kinds": ["rf"]},
]

# Legend for the flow colours, so the drawing explains its own wiring.
CHAIN_FLOWS = [
    {"key": "audio", "label": "Analog audio", "css": "var(--s3)"},
    {"key": "digital", "label": "Digital audio", "css": "var(--s1)"},
    {"key": "rf", "label": "RF", "css": "var(--s2)"},
    {"key": "power", "label": "Power", "css": "var(--s4)"},
    {"key": "control", "label": "Control", "css": "var(--s5)"},
]

# --------------------------------------------------------------- charts

# Stacked-bar series, in stacking order. Boundary/hybrid/unknown are ~7% between
# them and would render as slivers, so they fold into one "Other" slot rather
# than eating categorical hues that then fail CVD separation against neighbours.
TYPE_SERIES = [
    {"key": "condenser", "label": "Condenser", "css": "var(--s1)"},
    {"key": "dynamic", "label": "Dynamic", "css": "var(--s2)"},
    {"key": "ribbon", "label": "Ribbon", "css": "var(--s3)"},
    {"key": "other", "label": "Other / unspecified", "css": "var(--s4)"},
]

# Types that keep their own bar; anything else falls into the "other" series.
TYPE_SERIES_KEYS = ["condenser", "dynamic", "ribbon"]

# One hue per transducer type, shared by tree dots, list chips and charts.
TYPE_COLORS = {
    "condenser": "var(--s1)",
    "dynamic": "var(--s2)",
    "ribbon": "var(--s3)",
    "boundary": "var(--s4)",
    "hybrid": "var(--s5)",
    "wireless": "var(--s6)",
    "mixed": "var(--s7)",
    "unknown": "var(--faint)",
}

# Buckets for the price histogram, [min, max) in dollars.
PRICE_HISTOGRAM = [
    {"label": "< $100", "min": 0, "max": 100},
    {"label": "$100–249", "min": 100, "max": 250},
    {"label": "$250–499", "min": 250, "max": 500},
    {"label": "$500–999", "min": 500, "max": 1000},
    {"label": "$1k–2k", "min": 1000, "max": 2000},
    {"label": "$2k–5k", "min": 2000, "max": 5000},
    {"label": "$5k+", "min": 5000},
]

# Flags charted on the "Attributes" figure. `field` is a boolean model-row
# column; `equals` matches a string column instead.
STAT_ATTRIBUTES = [
    {"label": "Tube", "field": "tube"},
    {"label": "Multipattern", "field": "multi"},
    {"label": "Stereo", "field": "stereo"},
    {"label": "Sold as a kit", "field": "set"},
    {"label": "Has MSRP", "field": "msrp", "present": True},
    {"label": "Currently sold", "field": "avail", "equals": "current"},
]

# Controls on the brand-mix chart.
BRAND_CHART_TOPS = [
    {"key": "25", "label": "Top 25"},
    {"key": "50", "label": "Top 50"},
    {"key": "100", "label": "Top 100"},
    {"key": "999", "label": "All brands"},
]

BRAND_CHART_ORDERS = [
    {"key": "total", "label": "Catalogue size"},
    {"key": "condenser", "label": "% condenser"},
    {"key": "dynamic", "label": "% dynamic"},
    {"key": "ribbon", "label": "% ribbon"},
    {"key": "name", "label": "Name"},
]

# ------------------------------------------------------------- columns

# The statistics table. `key` is a field on a flattened index row.
EXPLORER_COLUMNS = [
    {"key": "brand", "label": "Brand"},
    {"key": "model", "label": "Model"},
    {"key": "type", "label": "Type"},
    {"key": "patterns", "label": "Patterns", "wrap": True, "patternNames": True},
    {"key": "form", "label": "Form"},
    {"key": "msrp", "label": "MSRP", "num": True},
    {"key": "year", "label": "Year", "num": True},
    {"key": "avail", "label": "Status"},
]

# The CSV export. `path` is a dotted path into a full microphone record.
#   kind omitted    value at `path`
#   bool            value at `path` as yes/no
#   list            array at `path`, joined; `field` picks one key off each item
#   perPattern      one entry per pickup pattern, prefixed when there are several
#   freqPerPattern  same, formatted as a frequency range
#   link            a deep link back into this browser
CSV_COLUMNS = [
    {"label": "Brand", "path": "identity.manufacturer"},
    {"label": "Model", "path": "identity.model"},
    {"label": "Full name", "path": "identity.full_name"},
    {"label": "Subtitle", "path": "classification.subtitle"},
    {"label": "Product type", "path": "classification.product_type"},
    {"label": "Transducer type", "path": "classification.transducer_type"},
    {"label": "Kit: microphones", "path": "kit.mic_count"},
    {"label": "Kit: models", "path": "kit.members", "kind": "list", "field": "name"},
    {"label": "Kit: quantities", "path": "kit.members", "kind": "list", "field": "quantity"},
    {"label": "Kit: types", "path": "kit.types", "kind": "list"},
    {"label": "Kit: parts MSRP", "path": "kit.parts_msrp"},
    {"label": "Kit: inherited fields", "path": "kit.inherited", "kind": "list"},
    {"label": "Form factor", "path": "classification.form_factor"},
    {"label": "Tube", "path": "classification.is_tube", "kind": "bool"},
    {"label": "Multipattern", "path": "classification.is_multipattern", "kind": "bool"},
    {"label": "Stereo", "path": "classification.is_stereo", "kind": "bool"},
    {"label": "Tags", "path": "classification.tags", "kind": "list"},
    {"label": "Patterns", "path": "specifications.pickup_patterns", "kind": "list", "field": "pattern"},
    {"label": "Pattern icons", "path": "classification.pattern_icons", "kind": "list"},
    {"label": "Sensitivity (mV/Pa)", "kind": "perPattern", "field": "sensitivity_mv_pa"},
    {"label": "Frequency response (Hz)", "kind": "freqPerPattern"},
    {"label": "Pattern spec (raw)", "path": "specifications.pickup_patterns", "kind": "list", "field": "raw"},
    {"label": "Pads", "path": "specifications.pads", "kind": "list", "field": "raw"},
    {"label": "Filters", "path": "specifications.filters", "kind": "list", "field": "raw"},
    {"label": "Diaphragm diameter (mm)", "path": "specifications.capsule.diaphragm_diameter_mm"},
    {"label": "Capsule diameter (mm)", "path": "specifications.capsule.capsule_diameter_mm"},
    {"label": "Diaphragm gauge (µm)", "path": "specifications.capsule.diaphragm_gauge_microns"},
    {"label": "Capsule (raw)", "path": "specifications.capsule.raw"},
    {"label": "Impedance (ohms)", "path": "specifications.impedance.ohms"},
    {"label": "Impedance category", "path": "specifications.impedance.category"},
    {"label": "Impedance (raw)", "path": "specifications.impedance.raw"},
    {"label": "Max SPL (dB)", "path": "specifications.spl_noise.max_spl_db"},
    {"label": "Self noise (dBA)", "path": "specifications.spl_noise.self_noise_dba"},
    {"label": "SPL/noise (raw)", "path": "specifications.spl_noise.raw"},
    {"label": "Weight (g)", "path": "specifications.physical.weight.grams"},
    {"label": "Weight (oz)", "path": "specifications.physical.weight.ounces"},
    {"label": "Length (mm)", "path": "specifications.physical.length.mm"},
    {"label": "Length (in)", "path": "specifications.physical.length.inches"},
    {"label": "Max diameter (mm)", "path": "specifications.physical.max_diameter.mm"},
    {"label": "Max diameter (in)", "path": "specifications.physical.max_diameter.inches"},
    {"label": "Interfaces", "path": "specifications.interfaces", "kind": "list", "field": "raw"},
    {"label": "Requires phantom power", "path": "specifications.power.requires_phantom_power", "kind": "bool"},
    {"label": "Phantom voltage (V)", "path": "specifications.power.phantom_voltage_v", "kind": "list"},
    {"label": "Includes tube PSU", "path": "specifications.power.includes_tube_power_supply", "kind": "bool"},
    {"label": "Battery compartment", "path": "specifications.power.has_battery_compartment", "kind": "bool"},
    {"label": "Battery type", "path": "specifications.power.battery_type"},
    {"label": "Power (raw)", "path": "specifications.power.raw"},
    {"label": "MSRP", "path": "pricing.msrp_amount"},
    {"label": "Currency", "path": "pricing.currency"},
    {"label": "MSRP (raw)", "path": "pricing.msrp_raw"},
    {"label": "Availability", "path": "pricing.availability"},
    {"label": "Release year", "path": "content.release_year"},
    {"label": "Related microphones", "path": "related_microphones", "kind": "list", "field": "name"},
    {"label": "Documentation links", "path": "links.documentation", "kind": "list", "field": "url"},
    {"label": "Review links", "path": "links.reviews_news", "kind": "list", "field": "url"},
    {"label": "Awards", "path": "links.awards", "kind": "list", "field": "title"},
    {"label": "Photo", "path": "media.primary_photo.full_url"},
    {"label": "Description", "path": "content.description_text"},
    {"label": "Source URL", "path": "source.url"},
    {"label": "Mic id", "path": "source.mic_id"},
    {"label": "Browser link", "kind": "link"},
]
