# Abu Simbel — Great Temple of Ramesses II

## Overview

A colossal rock-cut temple placed at the far southern edge of the desert as the final capstone structure in the build progression. Four seated pharaoh figures carved into a cliff face create an iconic silhouette visible from across the map.

## Registry

- **id:** `abu-simbel`
- **name:** Great Temple of Abu Simbel
- **position:** `(0, -100)` — due south, far desert edge
- **order:** Last entry in registry (after eternal-city)

## Structure Layout (~350 slots)

### Cliff Face (Backdrop)
- 22 wide x 14 tall x 2 deep wall of cubes
- Back layer: solid
- Front layer: gaps where seated figures and entrance sit

### 4 Colossal Seated Figures
Evenly spaced across facade, each ~8 blocks tall:
- **Legs/throne:** 3x2 cube base, 3 blocks tall (seated position)
- **Torso:** 2x2 cubes, 3 blocks tall
- **Head:** 1x1 beveled-cube, 2 blocks tall
- Each figure protrudes ~2 blocks from cliff face

### Entrance Doorway
- 2-wide x 4-tall gap in center between the two inner figures

### Wedge Cornice
- 22 wedge blocks crowning the top of the facade

### Interior Hall
Behind the facade, a 10x8 pillared hall:
- 8 fluted-cylinder columns (2 rows of 4), 4 blocks tall
- Slab ceiling
- Central axis from entrance to back wall
- 3 beveled-cube shrine statues at far end

## Effects

### StructureLights
- Warm amber pulse (`0xffab40`, opacity 0.5, scale 2.5) at entrance
- Static interior glow (`0xffcc80`, opacity 0.3, scale 1.5)

## Terrain
- No additional flatten zone needed
- Sits on natural dune height via `getTerrainHeight(0, -100)`

## Geometries Used
- cube, beveled-cube, slab, wedge, fluted-cylinder
