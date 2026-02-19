# Grand Enhancement Design

## Goal
Comprehensive upgrade across 7 work streams: post-processing, night sky, fire/torches, water shader, living world, ambient audio, and UI polish. Transform the pyramid visualization from a functional tool into an immersive, cinematic experience.

## Constraints
- **Performance:** Balanced — bloom + god rays yes, SSAO no. Target 60fps on mid-range hardware.
- **Audio:** Expanded SFX only (desert wind, water, birds, construction, torch crackle). No background music.
- **Dependencies:** All streams are independent and committable on their own.

---

## Stream 1: Post-Processing Pipeline (Bloom + God Rays)

### Architecture
- `EffectComposer` from Three.js examples with `RenderPass` + `UnrealBloomPass`
- Bloom targets emissive materials: gold blocks (L4+), capstone beacon (L5+), torches (L7+), gold capstone aura (L8+)
- Bloom params: `strength: 0.4`, `radius: 0.5`, `threshold: 0.7`
- God rays via custom shader pass: screen-space light scattering from sun position during warm phase of day/night cycle
- Both effects intensity scales with milestone level (subtle at L0, pronounced at L5+)

### Files
- New: `src/effects/PostProcessing.ts` — manages composer, bloom, god ray passes
- Modify: `src/scene/SceneManager.ts` — replace `renderer.render()` with composer render, pass sun position to god ray shader

### Performance Budget
Bloom adds ~1ms frame time, god rays ~0.5ms. Well within 60fps on any discrete GPU.

---

## Stream 2: Night Sky & Weather

### Stars
- `BufferGeometry` point cloud — 2000 points on a large sphere (radius 500)
- Fade in when `dayTime > 0.6` (evening), full brightness at `dayTime > 0.8` (night)
- Twinkle via per-star random phase offset in shader

### Moon
- `SphereGeometry` with emissive white material, positioned opposite the sun
- Visible during night phase, fades with daylight

### Clouds
- 6-10 billboard planes with soft cloud alpha textures (generated procedurally via canvas)
- Drift slowly across sky on wind vector
- Opacity tied to a slow sine wave for variety
- Skip during sandstorm-like conditions at higher milestones (golden dust takes over)

### Files
- New: `src/effects/NightSky.ts` — star field, moon, twinkle shader
- New: `src/effects/Clouds.ts` — procedural cloud billboards
- Modify: `src/scene/SceneManager.ts` — integrate into day/night cycle

---

## Stream 3: Fire & Torch System

### Flame Particles
- Per-torch emitter: 30-50 particles, additive blending, billboard quads
- Color gradient: white core -> yellow -> orange -> transparent
- Particles rise with turbulence (noise-based X/Z wiggle), fade over 0.5-1s lifetime
- `PointLight` per torch with flicker (random intensity oscillation)

### Placement
- Level 7+: Two flanking entrance torches
- Level 9+: Four corner braziers around the obelisk
- Each new structure gets 2 torches when it starts building

### Files
- New: `src/effects/TorchFire.ts` — particle emitter class, manages per-torch instances
- Modify: `src/scene/SceneManager.ts` — create/remove torches with milestone progression

---

## Stream 4: Water Shader & Oasis

### Water Material
- Custom `ShaderMaterial` on `CircleGeometry`
- Animated UV distortion for ripple effect (two overlapping sine waves at different frequencies)
- Reflective: `envMap` from scene or simple sky color reflection
- Transparency with depth-based edge fade
- Subtle color shift with time of day (darker blue at night, warm teal in sunlight)

### Oasis Upgrades
- Reeds sway gently (vertex shader animation on Y rotation)
- Occasional dragonfly particle (1-2 small emissive dots circling the water)

### Files
- New: `src/effects/WaterShader.ts` — custom water material + animation
- Modify: `src/scene/SceneManager.ts` — replace oasis water mesh material

---

## Stream 5: Living World

### Birds
- Flock of 5-8 simple bird meshes (two flat triangles for wings, animated flap)
- Boid-like flocking behavior: circle the pyramid, occasionally land on structures
- Spatial audio: random bird call sounds when near camera

### Camels
- 2-3 static camel meshes near quarry (procedural box primitives like workers)
- Idle animation: subtle head bob
- Purely decorative

### Worker Pathfinding
- Workers walk from quarry area toward next block placement position
- Simple A->B lerp with slight curve, not true pathfinding
- "Carry" animation shows block above head during movement

### Block Landing Dust
- Burst of 8-12 tan particles at block impact point
- Fast fade (0.3s), scatter outward and down

### Files
- New: `src/characters/BirdFlock.ts` — boid flock + wing animation
- New: `src/characters/CamelModel.ts` — static decorative mesh
- Modify: `src/characters/SessionController.ts` — walk-to-target lerp
- Modify: `src/structures/BuildManager.ts` — emit dust on land

---

## Stream 6: Ambient Sound Design

All procedural via Web Audio API — no audio file dependencies.

| Sound | Implementation | Trigger |
|-------|---------------|---------|
| Desert wind | Filtered white noise (bandpass 200-800Hz), volume oscillates slowly | Continuous, scales with sand particle count |
| Water lapping | Low-frequency sine modulated by slower sine, with noise burst | Near oasis, distance-attenuated from camera |
| Bird calls | Short sine chirps (2-4 tones, 1000-3000Hz range) | Random 5-15s interval when birds present |
| Construction hits | Sharp noise burst (50ms, high-pass filtered) | When worker is in 'chisel' activity |
| Torch crackle | Rapid random noise bursts (20-40ms, medium frequency) | When torches active (L7+) |

### Spatial Audio
- Use `PannerNode` for 3D positioning (birds, water, torches)
- Sounds attenuate with distance from camera

### Files
- New: `src/audio/AmbientAudio.ts` — manages all ambient sound sources
- Modify: `src/scene/SceneManager.ts` — pass camera position for spatial audio updates

---

## Stream 7: UI Polish & Achievement System

### Achievement Toasts
- Slide-in from right side, gold border, milestone icon + name + "UNLOCKED"
- Auto-dismiss after 5s with fade-out
- Queue multiple toasts if they fire close together

### Statistics Panel
- Toggle-able overlay (keyboard shortcut or button)
- Shows: total blocks placed, XP earned, XP/hour rate, time since first block, structures completed, current structure progress, sessions count
- Updates in real-time

### Build Timeline
- Vertical timeline in sidebar (below current activity log)
- Each milestone shows: icon, name, XP threshold, unlock timestamp, time elapsed since previous
- Scrollable, most recent at top

### Minimap
- Small (150x150px) top-right corner canvas
- Top-down orthographic view of all structures
- Color-coded: built (gold), in-progress (orange pulsing), not started (gray outline)
- Camera frustum indicator

### Files
- New: `src/ui/AchievementToast.ts`
- New: `src/ui/StatsPanel.ts`
- New: `src/ui/Minimap.ts`
- Modify: `src/ui/Sidebar.ts` — add build timeline section
- Modify: `src/hud/HUD.ts` — trigger toast on milestone unlock

---

## Implementation Priority
1. Streams 1-3 (post-processing, night sky, torches) — highest visual impact
2. Streams 4-5 (water, living world) — immersion
3. Streams 6-7 (audio, UI) — polish

## New Files Summary
| File | Stream |
|------|--------|
| `src/effects/PostProcessing.ts` | 1 |
| `src/effects/NightSky.ts` | 2 |
| `src/effects/Clouds.ts` | 2 |
| `src/effects/TorchFire.ts` | 3 |
| `src/effects/WaterShader.ts` | 4 |
| `src/characters/BirdFlock.ts` | 5 |
| `src/characters/CamelModel.ts` | 5 |
| `src/audio/AmbientAudio.ts` | 6 |
| `src/ui/AchievementToast.ts` | 7 |
| `src/ui/StatsPanel.ts` | 7 |
| `src/ui/Minimap.ts` | 7 |

## Modified Files Summary
| File | Streams |
|------|---------|
| `src/scene/SceneManager.ts` | 1, 2, 3, 4, 6 |
| `src/structures/BuildManager.ts` | 5 |
| `src/characters/SessionController.ts` | 5 |
| `src/ui/Sidebar.ts` | 7 |
| `src/hud/HUD.ts` | 7 |
| `src/main.ts` | 1, 2, 3, 4, 5, 6, 7 |
