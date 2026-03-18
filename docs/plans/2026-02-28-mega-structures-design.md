# Mega-Structures Expansion Design

## Problem

All ~7,416 block slots fill by ~37,080 XP (milestone 9-10). The XP scale goes to 2,000,000. 98% of the progression has nothing to build.

## Solution

Add 35 new hand-crafted Egyptian structures, totaling ~51,850 new slots. Combined with existing content (~7,416), the grand total reaches ~59,266 slots (~296,330 XP, roughly milestone 17).

## No changes needed to

- `BuildManager` — structures auto-sequence from the registry
- `EventRouter` — block routing is data-driven
- `PyramidBuilder` — unchanged
- `shared/types.ts` — milestones unchanged
- Block geometry types — uses existing 8 types

## Only file changed

`src/structures/StructureRegistry.ts` — add 35 new `generateXxxSlots()` functions and 35 new registry entries.

## Structure Lineup

### Inner Ring (radius 40-70) — Workshops & Small Temples

| # | ID | Name | Slots | World Offset | Description |
|---|-----|------|-------|-------------|-------------|
| 35 | embalmers-workshop | Embalmer's Workshop | 180 | (-45, 0, 48) | 8x6 building, interior slab tables, cylinder jars |
| 36 | scribes-academy | Scribe's Academy | 200 | (55, 0, -40) | 8x8 columned hall, papyrus alcoves, teaching platform |
| 37 | nilometer | Nilometer | 120 | (48, 0, 52) | Circular stepped well (5 rings), center measurement column |
| 38 | chariot-stable | Chariot Stable | 250 | (-48, 0, -45) | 12x6 open-front, partitioned stalls, ramp |
| 39 | brewery-bakery | Brewery & Bakery | 200 | (60, 0, 25) | Twin 6x4 buildings, slab walkway, cylinder ovens |
| 40 | guard-barracks | Guard Barracks | 300 | (-55, 0, -20) | 10x8 two-story, watchtower corner, courtyard |
| 41 | sphinx-avenue-gate | Sphinx Avenue Gate | 250 | (0, 0, 42) | Entry pylon, flanking sphinx pedestals, flag pole cylinders |
| 42 | sed-festival-pavilion | Sed Festival Pavilion | 350 | (65, 0, -55) | 12x10 open platform, double colonnade, throne dais |
| 43 | observatory | Astronomical Observatory | 300 | (-65, 0, 35) | Cylindrical tower (8-high), rooftop slab, obelisks |
| 44 | animal-necropolis | Animal Necropolis | 400 | (50, 0, -65) | 16 vault chambers (2x2x2), slab lids, central shrine |

### Mid Ring (radius 70-110) — Temples & Infrastructure

| # | ID | Name | Slots | World Offset | Description |
|---|-----|------|-------|-------------|-------------|
| 45 | priests-residences | Priests' Residences | 450 | (-75, 0, 55) | 6 connected 4x3 houses, shared courtyard, compound wall |
| 46 | stone-wharf | Stone Wharf | 400 | (80, 0, 40) | 20x4 dock, crane post cylinders, loading ramp |
| 47 | temple-of-hathor | Temple of Hathor | 600 | (-80, 0, -40) | 10x8 temple, Hathor-column facade, inner sanctuary, rooftop shrine |
| 48 | weaving-mill | Weaving Mill | 350 | (75, 0, -50) | 8x8 workshop, cylinder/slab loom frames, storage wing |
| 49 | processional-way | Processional Way | 500 | (0, 0, -80) | 30-long paved road, flanking walls, shrine alcoves, terminal gate |
| 50 | military-fortress | Military Fortress | 800 | (-90, 0, -65) | 14x14 walled compound, 4 corner towers (5-high), barracks, gatehouse |
| 51 | karnak-precinct-wall | Karnak Precinct Wall | 1000 | (95, 0, -30) | 20x20 enclosure wall (3 thick, 4 high), 2 entry gates |
| 52 | temple-of-ptah | Temple of Ptah | 700 | (-85, 0, 70) | 12x10 temple: pylon, court, hypostyle, inner sanctum |
| 53 | royal-granary-complex | Royal Granary Complex | 600 | (90, 0, 65) | 8 silos (cylinder 6-high), shared platform, admin office |
| 54 | hatshepsut-terrace | Hatshepsut Terrace | 1200 | (-100, 0, -85) | 3 ascending terraces (16x8, 12x6, 8x4), colonnaded facades, ramps |
| 55 | nile-harbor | Nile Harbor | 1000 | (105, 0, 50) | L-shaped dock (24x6+12x6), 3 warehouses, loading ramps |
| 56 | valley-of-kings-entrance | Valley of the Kings Entrance | 800 | (-95, 0, 90) | Cliff face (16x10), 4 tomb entrances, guardian statues |

### Outer Ring (radius 110-160) — Mega Complexes

| # | ID | Name | Slots | World Offset | Description |
|---|-----|------|-------|-------------|-------------|
| 57 | temple-of-luxor | Temple of Luxor | 1500 | (115, 0, -70) | 16x12: pylon facade, peristyle court, double colonnade, inner chambers |
| 58 | great-enclosure-wall | Great Enclosure Wall | 1400 | (-115, 0, -50) | 28x28 perimeter (4 thick, 5 high), 4 monumental gates |
| 59 | pharaoh-mortuary-complex | Pharaoh's Mortuary Complex | 1800 | (120, 0, 80) | 16x14: causeway, valley temple, mortuary temple, false doors |
| 60 | necropolis-district | Necropolis District | 2000 | (-120, 0, 75) | 20 mastabas (4x3x2), 4 shaft tombs, offering chapels |
| 61 | temple-of-amun-ra | Temple of Amun-Ra | 2500 | (130, 0, -40) | 20x16: 2 pylons, great court, 6x4 hypostyle (24 columns), 3 sanctuaries |
| 62 | royal-palace-complex | Royal Palace Complex | 2800 | (-130, 0, -80) | 20x18: throne hall, harem quarters, admin wing, garden courtyard |
| 63 | sacred-harbor-of-amun | Sacred Harbor of Amun | 2000 | (135, 0, 60) | T-shaped lake (20x8+12x8), stone quays, island barque shrine |
| 64 | festival-hall-thutmose | Festival Hall of Thutmose | 2200 | (-135, 0, 40) | 18x14: tent-pole columns, clerestory walls, rear chapel |
| 65 | karnak-hypostyle | Karnak Hypostyle Hall | 3500 | (145, 0, -20) | 20x14: 70 columns (6-high), slab architraves, clerestory |
| 66 | great-nile-port | Great Nile Port City | 4000 | (-145, 0, -30) | 24x20: docks, warehouses, customs, merchant housing, harbor tower |
| 67 | temple-of-dendera | Temple Complex of Dendera | 3000 | (150, 0, 45) | 22x16: main temple, birth house, sacred lake, sanatorium |
| 68 | grand-necropolis | Grand Necropolis | 5000 | (-150, 0, 60) | 30x24: 40 mastabas, 8 rock-cut tombs, mortuary temples, gardens |
| 69 | theban-acropolis | Theban Acropolis | 8000 | (0, 0, -150) | 30x30: 3 interconnected temples, monumental stairs, colossal statues |

## Geometry Patterns

All structures use the existing 8 geometry types: `cube`, `beveled-cube`, `cylinder`, `fluted-cylinder`, `lotus-capital`, `half`, `slab`, `wedge`.

### Common patterns for large structures:

- **Perimeter walls:** Loop x/z edges at each y, skip interior — `(W*2 + D*2 - 4) * H` blocks
- **Column grids:** Parametric spacing with `fluted-cylinder` shaft + `lotus-capital` top
- **Terraces:** Reducing footprint per tier
- **Hollow rooms:** Full footprint at y=0, perimeter-only at y>0, slab roof at top
- **Pylons:** Trapezoidal profile via decreasing width per y-level
- **Cliff faces:** Full rectangular walls with carved-out niches for figures

### Large structure composition (~1000+ slots):

These combine multiple sub-elements:
1. Platform/foundation (full footprint slab layer)
2. Perimeter walls (hollow at height)
3. Interior columns (fluted-cylinder grids)
4. Roof/ceiling (slab layer)
5. Decorative elements (wedge cornices, half-block caps, lotus-capitals)

## Implementation Plan

All changes go in a single file: `src/structures/StructureRegistry.ts`.

- Add 35 generator functions
- Add 35 registry entries to `getStructureRegistry()`
- No other files change

The generators should be implemented in batches:
1. Inner Ring (10 structures, ~2,750 slots)
2. Mid Ring (12 structures, ~8,400 slots)
3. Outer Ring (13 structures, ~39,700 slots)

## Verification

- `npx tsc --noEmit` passes
- `npx vite build` succeeds
- Dev server: structures appear and fill in correct order
- No world-position overlaps between structures
