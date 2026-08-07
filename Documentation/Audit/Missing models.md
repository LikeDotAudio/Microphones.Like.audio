# Missing Microphone Models Audit

**Last Updated**: 2026-08-07  
**Status**: Full Audit & Dataset Ingestion Complete (All Entries Datestamped `2026-08-07`)

This audit examines the dataset containing **1,882 microphone models across 186 brand files** in `docs/data/brands/`. Below is a comprehensive breakdown of major industry standard brands, boutique brands, and historical brands, highlighting missing models released recently or omitted from historical catalogs.

---

## Executive Summary Metrics
* **Total Brand Files**: 186 (Expanded with `Chandler-Limited.json`, `United-Studio-Tech.json`, `Countryman.json`, `GRAS.json`, `HyperX.json`, `Razer.json`, `Clockaudio.json`, `PCB-Piezotronics.json`, `STC.json`, `Studer.json`, `Bruel-and-Kjaer.json`, `Altec-Lansing.json`, `Western-Electric.json`, `Astatic.json`, `Zoom.json`, `Elgato.json`, `Fifine.json`, `Maono.json`, `Universal-Audio.json`)
* **Total Microphones Cataloged**: 1,882
* **Datestamped Additions (`2026-08-07`)**:
  * **Chandler Limited**: `REDD.47`, `TG Microphone`
  * **United Studio Tech**: `UT FET47`, `UT Twin87`
  * **Countryman**: `E6 Earset`, `B3 Lavalier`
  * **GRAS**: `46AE`
  * **HyperX**: `QuadCast S`, `SoloCast`
  * **Razer**: `Seiren V2 Pro`
  * **Clockaudio**: `CRM209`
  * **PCB Piezotronics**: `377B02`
  * **STC (Standard Telephones and Cables)**: `4038`, `4033A`, `4021`
  * **RCA Ribbon Catalog**: `44-BX`, `44-A`, `77-D`, `BK-5A`, `BK-11A`, `SK-46`, `PB-31`
  * **Studer / Revox**: `SKM-5`, `M-3500`
  * **Shure**: `SM7dB`, `MV7+`
  * **Sennheiser**: `MD-421-Kompakt`, `Profile-USB`
  * **Røde**: `NT1-5th-Gen`, `Wireless-PRO`
  * **Warm Audio**: `WA-8000`, `WA-47`, `WA-87-R2`
  * **DPA Microphones**: `4099-CORE`, `6060-CORE`
  * **Brüel & Kjær**: `B-and-K-4006`
  * **Altec Lansing**: `Altec-633A`
  * **Western Electric**: `WE-618A`, `WE-639A`
  * **Astatic**: `JT-30`, `D-104`
  * **Zoom**: `ZDM-1`, `iQ7`
  * **Elgato**: `Wave-DX`, `Wave-3`
  * **Fifine**: `AM8`, `K669B`
  * **Maono**: `PD400X`
  * **Universal Audio**: `Sphere-DLX`, `SD-1`
* **Key Finding**: Many established brand files stop around 2018–2020 releases, leaving out recent innovations (e.g., Shure MV7/SM7dB, Neumann MCM/MT48 series, Rode Wireless PRO/Rode X, Austrian Audio expanded lines, Universal Audio Sphere/SD series). Furthermore, several premium brands (Telefunken, Sony, DPA, Schoeps, Warm Audio) currently have very incomplete model listings.

---

## 1. Major Industry Standards

### Shure (`Shure.json` — 91 Models present)
* **Current File Status**: `Shure.json` has 91 models, but is heavily skewed toward older RF units (`rf-PGX`, `rf-SLX`, `rf-ULXD4`) and legacy models, omitting numerous recent stage, studio, podcasting, and conferencing releases.
* **Missing Stage & Studio Microphones**:
  * **SM7dB** (Active dynamic with built-in preamp - 2023)
  * **Nexadyne 8/C & Nexadyne 8/S** (Revonic dual-engine dynamic vocal mics - 2024)
  * **Nexadyne 2** (Kick drum dynamic mic - 2025)
  * **Nexadyne 5** (Guitar amp dynamic mic - 2025)
  * **Nexadyne 6** (Tom/Snare dynamic mic - 2025)
  * **KSM11** (Flagship wireless/wired condenser vocal capsule)
  * **KSM32C, KSM40C, KSM44MP** (Modernized KSM series studio condensers)
  * **55SH Series II / Super 55** (Standard modern variant verification)
* **Missing Podcasting, Content Creation & Mobile**:
  * **MV7 / MV7+** (XLR/USB podcasting dynamic mic standard)
  * **MV7X** (Dedicated XLR dynamic podcast mic)
  * **MV7i Smart Microphone** (Dynamic mic with integrated audio interface & DSP - 2025)
  * **MV6** (USB gaming dynamic microphone - 2024)
  * **MV88+ Video Kit / MV88+ Stereo USB** & **MV88 USB-C** (Mobile stereo condensers)
  * **MV5 / MV5C** (Home office & podcast desktop condensers)
* **Missing Architectural & Conferencing Microphones**:
  * **MXA920 / MXA901 / MXA925** (Microflex Advance ceiling array microphones)
  * **MXA710** (Linear array microphone)
  * **MXW neXt 2 / 4 / 8** (Microflex Wireless system components)

### Sennheiser (`Sennheiser.json` — 71 Models present)
* **Current File Status**: `Sennheiser.json` has 71 models, but lacks modern creator, wireless, shotgun, and conferencing lineups introduced between 2020 and 2026.
* **Missing Studio & Live Performance Microphones**:
  * **MD 421 Kompakt** (Redesigned compact dynamic studio/drum mic - 2024)
  * **MD 421-II** (Standard modern revision)
  * **E 935 / E 945 / E 965** (Verify modern Wireless capsule heads MM 435, MM 445, MM 935)
  * **MM 435 / MM 445** (High-end dynamic wireless capsules)
* **Missing Podcasting, Creator & Wireless Systems**:
  * **Profile USB Microphone** (Desktop streaming/podcasting mic - 2023)
  * **Profile Wireless (2-Channel System)** (2.4GHz camera/computer system - 2024)
  * **Profile Wireless (Single-Channel System)** (Solo creator wireless system - 2025)
  * **EW-D / EW-DX Series** (Evolution Wireless Digital system microphones & transmitters)
  * **MKE 200 / MKE 400 (2nd Gen) / MKE 600** (On-camera shotgun & vlogging mics)
  * **XS Lav USB-C / XS Lav Wireless** (Mobile lavalier systems)
* **Missing Installed & Ceiling Microphones**:
  * **TeamConnect Ceiling 2 (TCC 2)** (Ceiling beamforming microphone array)
  * **TeamConnect Ceiling Medium (TCC M / TCC M Plus)** (Compact ceiling mic - 2024–2026)

### Neumann (`Neumann.json` — 40 Models present)
* **Missing Models**:
  * **MCM (Miniature Clip Mic System)**: KK 13 (Omni capsule), KK 14 (Cardioid capsule), MC 1 through MC 9 mounting hardware systems.
  * **TLM 102 Custom/Anniversary Limited Editions**
  * **TLM 107** (Multi-pattern condenser - verify variant completeness)
  * **KMS 104 Plus / KMS 105** (Stage vocal condensers - check capsule variants)
  * **BCM 104 / BCM 705** (Broadcast dynamic and condenser mics)

### AKG Acoustics (`AKG-Acoustics.json` — 97 Models present)
* **Missing Models**:
  * **Lyra** (Ultra-HD multi-mode USB microphone)
  * **Ara** (Two-pattern USB condenser mic)
  * **C414 XLS / C414 XLII (Modern Matched Pair variants)**
  * **P120 / P220 / P420 (Perception series modern revisions)**
  * **C636** (Master reference condenser vocal mic)

### Audio-Technica (`Audio-Technica.json` — 150 Models present)
* **Missing Models**:
  * **AT2020USB-X / AT2020USB+** (Modern USB revisions)
  * **AT2040 / AT2040USB** (Hypercardioid podcast dynamic mic)
  * **AT4050ST** (Stereo condenser)
  * **BP40** (Large-diaphragm broadcast dynamic mic)
  * **System 10 PRO / ATW series capsule heads**

### Beyerdynamic (`beyerdynamic.json` — 48 Models present)
* **Missing Models**:
  * **M 70 PRO X** (Dynamic broadcast microphone)
  * **M 90 PRO X** (True condenser studio microphone)
  * **FOX** (USB studio microphone)
  * **TG V50 / TG V70** (Touring Gear vocal dynamics)
  * **MM 1** (Precision measurement condenser mic)

### Røde (`Rode.json` — 40 Models present)
* **Missing Models**:
  * **NT1 5th Generation** (Dual-connect XLR/USB with 32-bit float output)
  * **NT1 Signature Series** (2023 release in multiple colors)
  * **Røde X XDM-100** (USB dynamic mic)
  * **Røde X XCM-50** (USB condenser mic)
  * **Wireless PRO** (32-bit float wireless kit)
  * **Wireless ME** / **Wireless GO II Dual**
  * **PodMic USB** (XLR/USB dynamic broadcast mic)
  * **VideoMic NTG / VideoMic GO II**

---

## 2. High-End Studio & Boutique Brands

### Earthworks Audio (`Earthworks.json` — 27 Models present)
* **Missing Models**:
  * **ETHOS** (Flagship studio vocal condenser mic)
  * **ICON / ICON Pro** (Studio USB/XLR studio condensers)
  * **SR117** (Supercardioid dynamic vocal mic)
  * **SR314** (Premium handheld condenser vocal mic)
  * **DK7 / DrumKit Series** (Modern revision packages)
  * **M23R / M30R** (Calibration/Measurement reference series)

### Telefunken (`Telefunken.json` — 3 Models & `Telefunken-USA.json` — 42 Models)
* **Missing Models**:
  * **TF11 FET** (Alchemy series FET condenser)
  * **TF29 Copperhead** (Alchemy tube series)
  * **TF39 Copperhead Deluxe** (Multi-pattern Alchemy)
  * **TF47** (German-voiced Alchemy tube mic)
  * **TF51** (Austrian-voiced Alchemy tube mic)
  * **M80 / M81 Custom / Chrome / Color Series** (Stage dynamic standards)

### Microtech Gefell (`Microtech-Gefell.json` — 38 Models present)
* **Status**: Microtech Gefell (originally founded by Georg Neumann in Gefell, East Germany in 1943) is present in the dataset.
* **Missing Models**:
  * **CMV 563 / M7S** (Modern re-issue capsule variants & N 692 power supply configurations)
  * **KMS 105 / Gefell Stage Vocal Variants**
  * **KEM 975** (Line array cardioid boundary/pennant microphone)
  * **KEM 970** (Cardioid line array microphone)
  * **TM 190.2** (Broadcasting / gooseneck condenser mic)
  * **MK 250 / MK 301** (1/2" and 1" measurement capsules)
  * **M 310 / M 320** (Small diaphragm cardioid/supercardioid studio mics)

### DPA Microphones (`DPA.json` — 7 Models present — Extremely Sparse)
* **Current Models in Dataset**: `2011C`, `3532-S`, `4006A`, `4041-S`, `4052`, `d:facto`, `ST2011C`.
* **Missing Industry-Standard Product Lines**:
  * **d:vote / 4099 CORE Instrument Clip Microphones**: 4099-DC-1 (Guitar, Violin, Sax, Drums, Bass, Piano, Brass clips).
  * **d:screet Lavalier Series**: 4060, 4061, 4062, 4063, 4071, and 6060 / 6061 CORE (Subminiature 3mm capsules).
  * **d:fine Headset Microphones**: 4066, 4088, 4166, 4266, 4466, 4488 CORE headsets.
  * **d:dicate Recording Modular Series**:
    * **Preamp Bodies**: MMP-A, MMP-B, MMP-C, MMP-E, MMP-G.
    * **Capsules**: MMC4006 (Omni), MMC4011 (Cardioid), MMC4015 (Wide Cardioid), MMC4017 (Shotgun), MMC4018 (Supercardioid), MMC2006, MMC2011.
  * **Complete Microphone Systems**: 4006C, 4011A, 4011C, 4015A, 4015C, 4017B, 4017C, 4018A, 4018C, 4018VL.
  * **Handheld / Stage Vocal Mics**: 2028 Handheld Vocal Mic, d:facto 4018V / 4018VL.
  * **Surround & Ambisonics**: 5100 Mobile Surround Microphone system.

### Schoeps (`Schoeps.json` — 7 Models present — Severely Incomplete)
* **Missing Models**:
  * **Colette Modular Series**: CMC 6, CMC 1 amplifier bodies; MK 4, MK 41, MK 2, MK 22 capsules.
  * **V4 U** (Studio vocal condenser)
  * **CMIT 5** (Blue shotgun microphone industry standard)
  * **MiniCMIT** (Compact shotgun mic)
  * **SuperCMIT** (Digital dual-capsule shotgun mic)

### Sony (`Sony.json` — 5 Models present — Severely Incomplete)
* **Missing Models**:
  * **C-80** (Unidirectional condenser mic)
  * **C-100** (Two-way hi-res condenser mic)
  * **C-38B** (ClassicFET condenser legend)
  * **ECM-77B** (Industry standard lavalier mic)
  * **ECM-VG1 / ECM-MS2** (Shotgun & stereo mics)

### Universal Audio / Townsend Labs (Brand missing entirely)
* **Missing Models**:
  * **Sphere L22** / **Sphere DLX** / **Sphere LX** (Modeling microphones)
  * **SD-1** (Standard Dynamic Broadcast Mic)
  * **SC-1** (Large Diaphragm Studio Condenser)
  * **SP-1** (Pencil Condenser Pair)

### Warm Audio (`WarmAudio.json` — 1 Model present — Severely Incomplete)
* **Missing Models**:
  * **WA-47** / **WA-47 Jr** (Tube & FET condenser)
  * **WA-87 R2** (Large diaphragm FET condenser)
  * **WA-67** (Tube condenser)
  * **WA-14** (Brass capsule C414-style mic)
  * **WA-251** (Tube condenser)
  * **WA-8000** (Tube condenser)
  * **WA-CX12** (Tube condenser)
  * **WA-19** (Dynamic studio mic)

### Lewitt (`Lewitt.json` — 25 Models present)
* **Missing Models**:
  * **LCT 1040** (Flagship tube/FET microphone system)
  * **LCT 240 PRO** (Entry studio condenser)
  * **LCT 440 PURE** (Large diaphragm studio mic)
  * **LCT 540 S** (Sub-zero self-noise condenser)
  * **RAY** (AURA autofocus audio mic - 2024 release)
  * **MTP W950** (Premium modular handheld condenser)

---

## 3. Defunct, Vintage & Historical Pioneers

### Brüel & Kjær (B&K) (Brand missing entirely)
* **Missing Models**:
  * **B&K 4006** (Original high-voltage omni measurement/studio mic)
  * **B&K 4011** (Original cardioid studio mic)
  * **B&K 4133 / 4145 / 4180** (Precision 1/2" and 1" measurement capsules)

### Altec Lansing (Brand missing entirely)
* **Missing Models**:
  * **633A "Saltshaker"** (Dynamic microphone standard)
  * **639A / 639B "Birdcage"** (Ribbon/Dynamic cardioid mic)
  * **M11 / 21B "Coke Bottle"** (Condenser microphone system)
  * **M20 / M30** (Tube condenser systems)

### Western Electric (Brand missing entirely)
* **Missing Models**:
  * **618A** (First electrodynamic moving-coil microphone, 1931)
  * **630A "Eight Ball"** (Omni dynamic microphone)
  * **633A** (Progenitor to Altec Saltshaker)
  * **639A / 639B** (Multi-pattern cardioid)

### Astatic Corporation (Brand missing entirely)
* **Missing Models**:
  * **D-104** (The "Silver Eagle" communications/harmonica mic)
  * **JT-30** (Legendary blues harp microphone)
  * **335L / 333** (Dynamic studio/dispatch mics)

---

## 4. Priority Expansion Recommendations

1. **Top Priority Releases (2021–2026 Modern Industry Additions)**:
   - Shure SM7dB, Nexadyne 8/C, MV7+
   - Rode NT1 5th Gen, Wireless PRO, PodMic USB
   - Neumann MCM KK 14, BCM 104
   - Sennheiser Profile Wireless, MD 421 Kompakt
   - Earthworks ETHOS, SR117

2. **Incomplete Brand File Overhauls**:
   - Expand `WarmAudio.json` (add 8+ models)
   - Expand `DPA.json` (add 10+ core models)
   - Expand `Schoeps.json` (add Colette series modular components)
   - Expand `Sony.json` (add C-80, C-100, ECM-77B)

3. **New Vintage/Historical Brand Integrations**:
   - Create `Bruel-and-Kjaer.json`
   - Create `Altec-Lansing.json`
   - Create `Western-Electric.json`
   - Create `Astatic.json`
