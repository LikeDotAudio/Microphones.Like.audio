# Missing Microphone Brands Audit

**Last Updated**: 2026-08-07  
**Status**: COMPLETE (All Missing Brands Researched & Ingested into `docs/data/brands/`)

This document audits the brand list present in `docs/data/brands` against established professional audio standards, boutique manufacturers, podcasting/consumer brands, OEM/MEMS capsule manufacturers, and historical ribbon/dynamic mic pioneers.

---

## Audit Status Table: Brands Ingested & Verified

| Brand | Dataset Status | File Name | Ingestion Date | Status Note |
| :--- | :--- | :--- | :--- | :--- |
| **Brüel & Kjær (B&K)** | ✅ DONE | `Bruel-and-Kjaer.json` | 2026-08-07 | Precision measurement & studio reference (4006). |
| **Earthworks Audio** | ✅ DONE | `Earthworks.json` | 2026-08-07 | Expanded with ETHOS, SR117, 6060 CORE. |
| **Altec Lansing** | ✅ DONE | `Altec-Lansing.json` | 2026-08-07 | Saltshaker dynamic pioneer (633A). |
| **Shure** | ✅ DONE | `Shure.json` | 2026-08-07 | Major Industry Standard (Updated with SM7dB, MV7+, KSM11, Axient ADX). |
| **Sennheiser** | ✅ DONE | `Sennheiser.json` | 2026-08-07 | Major Industry Standard (Updated with MD 421 Kompakt, Profile USB, Digital 6000, EW-DX). |
| **Neumann** | ✅ DONE | `Neumann.json` | 2026-08-07 | Major Industry Standard. |
| **AKG Acoustics** | ✅ DONE | `AKG-Acoustics.json` | 2026-08-07 | Major Industry Standard (Updated with DMS300, WMS470 wireless). |
| **Audio-Technica** | ✅ DONE | `Audio-Technica.json` | 2026-08-07 | Major Industry Standard. |
| **Beyerdynamic** | ✅ DONE | `beyerdynamic.json` | 2026-08-07 | Major Industry Standard. |
| **Røde** | ✅ DONE | `Rode.json` | 2026-08-07 | Major Industry Standard (Updated with NT1 5th Gen, Wireless PRO). |
| **Telefunken** | ✅ DONE | `Telefunken.json`, `Telefunken-USA.json` | 2026-08-07 | High-End / Vintage. |
| **Microtech Gefell** | ✅ DONE | `Microtech-Gefell.json` | 2026-08-07 | Neumann East German lineage (38 models). |
| **DPA (Danish Pro Audio)** | ✅ DONE | `DPA.json` | 2026-08-07 | High-End Studio & Miniature (Updated with 4099 CORE, 6060 CORE). |
| **Schoeps** | ✅ DONE | `Schoeps.json` | 2026-08-07 | High-End Studio. |
| **Royer Labs** | ✅ DONE | `Royer-Labs.json` | 2026-08-07 | High-End Ribbon. |
| **AEA** | ✅ DONE | `AEA.json` | 2026-08-07 | High-End Ribbon. |
| **Coles Electroacoustics** | ✅ DONE | `Coles.json` | 2026-08-07 | High-End Ribbon (4038). |
| **Sanken** | ✅ DONE | `Sanken.json` | 2026-08-07 | Studio & Location Film Recording. |
| **Lewitt** | ✅ DONE | `Lewitt.json` | 2026-08-07 | High-End / Studio. |
| **Aston Microphones** | ✅ DONE | `Aston.json` | 2026-08-07 | Studio Condensers. |
| **sE Electronics** | ✅ DONE | `SE-Electronics.json` | 2026-08-07 | Studio & Live. |
| **Warm Audio** | ✅ DONE | `WarmAudio.json` | 2026-08-07 | Studio Hardware & Clones (Updated with WA-8000, WA-47, WA-87 R2). |
| **Mojave Audio** | ✅ DONE | `Mojave-Audio.json` | 2026-08-07 | Studio Tubes & FETs. |
| **Manley Laboratories** | ✅ DONE | `Manley.json` | 2026-08-07 | Reference Tube Microphones. |
| **Blue Microphones / Logitech**| ✅ DONE | `Blue-Microphones.json` | 2026-08-07 | Studio & Podcasting. |
| **Zoom Corporation** | ✅ DONE | `Zoom.json` | 2026-08-07 | Broadcast dynamics & mobile stereo recorders (ZDM-1, iQ7). |
| **TASCAM / TEAC** | ✅ DONE | `Tascam.json` | 2026-08-07 | Field Recorders & Studio Mics. |
| **Behringer** | ✅ DONE | `Behringer.json` | 2026-08-07 | Budget Studio & Stage. |
| **Samson Technologies** | ✅ DONE | `Samson.json` | 2026-08-07 | Budget & USB. |
| **Elgato** | ✅ DONE | `Elgato.json` | 2026-08-07 | Streaming / USB (Wave DX, Wave:3). |
| **Fifine** | ✅ DONE | `Fifine.json` | 2026-08-07 | USB / Broadcast / Budget (AM8, K669B). |
| **Maono** | ✅ DONE | `Maono.json` | 2026-08-07 | USB / Podcasting (PD400X). |
| **MXL** | ✅ DONE | `MXL.json` | 2026-08-07 | Budget & Home Studio. |
| **RCA** | ✅ DONE | `RCA.json` | 2026-08-07 | Historical Ribbon Pioneer (44-BX, 44-A, 77-D, BK-5A, BK-11A, SK-46, PB-31, KU-3A). |
| **Western Electric** | ✅ DONE | `Western-Electric.json` | 2026-08-07 | Moving-coil dynamic & cardioid ribbon pioneers (618A, 639A). |
| **Astatic** | ✅ DONE | `Astatic.json` | 2026-08-07 | Blues harp & communications mics (JT-30, D-104). |
| **STC (Standard Telephones and Cables)** | ✅ DONE | `STC.json` | 2026-08-07 | Historic British BBC ribbon pioneer (4038, 4033A, 4021). |
| **Studer / Revox** | ✅ DONE | `Studer.json` | 2026-08-07 | Swiss broadcast icons (SKM 5, Revox M3500). |
| **Fostex** | ✅ DONE | `Fostex.json` | 2026-08-07 | Japanese RP Printed Ribbon (M11RP through M88RP) & Dynamics. |
| **Reslo / Reslosound** | ✅ DONE | `Reslo.json` | 2026-08-07 | Complete 18-model catalog (RB Beatles mic, RBT, RV, UR-A, UD1, VMC2). |
| **Chandler Limited** | ✅ DONE | `Chandler-Limited.json` | 2026-08-07 | Abbey Road REDD.47 tube & TG condenser mics. |
| **United Studio Tech** | ✅ DONE | `United-Studio-Tech.json` | 2026-08-07 | Premium vintage FET recreations (UT FET47, UT Twin87). |
| **Countryman Associates** | ✅ DONE | `Countryman.json` | 2026-08-07 | Industry standard earset and lavaliers (E6 Earset, B3). |
| **GRAS Sound & Vibration** | ✅ DONE | `GRAS.json` | 2026-08-07 | High-precision acoustic measurement systems (46AE). |
| **HyperX** | ✅ DONE | `HyperX.json` | 2026-08-07 | Gaming and USB condenser mics (QuadCast S, SoloCast). |
| **Razer** | ✅ DONE | `Razer.json` | 2026-08-07 | Streaming & broadcast USB dynamic mics (Seiren V2 Pro). |
| **Clockaudio** | ✅ DONE | `Clockaudio.json` | 2026-08-07 | Architectural through-table boundary mics (CRM209). |
| **PCB Piezotronics** | ✅ DONE | `PCB-Piezotronics.json` | 2026-08-07 | Acoustic measurement capsules (377B02). |
| **Line 6 / Yamaha** | ✅ DONE | `Line6.json` | 2026-08-07 | 2.4GHz digital wireless systems (XD-V75, Relay G10). |
| **DJI** | ✅ DONE | `DJI.json` | 2026-08-07 | 2.4GHz 32-bit float wireless systems (DJI Mic 2). |
| **Hollyland** | ✅ DONE | `Hollyland.json` | 2026-08-07 | Wireless lavalier systems (Lark Max). |
| **Comica Audio** | ✅ DONE | `Comica.json` | 2026-08-07 | Transformable shotgun & video mics (Traxshot, VM20). |
| **Boya Audio** | ✅ DONE | `Boya.json` | 2026-08-07 | Mobile & lavalier mics (BY-M1, BY-MM1). |
| **Synco Audio** | ✅ DONE | `Synco.json` | 2026-08-07 | Broadcast shotgun mics (Mic-D2). |
| **Joby** | ✅ DONE | `Joby.json` | 2026-08-07 | Active noise reduction shotgun mics (Wavo PRO). |
| **Point Source Audio** | ✅ DONE | `Point-Source-Audio.json` | 2026-08-07 | IP57 waterproof headset mics (CO-8WD). |
| **Turner Microphone Co.** | ✅ DONE | `Turner.json` | 2026-08-07 | Art Deco vintage dynamic mics (Turner 33X). |
| **Grampian** | ✅ DONE | `Grampian.json` | 2026-08-07 | Historic British ribbon mics (GR1). |
| **Lomo (USSR)** | ✅ DONE | `Lomo.json` | 2026-08-07 | Soviet tube condenser legends (19A19). |
| **NTi Audio** | ✅ DONE | `NTi-Audio.json` | 2026-08-07 | Class 1 acoustic measurement mics (M2211). |
| **Anchor Audio** | ✅ DONE | `Anchor-Audio.json` | 2026-08-07 | PA wireless handheld mics (WH-8000). |
| **Peavey Electronics** | ✅ DONE | `Peavey.json` | 2026-08-07 | Dynamic vocal stage mics (PVM 22). |
