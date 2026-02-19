# Levels & Buildings Expansion Design

**Date:** 2026-02-19
**Status:** Approved
**Approach:** Sequential Expansion (1 structure per milestone)

## Overview

Double the milestone count from 18 to 36 named levels. Add 18 new structures spanning monumental, sacred, and civic themes. Upgrade existing structures and all new structures to use enhanced block geometry (cylinders, wedges, half-blocks, slabs) while maintaining the blocky aesthetic.

## New Milestones (Levels 18-35)

| Lvl | Name | XP | Icon | Structure |
|-----|------|-----|------|-----------|
| 18 | Hypostyle Hall | 260,000 | Monumental | Forest of thick columns with slab roof |
| 19 | Sacred Lake | 310,000 | Sacred | Sunken rectangular pool |
| 20 | Worker's Village | 365,000 | Civic | Cluster of 4 small houses with wedge roofs |
| 21 | Granary of Plenty | 425,000 | Civic | 3 cylinder silos with caps |
| 22 | Altar of Offerings | 490,000 | Sacred | Raised altar platform |
| 23 | Valley Temple | 560,000 | Monumental | Pillared hall with porch |
| 24 | Royal Treasury | 640,000 | Civic | Fortified treasury building |
| 25 | Avenue of Sphinxes | 725,000 | Monumental | 6 mini sphinxes on slab pathway |
| 26 | Shrine of Anubis | 815,000 | Sacred | Jackal-topped shrine pavilion |
| 27 | The Great Quarry | 910,000 | Civic | Open quarry pit with ramp |
| 28 | Colossi of Memnon | 1,010,000 | Monumental | Two seated colossal statues |
| 29 | Canopic Shrine | 1,120,000 | Sacred | Four-jar shrine |
| 30 | Irrigation Canal | 1,240,000 | Civic | Canal channel with sluice |
| 31 | Cliff Temple | 1,370,000 | Monumental | Abu Simbel facade with figures |
| 32 | Marketplace | 1,510,000 | Civic | Open-air market stalls |
| 33 | Sarcophagus Chamber | 1,660,000 | Sacred | Burial chamber |
| 34 | Lighthouse of Pharos | 1,820,000 | Monumental | Tall tapered tower |
| 35 | Eternal City | 2,000,000 | Capstone | Final achievement |

After level 35, auto-extend at +200K per level.

## Enhanced Geometry System

New `BlockSlot.geometry` field: `'cube' | 'cylinder' | 'wedge' | 'half' | 'capital' | 'slab'`

| Shape | Geometry | Use Cases |
|-------|----------|-----------|
| cube | BoxGeometry(1,1,1) | Fill, walls, platforms |
| cylinder | CylinderGeometry(0.45,0.45,1,8) | Columns, silos |
| wedge | Custom triangular prism | Ramps, slopes, roofs |
| half | BoxGeometry(1,0.5,1) | Caps, lintels |
| capital | CylinderGeometry(0.6,0.45,0.4,8) | Column tops |
| slab | BoxGeometry(1,0.25,1) | Thin layers, surfaces |

BuildManager creates InstancedMesh per geometry-type per era per structure (lazy — only for types actually used).

## Existing Structure Upgrades

- Colonnade: cylinders + capitals replace cube columns
- Sphinx: wedge paw tapers, half-block headdress
- Obelisk: half-block pyramidion cap
- Mortuary Temple: cylinder inner columns
- Pylon Gate: wedge slopes on tower tops

## Layout: Expanding Rings

Ring 1 (~15-25u): Obelisk, Sphinx, Colonnade, Pylon Gate
Ring 2 (~20-35u): Queen's Pyramid, Solar Barque, Mortuary Temple, Mastaba, Step Pyramid, Hypostyle Hall, Sacred Lake
Ring 3 (~35-50u): Worker's Village, Granary, Altar, Valley Temple, Treasury, Avenue of Sphinxes
Ring 4 (~50-65u): Shrine of Anubis, Quarry, Colossi, Canopic Shrine, Irrigation Canal, Cliff Temple, Marketplace, Sarcophagus Chamber, Lighthouse

## Files to Modify

1. `shared/types.ts` — 18 new MILESTONES + ERA_VISUALS
2. `src/structures/StructureRegistry.ts` — 18 new generators + 5 upgrades + geometry field
3. `src/structures/BuildManager.ts` — Multi-geometry InstancedMesh support
4. `src/scene/SceneManager.ts` — Atmosphere configs for new milestones
