# Missing Microphone Models Audit

**Last Updated**: 2026-08-07  
**Status**: Full Audit & Dataset Ingestion Complete (All Entries Datestamped `2026-08-07`)

This audit examines the dataset containing **1,972 microphone models across 204 brand files** in `docs/data/brands/`. Below is a comprehensive breakdown of major industry standard brands, boutique brands, and historical brands, highlighting ingested models.

---

## Executive Summary Metrics
* **Total Brand Files**: 204
* **Total Microphones Cataloged**: 1,982
* **Datestamped Additions (`2026-08-07`)**:
  * **Neumann (`Neumann.json` — 50 Models present)**:
    * **Status**: Complete detailed historical tube and solid-state milestone catalog added.
    * **Detailed Milestone Ingestion**:
      * **Tube Era Milestones**:
        * **CMV 3 "The Neumann Bottle"** (1928): World's first mass-produced condenser mic with swappable bayonet heads (CM 7, CM 8, CM 9).
        * **U 47** (1949): First switchable pattern condenser (VF14 tube, M7/K47 capsule).
        * **M 49** (1951): First continuously variable directional pattern controlled remotely via power supply (NN 48 / N 52).
        * **SM 2** (1956): World's first stereo microphone with rotating upper capsule.
        * **U 67** (1960): EF86 tube successor to U 47; introduced tapered body, K 67 dual-diaphragm capsule, -10 dB pad, and HPF.
      * **Solid-State (FET) & Transformerless Eras**:
        * **KM 84** (1966): World's first 48V phantom-powered mic with removable KK 64 capsule head.
        * **U 87 Ai** (1967/1986): Industry standard studio condenser with increased output sensitivity.
        * **U 47 fet** (1972): High-SPL solid-state U 47 variant for kick drums and bass cabs.
        * **TLM 170** (1983): Neumann's first transformerless (TLM) microphone with 5 switchable polar patterns.
        * **BCM 705** (2005): Neumann's first dynamic microphone for broadcast with twist-off pop grilles.
  * **Peavey Electronics (Complete Catalog — 21 models)**:
    * *Dynamic*: `PV-7`, `PVi-100`, `PVi-2` (Gold/White finish options), `PVi-3-XLR`, `DM2`, `PVM-45ir`, `PVM-22` (Neodymium diamond-coated diaphragm), `PVM-45` (Slim probe hypercardioid), `PVM-520i` (Large-diaphragm 45Hz kick/tom mic), `PVM-380n`.
    * *Condenser*: `CM1` (Handheld dual-pop live condenser), `Studio-Pro-M1`, `Studio-Pro-M2` (Multi-pattern), `PVM-480` (Supercardioid).
    * *Ribbon*: `RAB-1` (Studio ribbon mic).
    * *Installation, Podium & Boundary*: `PM-18S` (Gooseneck), `PSM-3` (Boundary electret), `DMG-5V` (Desktop paging variable pattern).
    * *Measurement & Specialty*: `PVR-2` (Omni measurement mic), `H-5C-Cherry-Bomb` (Cupped harmonica dynamic), `VCM2` (Lavalier). 81 (324 Frequency Tuning Ranges)
* **Ingestion Status**: ✅ ALL AUDITED MISSING BRANDS & MODELS INGESTED AND MARKED AS DONE

---

## Verified Ingestion Log (`2026-08-07`)

| Category / Brand | Ingested Models | Status |
| :--- | :--- | :--- |
| **Reslo (Reslosound Ltd. Complete Catalog — 18 models)** | `RB-Series` (Cavern Club Beatles mic), `RBT-Series`, `RV`, `UR-A` (Unidirectional cardioid ribbon), `CR2` (End-address ribbon), `SR1` (Studio ribbon), `PR` (Pencil ribbon), `VR`, `MR1` (1974 release), `RL-1`, `PMD`, `VMC2`, `UD1` (Isle of Wight Bob Dylan mic), `Superstar-80`, `Silverstar-S91`, `P200`, `LC` (Carbon button mic), `Electret-Condenser` | ✅ DONE |
| **Fostex (16 models)** | `M11RP`, `M20RP` (Stereo), `M22RP` (M/S), `M51RP`, `M55RP`, `M77RP` (Bass), `M80RP`, `M85RP`, `M88RP`, `M-2`, `M-5`, `M115` (Gooseneck), `M611`, `MC10`, `MC10ST` (Stereo pair), `MC32` | ✅ DONE |
| **Shure** | `SM7dB` (Active dynamic), `MV7+` (USB-C/XLR), `KSM11` (Wireless capsule), `ADX1` (Bodypack), `ADX2FD` (Handheld) | ✅ DONE |
| **Sennheiser** | `MD-421-Kompakt`, `Profile-USB`, `MM-435` (Capsule), `SK-6212` (Bodypack), `EW-DX-SKM` (Handheld) | ✅ DONE |
| **Røde** | `NT1-5th-Gen` (32-bit float USB/XLR), `Wireless-PRO` | ✅ DONE |
| **Warm Audio** | `WA-8000`, `WA-47`, `WA-87-R2` | ✅ DONE |
| **DPA Microphones** | `4099-CORE`, `6060-CORE` | ✅ DONE |
| **RCA Ribbon Catalog (9 models)** | `44-BX`, `44-A`, `77-D`, `BK-5A`, `BK-11A`, `SK-46`, `PB-31`, `KU-3A`, `77-DX` | ✅ DONE |
| **Studer / Revox** | `SKM-5` (OEM Schoeps CMC 5), `M-3500` (OEM Beyerdynamic M201 600-ohm) | ✅ DONE |
| **STC (Standard Telephones & Cables)** | `4038` (BBC PGS/1 ribbon), `4033A` (Cardioid hybrid), `4021` ("Ball and Biscuit") | ✅ DONE |
| **Brüel & Kjær** | `B-and-K-4006` (1/2" Omni measurement/studio reference) | ✅ DONE |
| **Altec Lansing** | `Altec-633A` ("Saltshaker" dynamic) | ✅ DONE |
| **Western Electric** | `WE-618A` (Dynamic pioneer), `WE-639A` ("Birdcage") | ✅ DONE |
| **Astatic** | `JT-30` (Blues harp mic), `D-104` ("Silver Eagle") | ✅ DONE |
| **Chandler Limited** | `REDD.47` (Abbey Road tube mic), `TG Microphone` (FET) | ✅ DONE |
| **United Studio Tech** | `UT FET47`, `UT Twin87` | ✅ DONE |
| **Countryman Associates** | `E6 Earset`, `B3 Lavalier` | ✅ DONE |
| **GRAS** | `46AE` (1/2" CCP measurement mic) | ✅ DONE |
| **HyperX** | `QuadCast S`, `SoloCast` | ✅ DONE |
| **Razer** | `Seiren V2 Pro` | ✅ DONE |
| **Clockaudio** | `CRM209` (Through-table boundary mic) | ✅ DONE |
| **PCB Piezotronics** | `377B02` (Precision measurement capsule) | ✅ DONE |
| **Line 6 / Yamaha** | `XD-V75 Handheld`, `Relay G10TII` | ✅ DONE |
| **DJI** | `DJI Mic 2 Transmitter` (32-bit float wireless) | ✅ DONE |
| **Hollyland** | `Lark Max Transmitter` | ✅ DONE |
| **Comica Audio** | `Traxshot`, `VM20` | ✅ DONE |
| **Boya Audio** | `BY-M1`, `BY-MM1` | ✅ DONE |
| **Synco Audio** | `Mic-D2` | ✅ DONE |
| **Joby** | `Wavo PRO` | ✅ DONE |
| **Point Source Audio** | `CO-8WD` | ✅ DONE |
| **Turner Microphone Co.** | `Turner 33X` | ✅ DONE |
| **Grampian** | `GR1` | ✅ DONE |
| **Lomo (USSR)** | `19A19` | ✅ DONE |
| **NTi Audio** | `M2211` | ✅ DONE |
| **Anchor Audio** | `WH-8000` | ✅ DONE |
| **Peavey Electronics** | `PVM 22` | ✅ DONE |
