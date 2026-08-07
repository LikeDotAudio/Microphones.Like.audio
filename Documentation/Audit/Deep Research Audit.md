# Deep Research & Missing Manufacturers Audit

**Last Updated**: 2026-08-07  
**Status**: COMPLETE — All Missing Manufacturers & Models Fully Researched and Ingested into Dataset

---

## 1. Missing Manufacturers Ingested

| Manufacturer | Brand File | Models Ingested | Key Highlights & Product Description |
| :--- | :--- | :--- | :--- |
| **Deity Microphones** | `Deity.json` | `S-Mic 2`, `S-Mic 2S`, `BP-TX` | Location sound shotguns & 2.4GHz digital wireless bodypack systems. |
| **Saramonic** | `Saramonic.json` | `Blink 500 B2`, `Vmic Mini` | On-camera shotguns & dual-channel wireless lavalier systems. |
| **Roland** | `Roland.json` | `CG-1` | USB gaming & streaming microphone for Bridge Cast setups. |
| **Logitech G** | `Logitech.json` | `Yeti GX`, `Yeti Orb` | Dynamic & condenser LIGHTSYNC RGB gaming microphones. |
| **Mackie** | `Mackie.json` | `EM-91C`, `EM-89D`, `EM-USB` | EleMent series studio condensers, dynamics, and USB microphones. |
| **PreSonus** | `PreSonus.json` | `PD-70`, `PX-1`, `Revelator` | Broadcast dynamic, studio condenser, and onboard DSP USB microphones. |
| **Antelope Audio** | `Antelope-Audio.json` | `Edge Solo`, `Edge Duo`, `Axino Synergy Core` | Modeling microphones with real-time FPGA/DSP vintage mic emulation. |
| **Crown Audio** | `Crown.json` | `PZM-30D`, `CM-311A` | Industry-standard Pressure Zone Microphone (PZM) & noise-canceling headset. |
| **Townsend Labs** | `Townsend-Labs.json` | `Sphere L22` | Dual-capsule 3D modeling condenser system allowing post-recording pattern control. |
| **Bang & Olufsen** | `Bang-and-Olufsen.json` | `BM3`, `BM4`, `BM5` | Historic Danish vintage ribbon microphones & Blumlein stereo system. |
| **dbx Professional** | `dbx.json` | `DriveRack RTA-M` | Real-time acoustic analyzer measurement microphone for PA tuning. |

---

## 2. Ingested Models for Listed Manufacturers

| Brand | Brand File | Newly Added Models | Notes & Key Features |
| :--- | :--- | :--- | :--- |
| **sE Electronics** | `SE-Electronics.json` | `V7`, `DynaCaster`, `sE7`, `sE8` | Live vocal dynamic, broadcast dynamic with Dynamite preamp, and pencil SDCs. |
| **Telefunken** | `Telefunken.json` | `TF11 FET`, `TF29 Copperhead`, `TF39`, `TF47`, `TF51` | Complete Alchemy series FET and tube condenser lineup. |
| **Blue Microphones** | `Blue-Microphones.json` | `Yeti X`, `Yeti Nano` | Flagship 4-capsule USB mic with Blue VO!CE & 24-bit compact USB condenser. |
| **DPA Microphones** | `DPA.json` | `4011`, `4018`, `4060` | Reference cardioid, supercardioid boom mic, and miniature omni lavalier. |
| **Electro-Voice** | `Electro-Voice.json` | `PolarChoice PC-18` | Multi-pattern podium gooseneck condenser microphone. |
| **Sennheiser** | `Sennheiser.json` | `MD 421-II`, `MD 441-U`, `e 604`, `e 609 Silver`, `e 906`, `e 835`, `e 935`, `e 945`, `MKH 416` | Wired workhorse dynamics, Evolution series stage mics, and RF shotgun reference. |
| **Shure** | `Shure.json` | `KSM8 Dualdyne`, `Super 55`, `MV7`, `PGA27`, `PGA181` | Dual-diaphragm dynamic, deluxe vintage supercardioid, and PGA series. |
| **Neumann** | `Neumann.json` | `TLM 170`, `TLM 193`, `KU 100`, `D-01`, `M 49 V` | Transformerless series, binaural dummy head, digital AES42 mic, and M 49 V reissue. |
| **Røde** | `Rode.json` | `PodMic`, `Wireless GO II`, `VideoMic NTG`, `NT-USB Mini`, `TF-5` | Broadcast podcasting dynamic, compact wireless system, and Tony Faulkner SDC pair. |
| **AKG Acoustics** | `AKG-Acoustics.json` | `C414 B-ULS`, `D112 MKII`, `Lyra`, `Ara` | Ultra-flat vintage multi-pattern reference, kick drum dynamic, and USB condensers. |
| **Audio-Technica** | `Audio-Technica.json` | `BP40`, `AT2040`, `AT875R` | Broadcast dynamic with floating 37mm capsule, podcast dynamic, and short shotgun. |
| **beyerdynamic** | `beyerdynamic.json` | `TG V70d`, `TG V50d`, `TG D71`, `Fox` | Touring gear dynamic vocal mics, boundary kick mic, and USB studio condenser. |
| **Schoeps Mikrofone** | `Schoeps.json` | `CMC 1`, `CMIT 5 U`, `MiniCMIT`, `SuperCMIT` | Miniature Colette amplifier body, blue film shotgun, short shotgun, and 2-channel DSP shotgun. |

---

## 3. Total Master Dataset Summary
* **Total Brand Files**: **215 JSON files** in `docs/data/brands/`
* **Total Microphones Cataloged**: **2,054 models**
* **Total Wireless RF Systems**: **81 Systems** (324 Frequency Tuning Ranges)
* **Master Pipeline Verification**: All files compiled cleanly via `docs/build_data.py`.
