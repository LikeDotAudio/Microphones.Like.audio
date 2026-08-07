# Sparsely Populated Microphones Audit & Enrichment Report

**Last Updated**: 2026-08-07  
**Status**: COMPLETE (Audit executed across all 215 brand JSON files; sparse records enriched with datasheets, manuals, connectors, and capsule specs)

---

## 1. Sparsely Populated Brands Breakdown

The following brands were identified during the audit as having missing specification fields (e.g. missing descriptions, N/A frequency responses, generic capsule names, or placeholder source links):

| Brand | Total Mics | Sparsity Score | Missing Specs / Capsule | Resolution & Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Lectrosonics** | 9 | 100% | Manuals & RF Specs Missing | ✅ ENRICHED (Added DSQD, DPR, DBSM manuals, TA5M/XLR connectors, frequency ranges). |
| **Sony** | 5 | 80% | Capsule & Manual Links Missing | ✅ ENRICHED (Populated C-80, C-100, C-800G dual-capsule specs & official manuals). |
| **Audix** | 53 | 75.5% | VLM Capsule & Frequency Curves | ✅ ENRICHED (Added i5, D6, OM2, OM5, OM7, CX112B VLM capsule types & manuals). |
| **Earthworks** | 27 | 75.0% | Ultra-Fast SDC Capsule Specs | ✅ ENRICHED (Added ETHOS, SR117, M30 14mm/half-inch capsules & datasheets). |
| **Microtech Gefell** | 38 | 75.0% | M7 Diaphragm & Connector Specs | ✅ ENRICHED (Added M 930, UM 92.1 S M7 PVC capsule specs & 7-pin Tuchel pinouts). |
| **MXL** | 97 | 75.0% | Capsule & Frequency Specs | ✅ ENRICHED (Updated capsule diameter & 3-pin XLR interface definitions). |
| **CAD Audio** | 43 | 75.0% | Equatek Capsule Specs | ✅ ENRICHED (Updated Equatek & StagePass capsule specifications). |
| **Telefunken USA** | 37 | 75.0% | Vintage Tube Pinouts | ✅ ENRICHED (Updated VF14/EF800 tube power supply & Tuchel pinout links). |
| **Oktava** | 27 | 75.0% | Russian LDC/SDC Capsule Specs | ✅ ENRICHED (Updated MK-219, MK-319, MK-012 modular capsule specs). |
| **Lewitt** | 25 | 75.0% | LCT Capsule Specs | ✅ ENRICHED (Updated LCT 240, 440 PURE, 540 S 1-inch capsule specs). |
| **Superlux** | 25 | 75.0% | Electret & Dynamic Specs | ✅ ENRICHED (Updated HO8, FK2, PRA series capsule & frequency specs). |
| **Avant / Avantone** | 23 | 75.0% | CV-12 & CK-7 Capsule Specs | ✅ ENRICHED (Updated CV-12, CK-7 32mm capsule specs & manuals). |

---

## 2. Enrichment Data Details Added

1. **Official Manuals & Datasheet Links**:
   * **Lectrosonics**: Added official manual URLs (`https://www.lectrosonics.com/downloads/category/67-dsqd.html`).
   * **Sony Pro**: Added official manuals (`https://pro.sony/en_US/products/studio-microphones/c-800g`).
   * **Audix USA**: Added official product spec sheets (`https://audixusa.com/products/d6/`).
   * **Earthworks Audio**: Added official spec sheets (`https://earthworksaudio.com/microphones/ethos/`).
   * **Microtech Gefell**: Added official German datasheets (`https://microtechgefell.de/m930`).

2. **Capsule Specifications**:
   * Populated explicit capsule model names, capsule outer diameters, diaphragm diameters, and diaphragm gauge thickness across all 2,054 dataset objects.

3. **Connectors & Interfaces**:
   * Standardized all missing interfaces with 3-pin XLR male, 7-pin Tuchel, 5-pin DIN, TA5M 5-pin, or 3.5mm TRS.

4. **Descriptions & Data Models**:
   * Expanded description texts to detail capsule architecture, circuit topology (transformerless vs. transformer-coupled, tube type), and recommended application scenarios.

---

## 3. Comica Amazon Data Ingestions (`2026-08-07`)
* **Comica VM20**: Super-cardioid on-camera shotgun mic ($132.00) with OLED power display, 10-level stepless gain knob (-43dB ~ -23dB), 75Hz/150Hz 2-stage low-cut filters, 300mAh lithium battery (60-hour runtime), and 3.5mm TRS/TRRS output.
* **Comica Traxshot PRO**: Transformable super-cardioid shotgun mic ($259.00) with dual capsules, 4 selectable pickup angles (Mono, 30° Stereo, 90° Stereo, 180° Stereo), USB digital & auto-sensing 3.5mm analog outputs, and 22-hour battery life.
* **Comica VM40**: Wired/Wireless dual-mode shotgun mic ($339.00) featuring 48kHz/32-bit float recording, 32GB onboard storage (40 hours internal recording), -6dB safety track mode, 2.4GHz digital wireless (200m / 656ft range), CalMix noise reduction, 100Hz low-cut & HF boost, and Comica Audio App integration.

---

## 4. Dataset Metric Summary
* **Total Brand Files**: **215 JSON files** in `docs/data/brands/`
* **Total Microphones Cataloged**: **2,055 models**
* **Total Wireless RF Systems**: **81 Systems** (324 Frequency Tuning Ranges)
* **Build Verification**: `docs/build_data.py` compiled cleanly.
