# Open-Ended Visual Progression Design

## Goal
Extend the milestone system beyond the initial 6 levels into an open-ended progression. After the pyramid completes, enhance it with casing/decorations, then build surrounding structures (obelisks, sphinx, temple, second pyramid, etc.) block-by-block.

## Phase 1: Build the Pyramid (Levels 0-5) — Already Implemented
| Level | Name | XP | Visual |
|-------|------|-----|--------|
| 0 | Surveying the Sands | 0 | Pale sandstone blocks |
| 1 | Laying Foundations | 50 | Mudbrick blocks |
| 2 | Rising Walls | 500 | Cut limestone |
| 3 | Inner Chambers | 2,000 | Polished granite + inner glow |
| 4 | Gilding the Facade | 5,000 | Gilded blocks, metallic sheen |
| 5 | Placing the Capstone | 7,500 | Electrum gold + capstone beacon |

## Phase 2: Enhance the Pyramid (Levels 6-8)
| Level | Name | XP | Visual |
|-------|------|-----|--------|
| 6 | Sheathing in Limestone | 10,000 | Smooth white limestone casing on pyramid exterior faces. New InstancedMesh layer placed on visible faces. |
| 7 | Inscribing the Ages | 15,000 | Entrance portal at ground level (glowing doorway mesh). Torches/braziers flanking entrance with flame particle effects. |
| 8 | Crown of Gold | 20,000 | Gold capstone mesh replaces top blocks. Subtle golden aura halo around pyramid structure. |

### Phase 2 Era Visuals
| Level | Material | Roughness | Metalness | Emissive |
|-------|----------|-----------|-----------|----------|
| 6 | Smooth white limestone | 0.5 | 0.1 | 0 |
| 7 | Decorated stone with warm tint | 0.45 | 0.15 | 0.05 |
| 8 | Pure gold | 0.2 | 0.6 | 0.2 |

## Phase 3: Build the Complex (Level 9+, Open-Ended)
Each level adds a new structure built block-by-block using XP earned during that level.

| Level | Name | XP | Structure | Position |
|-------|------|-----|-----------|----------|
| 9 | Raising the Obelisk | 27,500 | Tall obelisk (narrow column, ~60 blocks) | Front-right of pyramid |
| 10 | Guardian of the Sands | 37,500 | Low-poly sphinx (blocky body + head, ~200 blocks) | Front-center, facing outward |
| 11 | Path of the Gods | 50,000 | Temple colonnade (two rows of columns, ~150 blocks) | Processional avenue from entrance |
| 12 | Pyramid of the Queen | 65,000 | Half-size pyramid (~385 blocks, base 10x10) | Offset to right side |
| 13 | Solar Barque | 85,000 | Boat-shaped structure (~100 blocks) | Left side near quarry |
| 14+ | Cycle continues | +25K each | Additional obelisks, walls, small pyramids | Increasing offsets from center |

## Architecture

### StructureRegistry
Ordered list of `Structure` objects. Each defines:
- `id: string` — unique identifier
- `name: string` — display name for HUD
- `icon: string` — emoji for milestone display
- `generateSlots(): BlockSlot[]` — block positions for this structure
- `worldOffset: Vector3` — position in scene
- `totalBlocks: number` — how many blocks to complete

### BuildManager
Replaces single-pyramid assumption. Holds:
- `structures: Structure[]` — ordered build queue
- `activeStructureIndex: number` — which structure is being built
- `structureBuilders: Map<string, InstancedMesh[]>` — per-structure meshes

Delegates block placement to the active structure. When it's full, advances to next. The current PyramidBuilder becomes the first structure in the registry.

### Milestone System Changes
- `MILESTONES` array extended with levels 6-13+
- `ERA_VISUALS` array extended with new material configs
- Server state tracks `active_structure_index` and per-structure block counts
- `ATMOSPHERE_CONFIGS` extended for new levels

### Structure Slot Generators
Each structure type has its own slot generation logic:
- **Obelisk:** Narrow column (3x3 base tapering to 1x1, ~15 layers)
- **Sphinx:** Blocky body (10x4x5) + head (3x3x3), low-poly but recognizable
- **Colonnade:** Two parallel rows of columns (2x2 base, 6 blocks tall, spaced apart)
- **Small pyramid:** Same algorithm as main pyramid but base 10x10 instead of 20x20
- **Boat:** Elongated hull shape (tapered ends, wider middle)

### XP Threshold Scaling
- Levels 0-5: Manual thresholds (already defined)
- Levels 6-8: Manual thresholds (10K, 15K, 20K)
- Levels 9-13: Manual thresholds (27.5K, 37.5K, 50K, 65K, 85K)
- Levels 14+: Formula-based: `previousThreshold + 25000`

### What Stays the Same
- Per-era block materials (new structures use current era's visual)
- Atmosphere system continues shifting
- Audio system (same level-up chimes)
- Server state persistence pattern (atomic writes to ~/.pyramid/state.json)
- Block range tracking per milestone

## Files Changed
1. `shared/types.ts` — Extended MILESTONES, ERA_VISUALS, ATMOSPHERE_CONFIGS; new Structure interface; updated PyramidState
2. `server/state.ts` — Track active structure, per-structure block counts
3. `src/pyramid/PyramidBuilder.ts` — Refactor into first Structure in registry
4. `src/structures/` — New directory: StructureRegistry, BuildManager, individual structure generators (Obelisk, Sphinx, Colonnade, SmallPyramid, Boat)
5. `src/scene/SceneManager.ts` — Extended atmosphere configs, support enhancement meshes (casing, entrance, aura)
6. `src/events/EventRouter.ts` — Route to BuildManager instead of single PyramidBuilder
7. `src/hud/HUD.ts` — Show active structure name, per-structure progress
8. `src/main.ts` — Wire BuildManager
