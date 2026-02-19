# Visual Level Progression Design

## Goal
Each milestone era should have distinct, dramatic visual differences in the 3D scene. Blocks keep their era's appearance, creating visible strata in the pyramid.

## Milestone Visual Definitions

### Level 0: Surveying the Sands (0 XP)
- **Blocks:** Pale rough sandstone. Low saturation, high lightness, hue ~0.08. Roughness 0.9, metalness 0.
- **Sky/Lighting:** Default desert palette.
- **Sand particles:** Default fine dust (sand-colored).

### Level 1: Laying Foundations (50 XP)
- **Blocks:** Warm mudbrick. Reddish clay, hue ~0.05, moderate saturation. Roughness 0.85, metalness 0.
- **Sky/Lighting:** Default.
- **Sand particles:** Default.

### Level 2: Rising Walls (500 XP)
- **Blocks:** Cut limestone. Brighter, slightly cooler, hue ~0.10. Roughness 0.7, metalness 0.05.
- **Sky/Lighting:** Warmer horizon mid-tone.
- **Sand particles:** Default.

### Level 3: Inner Chambers (2,000 XP)
- **Blocks:** Polished granite. Darker, richer, blue-grey, hue ~0.58, low sat. Roughness 0.4, metalness 0.15.
- **Sky/Lighting:** Deeper gold horizon.
- **Sand particles:** Faint golden tint.
- **Scene:** Warm amber point light inside pyramid structure.

### Level 4: Gilding the Facade (5,000 XP)
- **Blocks:** Gilded limestone. Bright gold, hue ~0.12, high sat. Roughness 0.35, metalness 0.3. Faint emissive glow.
- **Sky/Lighting:** Intensified celestial warmth.
- **Sand particles:** Golden dust.

### Level 5: Placing the Capstone (7,500 XP)
- **Blocks:** Electrum/royal gold. Luminous gold, hue ~0.13. Roughness 0.25, metalness 0.5. Stronger emissive.
- **Sky/Lighting:** Dramatic warm radiance, boosted ambient.
- **Sand particles:** Bright golden sparkle, increased count.
- **Scene:** Capstone beacon point light at pyramid apex.

## Architecture

### Block Strata (Historical Preservation)
Server tracks `milestone_block_ranges: { milestoneIndex: number; startBlock: number; endBlock: number }[]` in PyramidState. When blocks are placed, the current milestone index is recorded. On restore, the client colors each block according to its era range.

### Multi-Material Pyramid
Replace single InstancedMesh (MeshLambertMaterial) with per-era InstancedMesh groups using MeshStandardMaterial. Each era has its own material properties (roughness, metalness, emissive, color palette).

### Scene Atmosphere
SceneManager gains `setMilestoneLevel(index)` to adjust sky color blending targets, light intensities, and manage point lights (inner glow at level 3, capstone beacon at level 5).

### Sand Particles
SandParticles gains `setMilestoneLevel(index)` to shift particle color uniform and optionally increase particle visibility.

## Files Changed
1. `shared/types.ts` - Era visual configs, milestone_block_ranges in PyramidState
2. `server/state.ts` - Track block ranges per milestone
3. `src/pyramid/PyramidBuilder.ts` - Multi-material era system
4. `src/scene/SceneManager.ts` - setMilestoneLevel() for atmosphere
5. `src/effects/SandParticles.ts` - setMilestoneLevel() for particle color
6. `src/events/EventRouter.ts` - Pass milestone context
7. `src/main.ts` - Wire milestone to scene/sand
