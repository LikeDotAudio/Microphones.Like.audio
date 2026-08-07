# Missing Microphone Brands Audit

**Last Updated**: 2026-08-07  
**Status**: Full Dataset Expansion Complete (186 Brand JSON Files)

This document audits the brand list present in `docs/data/brands` against established professional audio standards, boutique manufacturers, podcasting/consumer brands, OEM/MEMS capsule manufacturers, and historical ribbon/dynamic mic pioneers.

---

## Complete Brand Additions Ingested Into Dataset (2026-08-07)
The following missing brands were researched and added as full JSON brand definitions in `docs/data/brands/`:

1. **Brüel & Kjær** (`Bruel-and-Kjaer.json`): Progenitor of measurement & precision studio microphones (B&K 4006).
2. **Altec Lansing** (`Altec-Lansing.json`): Classic broadcast dynamics and tube mics (633A "Saltshaker").
3. **Western Electric** (`Western-Electric.json`): Moving-coil dynamic and cardioid ribbon pioneers (618A, 639A "Birdcage").
4. **Astatic Corporation** (`Astatic.json`): Blues harp and communications microphone legends (JT-30, D-104 "Silver Eagle").
5. **Studer / Revox** (`Studer.json`): Swiss broadcast icons (SKM 5, Revox M3500).
6. **STC** (`STC.json`): British BBC ribbon & dynamic pioneers (4038, 4033A, 4021).
7. **Zoom Corporation** (`Zoom.json`): Broadcast dynamics & mobile stereo recorders (ZDM-1, iQ7).
8. **Elgato** (`Elgato.json`): Streamer/creator dynamic and USB microphones (Wave DX, Wave:3).
9. **Fifine Technology** (`Fifine.json`): Gaming, podcasting, and budget studio microphones (AM8, K669B).
10. **Maono** (`Maono.json`): Dual-connect XLR/USB dynamic podcasting microphones (PD400X).
11. **Universal Audio** (`Universal-Audio.json`): Precision modeling and standard studio dynamics (Sphere DLX, SD-1).
12. **Chandler Limited** (`Chandler-Limited.json`): Abbey Road REDD.47 tube & TG condenser microphones.
13. **United Studio Tech** (`United-Studio-Tech.json`): Premium vintage FET recreations (UT FET47, UT Twin87).
14. **Countryman Associates** (`Countryman.json`): Industry standard earset and lavalier microphones (E6 Earset, B3 Lavalier).
15. **GRAS Sound & Vibration** (`GRAS.json`): High-precision acoustic measurement microphone systems (46AE).
16. **HyperX** (`HyperX.json`): Gaming and USB condenser microphones (QuadCast S, SoloCast).
17. **Razer** (`Razer.json`): Streaming & broadcast USB dynamic microphones (Seiren V2 Pro).
18. **Clockaudio** (`Clockaudio.json`): Architectural and boundary through-table microphones (CRM209).
19. **PCB Piezotronics** (`PCB-Piezotronics.json`): Acoustic measurement capsules (377B02).

---

## 1. Brands Mentioned in Prompt Audit

| Brand | In Dataset? | Dataset File / Status | Notes |
| :--- | :--- | :--- | :--- |
| **Studer / Revox** | ✅ Present | `Studer.json` (2 models) | Swiss audio icon (OEM Schoeps SKM 5 & Beyerdynamic M3500) |
| **Brüel & Kjær (B&K)** | ❌ Missing | Not found in `docs/data/brands` | Legendary measurement & studio mics (progenitor to DPA). |
| **Earthworks Audio** | ⚠️ Partial/Misplaced | Present as `Earthworks.json`, but user noted missing models/verification | High-precision measurement & studio condenser mics. |
| **Altec Lansing** | ❌ Missing | Not found | Historical icon (633A "Saltshaker", 639 "Birdcage", etc.). |
| **Shure** | ✅ Present | `Shure.json` | Major Industry Standard |
| **Sennheiser** | ✅ Present | `Sennheiser.json` | Major Industry Standard |
| **Neumann** | ✅ Present | `Neumann.json` | Major Industry Standard |
| **AKG Acoustics** | ✅ Present | `AKG-Acoustics.json` | Major Industry Standard |
| **Audio-Technica** | ✅ Present | `Audio-Technica.json` | Major Industry Standard |
| **Beyerdynamic** | ✅ Present | `beyerdynamic.json` | Major Industry Standard |
| **Røde** | ✅ Present | `Rode.json` | Major Industry Standard |
| **Telefunken** | ✅ Present | `Telefunken.json`, `Telefunken-USA.json` | High-End / Vintage |
| **Microtech Gefell** | ✅ Present | `Microtech-Gefell.json` (38 models) | East German Neumann lineage (Gefell) |
| **DPA (Danish Pro Audio)** | ✅ Present | `DPA.json` | High-End Studio |
| **Schoeps** | ✅ Present | `Schoeps.json` | High-End Studio |
| **Royer Labs** | ✅ Present | `Royer-Labs.json` | High-End Ribbon |
| **AEA** | ✅ Present | `AEA.json` | High-End Ribbon |
| **Coles Electroacoustics** | ✅ Present | `Coles.json` | High-End Ribbon (4038) |
| **Sanken** | ✅ Present | `Sanken.json` | Studio & Film/Location |
| **Lewitt** | ✅ Present | `Lewitt.json` | High-End / Studio |
| **Aston Microphones** | ✅ Present | `Aston.json` | Studio Condensers |
| **sE Electronics** | ✅ Present | `SE-Electronics.json` | Studio & Live |
| **Warm Audio** | ✅ Present | `WarmAudio.json` | Studio Clones & Hardware |
| **Mojave Audio** | ✅ Present | `Mojave-Audio.json` | Studio Tubes & FETs |
| **Manley Laboratories** | ✅ Present | `Manley.json` | Reference Tube Microphones |
| **Blue Microphones / Logitech** | ✅ Present | `Blue-Microphones.json` | Studio & Podcasting |
| **Zoom Corporation** | ❌ Missing | Not found | Handy Recorders & Interchangeable Capsules (IQ7, ZDM-1, etc.). |
| **TASCAM / TEAC** | ✅ Present | `Tascam.json` (Needs expansion) | Field Recorders & Studio Mics (TM-80, etc.). |
| **Behringer** | ✅ Present | `Behringer.json` | Budget Studio & Stage |
| **Samson Technologies** | ✅ Present | `Samson.json` | Budget & USB |
| **Elgato** | ❌ Missing | Not found | Streaming / USB (Wave:1, Wave:3, Wave DX). |
| **Fifine** | ❌ Missing | Not found | USB / Broadcast / Budget |
| **Maono** | ❌ Missing | Not found | USB / Podcasting / Budget |
| **MXL** | ✅ Present | `MXL.json` | Budget & Home Studio |
| **Knowles Corporation** | ❌ Missing | Not found | World leader in MEMS & balanced armature mic capsules. |
| **Goertek** | ❌ Missing | Not found | Major OEM / MEMS manufacturer for mobile & consumer tech. |
| **STMicroelectronics** | ❌ Missing | Not found | MEMS sensor & silicon mic manufacturer. |
| **TDK Corporation (InvenSense)**| ❌ Missing | Not found | High-SNR MEMS microphones. |
| **Infineon Technologies** | ❌ Missing | Not found | Sealed Dual Membrane MEMS mics. |
| **AAC Technologies** | ❌ Missing | Not found | OEM MEMS & acoustic solutions. |
| **RCA** | ✅ Present | `RCA.json` (9 models) | Historical Ribbon Pioneer (44-BX, 44-A, 77-DX, 77-D, BK-5A, BK-11A, SK-46, PB-31, KU-3A) |
| **STC (Standard Telephones and Cables)** | ✅ Present | `STC.json` (3 models) | Historic British BBC ribbon/dynamic pioneer (4038, 4033A, 4021); manufacturing transitioned to Coles Electroacoustics in 1974. |
| **Western Electric** | ✅ Present | `Western-Electric.json` (2 models) | Pioneer of early condenser & dynamic mics (618A, 639A). |
| **Astatic** | ❌ Missing | Not found | Vintage & Communications microphones (JT-30, D-104). |

---

## 2. Additional Missing & Notable Microphone Brands (Comprehensive Web & Industry Search)

### A. Professional, Studio & Boutique Brands Missing
1. **Heininger / Josephson Audio** (Check model completeness)
2. **Chandler Limited** (EMI/Abbey Road REDD Microphones & TG Microphones)
3. **United Studio Tech** (UT FET47, UT Twin87)
4. **Soyuz Microphones** (Present as `Soyuz.json` - needs model expansion)
5. **Townsend Labs / Universal Audio** (Sphere L22, SC-1, SD-1, SP-1 series)
6. **Lauten Audio** (Present as `Lauten.json` - needs modern series audit)
7. **JZ Microphones** (Present as `JZ.json`)
8. **SOVTUBE / Gefell Vintage Variants**
9. **Austrian Audio** (Present as `Austrian-Audio.json` - needs OC818, OC18, OD505 expansion)
10. **Custom Shop / Handbuilt Pioneers**:
    - **FLEA Microphones** (Present as `FLEA.json`)
    - **Stager Microphones** (Present as `stager.json`)
    - **Extinct Audio** (Present as `Extinct-Audio.json`)
    - **Bock Audio / Bock iFET** (Present as `bock-audio.json`)

### B. Broadcast, Podcasting, Content Creation & USB Brands Missing
1. **Elgato** (Wave DX, Wave 3, Wave 1)
2. **Fifine Technology** (K669B, AM8, K688, Dynamic USB Mics)
3. **Maono** (PD400X, AU-A04, PM422)
4. **HyperX** (QuadCast, QuadCast S, SoloCast, ProCast)
5. **Razer** (Seiren V2 Pro, Seiren Mini, Seiren Emote)
6. **Røde (Modern Additions)** (Røde X series, Wireless PRO, Wireless ME)
7. **Joby** (Wavo PRO, Wavo POD)
8. **Synco** (Mic-D2, Wireless Lavalier Systems)
9. **Boyas / Boya Audio** (BY-M1, BY-MM1, Wireless Shotguns)
10. **Comica Audio** (Traxshot, VM20, BoomX-D)

### C. Live Sound & Installed Sound Brands Missing
1. **Countryman Associates** (E6 Earset, B3, B6 Lavalier industry standards)
2. **DPA Microphones** (Check 4099, 4006, 6060 line completeness)
3. **Point Source Audio** (CO-8WD, EMB-28)
4. **Clockaudio** (C301, CRM209 boundary & gooseneck installation mics)
5. **Anchor Audio**
6. **Peavey Electronics** (PVM series, Studio Pro)

### D. Historical, Vintage & Defunct Pioneers Missing
1. **Brüel & Kjær (B&K)** (4006, 4011 measurement/studio progenitors)
2. **Altec Lansing** (633A "Saltshaker", 639A/B "Birdcage", M11/M20 "Coke Bottle" tube mics)
3. **Western Electric** (618A dynamic, 630A, 639A)
4. **Astatic Corporation** (D-104 crystal mic, JT-30 harp mic, 335L)
5. **Turner Microphone Company** (Turner 33, 22X, 50D vintage dynamics/crystals)
6. **STC / Standard Telephones and Cables** (4038 - now Coles 4038, 4033A)
7. **Grampian** (GR1, GR2 vintage UK ribbons)
8. **Reslo / Reslosound** (RB Ribbon, RBT, RV)
9. **Lomo (USSR)** (19A9, 19A19, 82A5 tube condenser legends)
10. **Oktava (Historical Soviet)** (MK-219, MK-319, ML-19 ribbon)

### E. Acoustic Measurement & Calibration Specialist Brands Missing
1. **Brüel & Kjær (B&K)**
2. **GRAS Sound & Vibration** (46AE, 40AQ measurement microphones)
3. **NTi Audio** (M2211, M4261 measurement mics)
4. **microtech gefell (Measurement line)**
5. **PCB Piezotronics / LarSon Davis** (377B02 1/2" precision mics)

---

## 3. Recommended Action Plan for Dataset Expansion

1. **Add Missing Brand Files (`.json`)**:
   - `Bruel-and-Kjaer.json`
   - `Altec-Lansing.json`
   - `Western-Electric.json`
   - `Astatic.json`
   - `Elgato.json`
   - `Fifine.json`
   - `Maono.json`
   - `Zoom.json`
   - `Countryman.json`
   - `GRAS.json`
   - `Universal-Audio.json`
   - `HyperX.json`

2. **OEM & MEMS Section**:
   - Create a dedicated schema/category for MEMS capsule manufacturers (`Knowles`, `Goertek`, `Infineon`, `STMicroelectronics`, `TDK-InvenSense`, `AAC`).
