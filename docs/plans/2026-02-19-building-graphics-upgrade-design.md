# Building Graphics Upgrade Design

**Date:** 2026-02-19
**Branch:** enhance/visual-polish-birds-camels-nightsky
**Scope:** Holistic visual upgrade for all 26 structures (Approach A + B)

## Context

All structures use basic geometric primitives (cubes, cylinders, wedges, slabs) with procedural PBR materials (MeshStandardMaterial + per-instance HSL color variation). No textures, no normal maps, no UV mapping. Buildings look blocky and flat.

## Design Sections

### 1. Procedural Stone Textures via Canvas

New `TextureFactory` module generates sandstone/limestone/granite textures using HTML Canvas at startup.

- **Sandstone:** Warm tan base with grain lines, pores, Perlin-style noise
- **Limestone:** Lighter, smoother with faint layered striations
- **Granite:** Darker with crystal-like speckles (higher-era structures)
- **Normal maps:** Generated from same canvas (brightness-as-height derivatives)

Integration: `eraMaterials[]` in BuildManager gets `.map` and `.normalMap`. Lower eras = sandstone, mid = limestone, high = granite/gold. Per-instance `setColorAt` continues to tint on top.

### 2. Geometry Enhancements

Three new `BlockGeometry` types added to `GEOMETRY_CACHE`:

- **`fluted-cylinder`**: 12-sided cylinder with alternating radii (grooved columns). Replaces `cylinder` in colonnades, hypostyle hall, temples.
- **`beveled-cube`**: Box with chamfered edges. Used for walls of major buildings.
- **`lotus-capital`**: Ornate capital with lotus-bud shape. Replaces `capital` on select structures.

No additional draw calls beyond existing lazy InstancedMesh creation.

### 3. Ambient Occlusion & Edge Darkening

Vertex-based AO applied at geometry creation time:

- Bottom faces darkened (shadow under each block)
- Side faces get subtle vertical gradient (darker at bottom)
- Zero runtime cost (one-time geometry modification)

### 4. Atmospheric Structure Lighting

New `StructureLights` class in `src/effects/`:

- Altar: 4 flickering orange point lights at fire pits
- Sacred Lake / Canal: Blue-green point light under water
- Lighthouse: Rotating beacon light at top
- Temples: Soft warm interior glow
- Worker's Village: Small warm lights inside houses

Lights created only when structure is partially built. Flicker/rotation updated per frame.

### 5. Material Weather & Age Effects

- **Roughness by era:** Early (0.85-0.95 weathered), later (0.6-0.75 fresh)
- **Sand accumulation:** Top-facing surfaces on older structures get tan color bias
- **Edge wear:** Beveled-cube lighter vertex colors on chamfered edges

## Performance Budget

- Canvas textures: one-time generation cost, shared across all materials
- New geometries: cached, no extra per-frame cost
- Vertex AO: baked into geometry, zero runtime cost
- Structure lights: ~15-20 point lights total, only for built structures
- No post-processing additions (existing PostProcessing handles bloom/SSAO)

## Files to Create/Modify

- **New:** `src/effects/TextureFactory.ts`
- **New:** `src/effects/StructureLights.ts`
- **Modify:** `src/structures/BuildManager.ts` (texture integration, new geometries, vertex AO)
- **Modify:** `src/structures/StructureRegistry.ts` (use new geometry types for select structures)
- **Modify:** `src/main.ts` (wire up StructureLights)
