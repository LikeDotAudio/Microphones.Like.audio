# Wireless RF Gear & Component Audit

**Last Updated**: 2026-08-07  
**File Location**: `Documentation/Missing RF gear.md`  
**Scope**: Audit of current wireless RF dataset (`Research/Wireless Microphone_RF_Components.json` / `docs/data/rf.json`), identifying missing component classifications (Handheld Transmitters, Bodypack Transmitters, Rackmount/Portable Receivers, Modular Interchangeable Capsules), missing modern digital RF series, and unrepresented wireless vendors.

---

## Executive Summary Metrics
* **Current RF Systems in Dataset**: 70 wireless systems across 16 vendor keys.
* **Core Dataset Gap Identified**: The current RF dataset tracks **frequency tuning ranges and intermodulation coordination spacing only**, but **lacks physical component breakdown** (Handheld Transmitters vs. Bodypack Transmitters vs. Fixed/Slot-in Receivers vs. Wireless Threaded Capsules).
* **Wireless Capsule Threading Standard Gap**: Industry-standard interchangeable wireless capsule heads (Shure 1.25"/28-thread standard vs. Sennheiser Evolution thread vs. Neumann/DPA wireless adapters) are not currently categorized in the dataset.

---

## 1. Existing Vendors Component & Lineup Audit

Below is a detailed audit of the 16 vendor keys currently in the dataset, detailing missing modern RF series, transmitter form factors, receivers, and interchangeable wireless capsule options.

### Shure (Current Systems: `AD`, `PGX`, `PGXD`, `PSM-1000/900/700/600/400/300/200`, `SLX`, `UC`, `UHF`, `UHF-R`, `ULX`, `ULXD4`)
* **Missing Digital RF Systems**:
  * **Axient Digital ADX Series**: ADX1 (Bodypack), ADX1M (Micro-bodypack with internal antenna), ADX2 / ADX2FD (Handheld transmitter with frequency diversity), ADX5D (Dual-channel slot-in receiver for location/ENG).
  * **SLX-D / SLX-D+**: SLXD1 (Bodypack), SLXD2 (Handheld), SLXD4 / SLXD4D / SLXD4Q (Rackmount receivers).
  * **ULX-D Quad / Dual Additions**: ULXD1, ULXD2, ULXD4D (Dual-channel), ULXD4Q (Quad-channel with Dante).
  * **QLX-D Digital Wireless**: QLXD1 (Bodypack), QLXD2 (Handheld), QLXD4 (Digital receiver).
  * **BLX / SVX**: BLX1 (Bodypack), BLX2 (Handheld), BLX4 (Receiver).
  * **GLX-D+ Dual Band (2.4GHz / 5.8GHz)**: GLXD1+, GLXD2+, GLXD4+.
* **Missing Wireless Threaded Capsules (1.25"/28-thread standard)**:
  * **KSM11** (Cardioid condenser wireless capsule head - Black & Nickel).
  * **Nexadyne 8/C & 8/S** (Revonic dual-engine dynamic wireless capsules).
  * **RPW112** (SM58 capsule), **RPW118** (Beta 58A capsule), **RPW120** (Beta 87A capsule), **RPW184** (KSM9 capsule).

### Sennheiser (Current Systems: `2000`, `EK3253`, `EM3732`, `EM3732-II`, `Evol-G1/G2/G3/G4`, `Evol-G2/G4-IEM`, `506-530 A`, `560-584 A`, `572-596 A`, `584-608 A`, `638-662 A`, `722-746 A`)
* **Missing Digital RF Systems**:
  * **SpectraTown / Digital 6000**: SK 6000 (Bodypack), SK 6212 (Mini bodypack), SKM 6000 (Handheld), EM 6000 (Dante receiver).
  * **Digital 9000**: SK 9000, SKM 9000, EM 9046 (Uncompressed digital wireless flagship).
  * **EW-D / EW-DX (Evolution Wireless Digital)**:
    * Transmitters: EW-DX SK (Bodypack), EW-DX SKM (Handheld), EW-DX SKM-S (Handheld with switch), EW-DX TS (Table stand).
    * Receivers: EW-DX EM 2 (Dual channel), EW-DX EM 4 (Quad channel Dante).
  * **Profile Wireless (2.4GHz)**: Dual-channel compact transmitter pucks & receiver.
* **Missing Wireless Capsule Heads**:
  * **MM 435** (High-end dynamic capsule head).
  * **MM 445** (High-end supercardioid dynamic capsule head).
  * **MMD 835 / MMD 845 / MMD 935 / MMD 945** (Evolution capsule heads).
  * **MMK 965** (True condenser switchable capsule head).
  * **Neumann KK 204 / KK 205** (Neumann capsules for Sennheiser wireless).

### Lectrosonics (Current Systems: `100 KHz`, `175 KHz`, `25 KHz`, `3 Block`, `D4/M4`, `DSW`, `Hybrid`, `M2T`)
* **Missing Digital & Location Systems**:
  * **D Squared (D2) Digital Wireless**:
    * Transmitters: DBSM / DBSMD (Digital bodypack), DBU (Digital beltpack), DHU (Digital handheld), DPR / DPR-A (Plug-on transmitter with 48V phantom power).
    * Receivers: DSQD (4-channel half-rack digital receiver), DSR / DSR4 (Slot-in 4-channel portable receiver).
  * **Digital Hybrid Wireless (Legacy Additions)**:
    * Transmitters: LT, LMb, SSM (Super-small micro bodypack), HM (Plug-on transmitter), HHa (Handheld transmitter).
    * Receivers: SRc / SRc5P (Dual-channel camera slot receiver), UCR411a (Reference ENG receiver), Venue / Venue 2 (Modular rack receiver).

### Wisycom (Current Systems: `Band 1`, `Band 2`, `Band 3`)
* **Missing Systems & Components**:
  * **Wideband Transmitters**: MTP60 (Wideband pocket transmitter with onboard recording), MTP40S / MTP41S (Bodypack), MTH400 (Handheld transmitter).
  * **Wideband Receivers**: MRK16 (16-channel rack system), MRK980 (Dual wideband receiver), MCR54 (Quad camera slot-in receiver), MPR52-ENG (Dual-channel portable receiver).

### Zaxcom (Current Systems: `Standard`, `TRX Series`)
* **Missing Digital Systems & Transmitters**:
  * **Transmitters**: TRXLA3 / TRXLA4 (Wideband bodypack with internal recording), ZMT4 (Ultra-miniature bodypack), TRX745 (Plug-on transmitter with phantom power).
  * **Receivers**: RX-4 (4-channel slot receiver), URX100 (UHF receiver), Nova / Nova 2 (Integrated recorder/receiver console).

### Audio-Technica (Current Systems: `1800`, `2000`, `3000`, `4000/5000`, `700`, `7000`, `M2 IEM`, `M3 IEM`)
* **Missing Systems & Components**:
  * **3000 Series Digital (3000 Digital)**: ATW-DT3101 (Bodypack), ATW-DT3102 (Handheld), ATW-DR3120 (Receiver).
  * **5000 Series (3rd Gen)**: ATW-T5201 (Bodypack), ATW-T5202 (Handheld), ATW-R5220 (Dual receiver).
  * **System 10 / System 10 PRO (2.4GHz)**: ATW-RU13 (Receiver unit), ATW-T1001 (Bodypack), ATW-T1002 (Handheld).
  * **Interchangeable Capsules**: ATW-C510, ATW-C710, ATW-C5400, ATW-C6100.

### Sony (Current Systems: `WR`)
* **Missing Digital Wireless Systems**:
  * **DWX Digital Wireless Series (3rd Gen)**: DWT-B30 (Digital bodypack transmitter), DWT-M01 (Handheld transmitter), DWR-R03D (Dual rack receiver), DWR-S03D (Slot-in 2-channel ENG receiver).
  * **UWP-D Series (ENG / Camera)**: UTX-B40 (Bodypack), UTX-M40 (Handheld), URX-P40 (Camera receiver), UTX-P40 (Plug-on transmitter).

### Mipro (Current Systems: `ACT-311/312`, `ACT-7`, `ACT-818/828`)
* **Missing Digital Systems**:
  * **ACT-800 Series (Dante Digital)**: ACT-800H (Handheld), ACT-800T (Bodypack), ACT-848 (Quad digital receiver).
  * **ACT-500 / ACT-300 Series**: ACT-5800 (5.8GHz digital series).

### Audix (Current Systems: `RAD360`)
* **Missing Systems**:
  * **Performance Series**: AP41 / AP42 (R41/R42 receivers), H60 (Handheld transmitter with OM2/OM5/VX5 capsule heads), B60 (Bodypack transmitter).

---

## 2. Completely Missing Wireless RF Vendors

The following professional wireless microphone manufacturers are **currently missing entirely** from `Wireless Microphone_RF_Components.json` and need brand file creation:

1. **AKG Acoustics (Wireless Line)**:
   * DMS300 / DMS100 (2.4GHz digital wireless).
   * WMS470 / WMS450 (UHF wireless systems).
   * WMS40 Mini (Budget dual-channel wireless).
   * HT470 (Handheld), PT470 (Bodypack), SR470 (Receiver).
2. **Beyerdynamic (Wireless Line)**:
   * TG 1000 (Digital UHF wireless system).
   * TG 550 / TG 500 (Touring Gear wireless).
3. **Electro-Voice (Expanded Wireless)**:
   * RE3 Digital Wireless (RE3-ACC, RE3-BPT bodypack, RE3-HHT handheld with ND838/RE420 heads).
4. **Line 6 / Yamaha**:
   * Relay G10 / G30 / G55 / G90 (2.4GHz digital wireless instrument/vocal systems).
   * XD-V75 / XD-V55 / XD-V35 (Digital wireless handheld & bodypack systems).
5. **Røde (Wireless Systems)**:
   * Wireless PRO, Wireless GO II, Wireless ME (2.4GHz digital series).
   * RODELink FM Wireless / Performer Kit.
6. **DJI**:
   * DJI Mic / DJI Mic 2 (2.4GHz dual-channel transmitters with internal recording).
7. **Hollyland**:
   * Lark Max, Lark M1, Lark 150 (Digital wireless lapel systems).
8. **Comica Audio**:
   * BoomX-D, Vimo C, WM100 (UHF & 2.4GHz camera wireless systems).
9. **Saramonic**:
   * Blink 500 B2 / Blink 500 Pro / UwMic9 (UHF dual-channel wireless systems).
10. **Nady Systems**:
    * UB-4 / W-1W / PCM-200 vintage & budget wireless systems.

---

## 3. Required Component Schema Expansion

To properly support RF gear beyond tuning ranges, the dataset schema should be expanded to categorize 4 distinct physical RF components:

```
                            ┌─────────────────────────────────────────┐
                            │          Wireless RF Component          │
                            └────────────────────┬────────────────────┘
                                                 │
      ┌────────────────────────┬─────────────────┴───────────────┬────────────────────────┐
      ▼                        ▼                                 ▼                        ▼
┌──────────────┐      ┌─────────────────┐             ┌────────────────────┐    ┌──────────────────┐
│   Handheld   │      │    Bodypack     │             │  Slot-in / Rack    │    │  Interchangeable │
│ Transmitters │      │   Transmitters  │             │     Receivers      │    │  Capsule Heads   │
│  (TX-Hand)   │      │   (TX-Body)     │             │     (RX-Unit)      │    │    (Capsule)     │
└──────────────┘      └─────────────────┘             └────────────────────┘    └──────────────────┘
```

### Component Classification Fields Needed:
1. **Component Category**: `handheld_transmitter`, `bodypack_transmitter`, `plug_on_transmitter`, `rack_receiver`, `portable_slot_receiver`, `wireless_capsule`.
2. **Connector & Threading Standard**:
   * *Capsules*: `1.25"/28-thread` (Shure standard - used by Shure, EV, Earthworks, Telefunken, Lewitt, Heil, DPA adapters), `Sennheiser-Evolution-Thread` (used by Sennheiser, Neumann KK204/205).
   * *Bodypacks*: `TA4F / Mini-XLR` (Shure), `3.5mm-Locking` (Sennheiser/Sony), `TA5F` (Lectrosonics), `Lemo 3-pin` (Sennheiser SK6000 / Zaxcom / Wisycom), `MicroDot` (DPA).
3. **Powering & Battery Spec**:
   * Lithium-ion rechargeable pack vs. 2x AA Alkaline.
   * RF Output Power: Switchable 1mW / 10mW / 50mW / 100mW.

---

## 5. Ingested & Verified Physical RF Gear (`DONE`)

The following physical RF transmitters, receivers, and threaded wireless capsules have been added with complete datasheets, documentation links, and form factor classifications in `docs/data/brands/`:

| Brand | Model | Form Factor Category | Connector / Interface | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Shure** | `ADX1` | `bodypack_transmitter` | TA4F / LEMO3 | ✅ DONE |
| **Shure** | `ADX1M` | `bodypack_transmitter` | LEMO3 | ✅ DONE |
| **Shure** | `ADX2` | `handheld_transmitter` | 1.25"/28-thread Shure Standard | ✅ DONE |
| **Shure** | `ADX2FD` | `handheld_transmitter` | 1.25"/28-thread Frequency Diversity | ✅ DONE |
| **Shure** | `ADX5D` | `portable_slot_receiver` | TA3M / DB15 / DB25 | ✅ DONE |
| **Shure** | `KSM11` | `wireless_capsule` | 1.25"/28-thread Condenser Head | ✅ DONE |
| **Sennheiser** | `SK 6000` | `bodypack_transmitter` | 3-pin LEMO | ✅ DONE |
| **Sennheiser** | `SK 6212` | `bodypack_transmitter` | 3-pin LEMO | ✅ DONE |
| **Sennheiser** | `SKM 6000` | `handheld_transmitter` | Sennheiser Evolution Thread | ✅ DONE |
| **Sennheiser** | `EM 6000` | `rack_receiver` | 3-pin XLR / Dante RJ45 | ✅ DONE |
| **Sennheiser** | `MM 435` | `wireless_capsule` | Sennheiser Thread Standard | ✅ DONE |
| **Lectrosonics**| `DSQD` | `rack_receiver` | TA5M / XLR / Dante RJ45 | ✅ DONE |
| **Lectrosonics**| `DPR` | `plug_on_transmitter` | 3-pin XLR female (48V Phantom) | ✅ DONE |
| **Lectrosonics**| `DBSM` | `bodypack_transmitter` | TA5M 5-pin male | ✅ DONE |

---

## 6. Total Master Dataset Summary
* **Total Brand Files**: **215 JSON files** in `docs/data/brands/`
* **Total Microphones & Physical RF Components**: **2,066 models**
* **Total Wireless Tuning Systems**: **81 Systems** (324 Frequency Tuning Ranges)
* **Build Verification**: All files compiled cleanly via `docs/build_data.py`.
