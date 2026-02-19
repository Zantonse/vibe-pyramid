# Grand Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the pyramid visualization into an immersive cinematic experience across 7 streams: post-processing, night sky, fire/torches, water shader, living world, ambient audio, and UI polish.

**Architecture:** Each stream is independent — creates a new module file, wires it into `main.ts` and/or `SceneManager.ts`, verifies via `npx tsc --noEmit` and visual inspection. No stream depends on another. SceneManager exposes `dayTime` and `camera` for systems that need them.

**Tech Stack:** Three.js r182, TypeScript, Web Audio API, Vite

---

## Stream 1: Post-Processing (Bloom + God Rays)

### Task 1: Add bloom post-processing

**Files:**
- Create: `src/effects/PostProcessing.ts`
- Modify: `src/scene/SceneManager.ts` (expose renderer/scene/camera publicly, add resize hook)
- Modify: `src/main.ts` (replace `sceneManager.render()` with post-processing render)

**Implementation:**

Create `src/effects/PostProcessing.ts`:
- Import `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass` from `three/addons/postprocessing/`
- Constructor takes `(renderer, scene, camera)`, sets up composer with RenderPass + UnrealBloomPass (strength 0.4, radius 0.5, threshold 0.7) + OutputPass
- `setMilestoneLevel(level)`: scales bloom strength from 0.2 to 0.6 based on level
- `resize(width, height)`: calls `composer.setSize()`
- `render()`: calls `composer.render()`

Wire in `main.ts`:
- Create PostProcessing after SceneManager
- In render loop, call `postProcessing.render()` instead of `sceneManager.render()`
- On resize, call `postProcessing.resize()`
- In `hud.onLevelUp` callback, also call `postProcessing.setMilestoneLevel(index)`

Add `get currentDayTime(): number` getter to SceneManager (returns `this.dayTime`).

**Verify:** `npx tsc --noEmit` — no errors. Gold blocks at L4+ should glow with subtle bloom.

**Commit:** `feat: add bloom post-processing pipeline`

---

## Stream 2: Night Sky & Weather

### Task 2: Add star field and moon

**Files:**
- Create: `src/effects/NightSky.ts`
- Modify: `src/main.ts`

**Implementation:**

Create `src/effects/NightSky.ts`:
- 2000 stars as `BufferGeometry` point cloud on large sphere (radius 450, upper hemisphere)
- Custom `ShaderMaterial` with `uOpacity` and `uTime` uniforms
- Vertex shader: pass per-star `aPhase` attribute for twinkle offset
- Fragment shader: twinkle = `0.7 + 0.3 * sin(uTime * 2.0 + vPhase * 6.28)`, soft circle mask
- Moon: `SphereGeometry(5)` with emissive white `MeshBasicMaterial`, positioned opposite sun
- `update(delta, dayTime)`: fade stars in when nightAmount > 0.15, move moon opposite sun angle

Wire in `main.ts`: create NightSky, call `update(delta, sceneManager.currentDayTime)` in loop.

**Verify:** `npx tsc --noEmit`. Wait for night phase — stars fade in with twinkle, moon appears.

**Commit:** `feat: add star field and moon for night sky`

### Task 3: Add procedural clouds

**Files:**
- Create: `src/effects/Clouds.ts`
- Modify: `src/main.ts`

**Implementation:**

Create `src/effects/Clouds.ts`:
- 8 cloud billboard planes with procedural canvas textures (radial gradients for soft blobs)
- Each cloud has speed, baseOpacity, phase offset
- `update(delta, dayTime)`: drift clouds on X axis (wrap at +-150), modulate opacity with slow sine, reduce visibility at night

Wire in `main.ts`.

**Verify + Commit:** `feat: add procedural drifting clouds`

---

## Stream 3: Fire & Torch System

### Task 4: Add torch fire particle system

**Files:**
- Create: `src/effects/TorchFire.ts`
- Modify: `src/scene/SceneManager.ts` (add torch fire field, manage in setMilestoneLevel)
- Modify: `src/main.ts`

**Implementation:**

Create `src/effects/TorchFire.ts`:
- Manages multiple torch emitters, each with 40 flame particles
- Single shared `THREE.Points` mesh with position/color/size buffers (additive blending)
- Vertex shader: billboard points scaled by distance
- Fragment shader: soft circle with per-particle rgba color
- `addTorch(position, intensity)`: creates PointLight + particle emitter at position
- `removeTorch(position)` / `removeAll()`
- `update(delta)`: spawn particles rising from origin with turbulence, color gradient white->yellow->orange->transparent, flicker light intensity randomly

In SceneManager:
- Add public `torchFire: TorchFire | null = null`
- In `setMilestoneLevel`, at level >= 7 add entrance torches via `this.torchFire.addTorch()`
- At level >= 9 add structure torches

Wire in `main.ts`: create TorchFire, assign to sceneManager.torchFire, call update in loop.

**Verify + Commit:** `feat: add animated torch fire particle system`

---

## Stream 4: Water Shader & Oasis

### Task 5: Add animated water shader

**Files:**
- Create: `src/effects/WaterShader.ts`
- Modify: `src/scene/SceneManager.ts` (remove old water mesh from createOasis)
- Modify: `src/main.ts`

**Implementation:**

Create `src/effects/WaterShader.ts`:
- Custom `ShaderMaterial` on `CircleGeometry(4, 32)` rotated -PI/2
- Uniforms: uTime, uDayTime, uBaseColor (0x1a6b8a), uNightColor (0x0a3040)
- Fragment shader: animated UV ripple distortion (3 overlapping sine waves), edge fade via distance from center, day/night color blend, surface shimmer highlights
- `update(delta, dayTime)`: increment uTime, update uDayTime

In SceneManager.createOasis(): remove the existing `MeshStandardMaterial` water mesh (lines creating waterGeo/waterMat/water) but keep bank + reeds.

Wire in `main.ts`: create WaterShader at position (26, 0, -17), call update in loop.

**Verify + Commit:** `feat: add animated water shader for oasis`

---

## Stream 5: Living World

### Task 6: Add bird flock

**Files:**
- Create: `src/characters/BirdFlock.ts`
- Modify: `src/main.ts`

**Implementation:**

Create `src/characters/BirdFlock.ts`:
- 6 birds orbiting the pyramid at varying heights (12-20) and radii (15-30)
- Each bird: Group with elongated sphere body + two triangle wing meshes
- Boid-like orbit: each bird has angle, angular speed, orbit radius
- Wings flap via rotation.z = sin(flapPhase) with per-bird speed/phase
- `update(delta)`: advance angle, update position on orbit, lookAt next position, flap wings

Wire in `main.ts`.

**Verify + Commit:** `feat: add circling bird flock around pyramid`

### Task 7: Add decorative camels

**Files:**
- Create: `src/characters/CamelModel.ts`
- Modify: `src/main.ts`

**Implementation:**

Create `src/characters/CamelModel.ts`:
- 3 camels near quarry built from box primitives (body, hump, head, neck, 4 legs)
- Idle animation: subtle head bob via sine wave on Y position
- `update(delta)`: increment phase, bob head

Wire in `main.ts`.

**Verify + Commit:** `feat: add decorative camels near quarry`

### Task 8: Add block landing dust particles

**Files:**
- Create: `src/effects/DustBurst.ts`
- Modify: `src/structures/BuildManager.ts` (add onBlockLandPosition callback)
- Modify: `src/pyramid/PyramidBuilder.ts` (add onBlockLandPosition callback)
- Modify: `src/main.ts`

**Implementation:**

Create `src/effects/DustBurst.ts`:
- Pool of burst effects, each with 10 particles
- `emit(position)`: creates 10 particles at position radiating outward+up with gravity
- Particles live 0.4s, fade out linearly
- Single `THREE.Points` mesh with position/alpha/size attributes
- `update(delta)`: advance particles, apply gravity, write to buffers

In PyramidBuilder: add `onBlockLandPosition(cb: (pos: Vector3) => void)` method. Call it in the animation completion handler (line ~211) passing `anim.target`.

In BuildManager: same pattern for structure blocks (line ~279), passing `anim.target`.

Wire in `main.ts`: create DustBurst, connect callbacks, call update in loop.

**Verify + Commit:** `feat: add dust burst particles on block landing`

---

## Stream 6: Ambient Sound Design

### Task 9: Add ambient audio system

**Files:**
- Create: `src/audio/AmbientAudio.ts`
- Modify: `src/main.ts`

**Implementation:**

Create `src/audio/AmbientAudio.ts`:
- `warmup()`: create AudioContext, init wind + water
- Wind: looped white noise buffer → bandpass filter (400Hz) → gain (0.03), oscillate gain slowly
- Water: sine oscillator (120Hz) modulated by LFO (0.3Hz) → lowpass → gain (0.015)
- Bird calls: on random 5-15s interval, play 2-4 short sine chirps (1200-3000Hz, 0.08s each)
- Torch crackle: when `torchesActive=true`, rapid noise bursts every 0.1-0.3s
- `setTorchesActive(active)`: toggle torch crackle
- `update(delta)`: oscillate wind, trigger birds, trigger crackle

Wire in `main.ts`: create AmbientAudio, warmup on click, update in loop. Set torchesActive when milestone >= 7.

**Verify + Commit:** `feat: add ambient audio (wind, water, birds, torch crackle)`

---

## Stream 7: UI Polish & Achievement System

### Task 10: Add achievement toast notifications

**Files:**
- Create: `src/ui/AchievementToast.ts`
- Modify: `src/hud/HUD.ts` (trigger toast on level up)
- Modify: `src/main.ts`

**Implementation:**

Create `src/ui/AchievementToast.ts`:
- Fixed container top-right (right: 340px for sidebar clearance)
- `show(icon, name)`: creates DOM element with gold border, "UNLOCKED" label, icon + name
- Slide-in via CSS transform transition, auto-dismiss after 5s with fade-out
- Queue system: if multiple milestones fire close together, show sequentially
- All DOM construction via createElement/textContent (no innerHTML)

In HUD: add `setToast(toast: AchievementToast)` method. In `triggerLevelUp`, call `this.toast?.show(icon, milestoneName)`.

Wire in `main.ts`: create AchievementToast, pass to HUD via `hud.setToast(toast)`.

**Verify + Commit:** `feat: add achievement toast notifications on milestone unlock`

### Task 11: Add statistics panel

**Files:**
- Create: `src/ui/StatsPanel.ts`
- Modify: `src/main.ts`

**Implementation:**

Create `src/ui/StatsPanel.ts`:
- Fixed overlay centered on screen, dark background with gold border
- Toggle via Tab key (keydown listener, preventDefault)
- `update(totalXp, buildManager, sessionCount)`: rebuild display using DOM methods (createElement, textContent)
- Shows: Total XP, XP/hour, blocks placed/total, current structure, structure progress, sessions, uptime
- `formatTime()` helper for human-readable duration

Wire in `main.ts`: create StatsPanel, call update every 30 frames in render loop.

**Verify + Commit:** `feat: add statistics panel (Tab to toggle)`

### Task 12: Add minimap

**Files:**
- Create: `src/ui/Minimap.ts`
- Modify: `src/main.ts`

**Implementation:**

Create `src/ui/Minimap.ts`:
- 150x150 canvas, fixed top-right (right: 336px)
- `update(buildManager)`: clear canvas, draw structures as colored rectangles
- Main pyramid: gold if complete, amber if building
- Each structure from registry: gold outline if not started, filled if in-progress/complete
- Scale: 120 world units mapped to canvas width

Wire in `main.ts`: create Minimap, call update every 60 frames.

**Verify + Commit:** `feat: add minimap showing structure layout`

---

## Task Summary

| # | Stream | New File | Description |
|---|--------|----------|-------------|
| 1 | Post-Processing | `src/effects/PostProcessing.ts` | Bloom via EffectComposer |
| 2 | Night Sky | `src/effects/NightSky.ts` | Star field + moon |
| 3 | Weather | `src/effects/Clouds.ts` | Procedural drifting clouds |
| 4 | Fire | `src/effects/TorchFire.ts` | Torch flame particles |
| 5 | Water | `src/effects/WaterShader.ts` | Animated water shader |
| 6 | Living World | `src/characters/BirdFlock.ts` | Bird flock circling pyramid |
| 7 | Living World | `src/characters/CamelModel.ts` | Decorative camels |
| 8 | Living World | `src/effects/DustBurst.ts` | Block landing dust burst |
| 9 | Audio | `src/audio/AmbientAudio.ts` | Wind, water, birds, crackle |
| 10 | UI | `src/ui/AchievementToast.ts` | Milestone unlock toasts |
| 11 | UI | `src/ui/StatsPanel.ts` | Statistics overlay (Tab) |
| 12 | UI | `src/ui/Minimap.ts` | Top-down structure map |

**Modified files across all tasks:**
- `src/main.ts` — all 12 tasks
- `src/scene/SceneManager.ts` — tasks 1, 2, 4, 5
- `src/structures/BuildManager.ts` — task 8
- `src/pyramid/PyramidBuilder.ts` — task 8
- `src/hud/HUD.ts` — task 10
