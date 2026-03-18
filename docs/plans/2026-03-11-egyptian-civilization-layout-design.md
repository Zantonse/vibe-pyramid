# Egyptian Civilization Layout Redesign

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Reposition all 69 structures into a historically-inspired Egyptian civilization layout, consolidate ~6 redundant structures, and organize into 5 clear zones oriented toward the Nile River.

## Current State

69 structures + Great Pyramid in `StructureRegistry.ts` (9,823 lines). Buildings are scattered at manually-assigned `worldOffset` coordinates with no formal layout system. The Nile River runs at z~85 (east-west). Terrain is 500x500 with three flattened zones (pyramid, oasis, city).

## Design: Five-Zone Layout

All structures repositioned into five concentric/directional zones radiating from the Great Pyramid at (0,0,0), oriented toward the Nile River at z~85.

### Zone 1: Sacred Monumental Core (r < 35)

The Giza-like monumental complex. Pyramid at center, major monuments tightly grouped.

| Structure | New Position (x, z) | Notes |
|-----------|---------------------|-------|
| Great Pyramid | (0, 0) | Unchanged — anchor point |
| Sphinx | (30, 0) | East axis — faces east (historically correct Giza alignment) |
| Queen's Pyramid | (-20, -15) | Southwest of Great Pyramid |
| Obelisk | (12, -8) | East of pyramid, near causeway |
| Second Obelisk (Colonnade) | (-12, -8) | West of pyramid, symmetric pair |
| Solar Barque | (18, 10) | Northeast, near pyramid base |
| Pylon Gate | (0, -25) | South of pyramid — entrance to processional axis |
| Mastaba Tomb | (-25, -8) | West side — tombs traditionally on west |
| Mortuary Temple | (0, 18) | North face of pyramid |
| Step Pyramid of Djoser | (-30, 10) | Northwest — older pyramid, offset |

### Zone 2: Temple District (r: 40-70)

Ring of temples around the sacred core. Major temples at cardinal/diagonal positions.

| Structure | New Position (x, z) | Facing |
|-----------|---------------------|--------|
| Temple of Amun-Ra | (0, 50) | South (toward pyramid) |
| Temple of Luxor | (50, 0) | West (toward pyramid) |
| Temple of Ptah | (-50, 0) | East (toward pyramid) |
| Temple of Hathor | (0, -50) | North (toward pyramid) |
| Karnak Hypostyle Hall | (40, 35) | Southwest — near oasis |
| Temple of Dendera | (-40, 35) | Southeast |
| Hatshepsut's Terrace | (-45, -30) | Northeast |
| Cliff Temple | (45, -30) | Northwest |
| Sacred Lake | (-30, 42) | Inside temple ring, natural feature |
| Altar of Offerings | (20, 40) | Between Amun-Ra and Karnak |
| Canopic Shrine | (-55, -15) | Western edge — funerary |
| Shrine of Anubis | (-55, -35) | Southwest — death/funerary zone |
| Sed Festival Pavilion | (35, 45) | Near Amun-Ra — ceremonial |
| Observatory | (55, 20) | Eastern edge — clear sky view |
| Nilometer | (30, 60) | Near river approach — measures floods |
| Karnak Precinct Wall | (0, 55) | Encircles northern temple area |
| Colossi of Memnon | (15, -40) | Flanking southern approach |
| Lighthouse of Pharos | (60, 55) | Northeast — visible from river |

### Zone 3: Civic & Residential Quarter (northeast quadrant, x: 60-120, z: 35-75)

The living city between the temple district and the Nile. Uses the existing flattened "city zone."

| Structure | New Position (x, z) | Notes |
|-----------|---------------------|-------|
| Pharaoh's Palace | (75, 55) | Center of civic quarter |
| Government Hall | (85, 50) | Adjacent to palace |
| Royal Treasury | (90, 55) | Near government |
| Noble Villa | (100, 60) | Elite residential |
| Grand Bazaar | (80, 42) | Market center |
| Craftsmen Quarter | (70, 38) | Artisan workshops |
| Scribes' Academy | (95, 45) | Near government |
| Priests' Residences | (65, 48) | Between temple and civic |
| Brewery & Bakery | (75, 35) | Food production |
| Weaving Mill | (85, 38) | Light industry |
| Worker Hovels | (105, 50) | Outer residential |
| Mud Brick Tenements | (110, 55) | Outer residential |
| Embalmer's Workshop | (65, 35) | Edge of civic, near temple |
| Chariot Stable | (95, 65) | Near road to harbor |
| Military Garrison | (100, 70) | Consolidated: barracks + fortress. Guards harbor approach |

### Zone 4: Harbor & Trade (along the Nile, z: 70-82)

Commercial district along the Nile riverbank.

| Structure | New Position (x, z) | Notes |
|-----------|---------------------|-------|
| Grand Harbor | (80, 78) | Consolidated: 3 harbors merged. Major port on Nile |
| Stone Wharf | (60, 75) | Quarry stone loading |
| Small Market | (70, 72) | Riverside market |
| Marketplace | (95, 75) | Larger market near harbor |
| Nile Harbor (fishing) | (50, 78) | Smaller fishing/ferry dock |
| Royal Granary | (85, 72) | Consolidated: 2 granaries. Grain storage near trade |
| Irrigation Canal | (40, 70) | Water management near Nile |
| Great Quarry | (110, 78) | Stone supply depot |

### Zone 5: Southern Necropolis & Processional Way (south axis, z: -30 to -150)

The land of the dead. Connected to the sacred core via the Grand Processional Avenue.

| Structure | New Position (x, z) | Notes |
|-----------|---------------------|-------|
| Grand Processional Avenue | (0, -45) | Consolidated: processional + avenue of sphinxes. Straight south axis |
| Sphinx Avenue Gate | (0, -35) | Entry to processional from sacred core |
| Valley Temple | (0, -60) | Transition from living to dead |
| Abu Simbel | (0, -85) | Major southern monument on axis |
| Valley of Kings Entrance | (-20, -100) | West of axis — traditional |
| Grand Necropolis | (0, -110) | Consolidated: 2 necropolis areas. Central burial ground |
| Pharaoh Mortuary Complex | (20, -95) | East of axis |
| Sarcophagus Chamber | (-15, -80) | Near Valley Temple |
| Animal Necropolis | (15, -75) | Sacred animal burials |
| Great Enclosure Wall | (0, -120) | Southern boundary wall |
| Eternal City | (0, -140) | Furthest south — mythological destination |
| Royal Palace Complex | (-25, -115) | Afterlife palace |
| Festival Hall of Thutmose | (25, -70) | Ceremonial, near valley |
| Theban Acropolis | (0, -150) | Southernmost monument |

## Consolidation Details

| Original Structures | Merged Into | Rationale |
|--------------------|-------------|-----------|
| Nile Harbor + Sacred Harbor of Amun + Great Nile Port | **Grand Harbor** | 3 separate docks → 1 major port district |
| Granary + Royal Granary Complex | **Royal Granary** | 2 identical grain stores → 1 |
| Necropolis District + Grand Necropolis | **Grand Necropolis** | 2 overlapping burial grounds → 1 |
| Guard Barracks + Military Fortress | **Military Garrison** | 2 military structures → 1 |
| Processional Way + Avenue of Sphinxes | **Grand Processional Avenue** | 2 parallel paths → 1 grand avenue |

**Net result:** 69 → 64 structures (5 merges, each combining 2 structures)

## Alignment Principles

1. **Sphinx faces east** on the pyramid's east-west axis
2. **Processional Way** runs due south from the Pylon Gate
3. **Temples face inward** toward the sacred center
4. **City grows northward** toward the Nile
5. **Dead go south** — all funerary structures on the southern axis
6. **Nile is the commercial lifeline** — all trade/harbor structures along z~78

## Implementation

The only file that changes is `StructureRegistry.ts`:
- Update `worldOffset` coordinates for each structure's `generate*Slots()` call
- Remove the 5 merged structures' generator functions
- Combine slot generators for merged structures (e.g., Grand Harbor = union of the 3 harbor generators)
- Update `getStructureRegistry()` to reflect the new 64-structure list
- Keep the existing flattened terrain zones (pyramid, oasis, city) — the city zone at (86, 68) already aligns with the civic quarter placement

No changes needed to: PyramidBuilder, BuildManager, SceneManager, effects, UI, or any other system. The building system is position-agnostic — it just reads `worldOffset` and `slots[]`.
