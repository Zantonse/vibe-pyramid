# Visual Level Progression Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make each milestone era visually distinct in the 3D pyramid — different block materials, sky atmosphere, sand particle color, and scene lighting — with blocks preserving their era's appearance as strata.

**Architecture:** Server tracks which milestone was active for each block range. Client uses per-era `InstancedMesh` groups with `MeshStandardMaterial` (supports metalness/roughness/emissive). SceneManager and SandParticles accept a milestone level to shift atmosphere. Changes flow bottom-up: types → server → pyramid → scene → effects → wiring.

**Tech Stack:** Three.js (InstancedMesh, MeshStandardMaterial, PointLight, ShaderMaterial uniforms), TypeScript, Express, WebSocket.

---

### Task 1: Add era visual configs and block range tracking to shared types

**Files:**
- Modify: `shared/types.ts:16-29` (add ERA_VISUALS after MILESTONES)
- Modify: `shared/types.ts:84-91` (add milestone_block_ranges to PyramidState)

**Step 1: Add ERA_VISUALS config array**

After the `MILESTONES` constant (line 29), add:

```typescript
export interface EraVisual {
  hue: number;
  hueRange: number;
  saturation: number;
  saturationRange: number;
  lightness: number;
  lightnessRange: number;
  roughness: number;
  metalness: number;
  emissiveIntensity: number; // 0 = none, >0 = self-glow
}

// Visual properties for blocks placed during each milestone era
export const ERA_VISUALS: EraVisual[] = [
  // Level 0: Surveying the Sands — pale rough sandstone
  { hue: 0.08, hueRange: 0.04, saturation: 0.25, saturationRange: 0.15, lightness: 0.7, lightnessRange: 0.1, roughness: 0.9, metalness: 0, emissiveIntensity: 0 },
  // Level 1: Laying Foundations — warm mudbrick
  { hue: 0.05, hueRange: 0.03, saturation: 0.4, saturationRange: 0.15, lightness: 0.55, lightnessRange: 0.1, roughness: 0.85, metalness: 0, emissiveIntensity: 0 },
  // Level 2: Rising Walls — cut limestone
  { hue: 0.10, hueRange: 0.03, saturation: 0.3, saturationRange: 0.1, lightness: 0.72, lightnessRange: 0.08, roughness: 0.7, metalness: 0.05, emissiveIntensity: 0 },
  // Level 3: Inner Chambers — polished granite
  { hue: 0.58, hueRange: 0.04, saturation: 0.15, saturationRange: 0.08, lightness: 0.4, lightnessRange: 0.08, roughness: 0.4, metalness: 0.15, emissiveIntensity: 0 },
  // Level 4: Gilding the Facade — gilded limestone
  { hue: 0.12, hueRange: 0.03, saturation: 0.65, saturationRange: 0.1, lightness: 0.6, lightnessRange: 0.08, roughness: 0.35, metalness: 0.3, emissiveIntensity: 0.08 },
  // Level 5: Placing the Capstone — electrum/royal gold
  { hue: 0.13, hueRange: 0.02, saturation: 0.75, saturationRange: 0.1, lightness: 0.65, lightnessRange: 0.08, roughness: 0.25, metalness: 0.5, emissiveIntensity: 0.15 },
];
```

**Step 2: Add MilestoneBlockRange interface and update PyramidState**

After `MilestoneUnlock` interface (line 34), add:

```typescript
export interface MilestoneBlockRange {
  milestoneIndex: number;
  startBlock: number;
  endBlock: number; // exclusive — updated as blocks are placed
}
```

Add `milestone_block_ranges` to the `PyramidState` interface:

```typescript
export interface PyramidState {
  total_xp: number;
  blocks_placed: number;
  pyramid_layer: number;
  sessions: Record<string, SessionState>;
  milestone_unlocks: MilestoneUnlock[];
  milestone_block_ranges: MilestoneBlockRange[];
}
```

**Step 3: Add current_milestone_index to ToolActivityMessage**

The client needs to know the current milestone when a tool event arrives, so it can color new blocks correctly:

```typescript
export interface ToolActivityMessage {
  type: 'tool_activity';
  session_id: string;
  tool: string;
  xp_earned: number;
  total_xp: number;
  blocks_placed: number;
  metadata: { file?: string; command?: string };
  current_milestone_index: number;
}
```

**Step 4: Verify — run `npx tsc --noEmit`**

Expected: no errors (types only, no runtime changes yet).

**Step 5: Commit**

```
feat: add era visual configs and block range tracking types
```

---

### Task 2: Server-side block range tracking

**Files:**
- Modify: `server/state.ts:8-14` (DEFAULT_STATE)
- Modify: `server/state.ts:74-128` (processToolEvent)
- Modify: `server/index.ts:46-57` (add current_milestone_index to broadcast)

**Step 1: Update DEFAULT_STATE**

In `server/state.ts`, add `milestone_block_ranges: []` to DEFAULT_STATE:

```typescript
const DEFAULT_STATE: PyramidState = {
  total_xp: 0,
  blocks_placed: 0,
  pyramid_layer: 0,
  sessions: {},
  milestone_unlocks: [],
  milestone_block_ranges: [],
};
```

**Step 2: Add backward compat and block range tracking in processToolEvent**

After the existing `milestone_unlocks` backward compat (line 84), add:

```typescript
if (!state.milestone_block_ranges) {
  state.milestone_block_ranges = [];
}
```

After `state.blocks_placed` is updated (line 88), add block range tracking:

```typescript
// Determine current milestone index
let currentMilestoneIndex = 0;
for (let i = MILESTONES.length - 1; i >= 0; i--) {
  if (state.total_xp >= MILESTONES[i].xpThreshold) {
    currentMilestoneIndex = i;
    break;
  }
}

// Update or create block range for current milestone
const prevBlocks = Math.floor(prevXp / XP_PER_BLOCK);
const newBlocks = state.blocks_placed;
if (newBlocks > prevBlocks) {
  const lastRange = state.milestone_block_ranges[state.milestone_block_ranges.length - 1];
  if (lastRange && lastRange.milestoneIndex === currentMilestoneIndex) {
    lastRange.endBlock = newBlocks;
  } else {
    state.milestone_block_ranges.push({
      milestoneIndex: currentMilestoneIndex,
      startBlock: prevBlocks,
      endBlock: newBlocks,
    });
  }
}
```

**Step 3: Return currentMilestoneIndex from processToolEvent**

Update the return type and value:

```typescript
): { xp_earned: number; total_xp: number; blocks_placed: number; new_milestone_index: number | null; current_milestone_index: number } {
  // ...existing code...
  return {
    xp_earned: xp,
    total_xp: state.total_xp,
    blocks_placed: state.blocks_placed,
    new_milestone_index,
    current_milestone_index: currentMilestoneIndex,
  };
}
```

**Step 4: Add current_milestone_index to ToolActivityMessage broadcast in server/index.ts**

In `server/index.ts` line 48-57, add the field:

```typescript
const msg: ToolActivityMessage = {
  type: 'tool_activity',
  session_id: event.session_id,
  tool: event.tool_name,
  xp_earned: result.xp_earned,
  total_xp: result.total_xp,
  blocks_placed: result.blocks_placed,
  metadata: { file, command },
  current_milestone_index: result.current_milestone_index,
};
```

**Step 5: Verify — restart server, check health endpoint**

Run: `curl http://localhost:4200/health | jq .state.milestone_block_ranges`
Expected: `[]` (or populated array if blocks already exist). No crash.

**Step 6: Commit**

```
feat: server tracks block ranges per milestone era
```

---

### Task 3: Multi-material pyramid builder with per-era InstancedMesh

**Files:**
- Rewrite: `src/pyramid/PyramidBuilder.ts` (major changes to constructor, color, restore, animate)

This is the biggest task. The pyramid builder currently uses a single `InstancedMesh` with `MeshLambertMaterial`. We replace it with a per-era system:

- An array of `InstancedMesh` objects, one per era (6 total), each with its own `MeshStandardMaterial`.
- Each era mesh has its own instance count.
- `restoreBlocks()` accepts `milestone_block_ranges` to color blocks by era.
- `queueBlocks()` and `startBlockAnimation()` accept a `milestoneIndex` parameter.

**Step 1: Rewrite PyramidBuilder**

Key changes:
- `constructor`: Create 6 `InstancedMesh` objects (one per `ERA_VISUALS` entry), each with `MeshStandardMaterial` configured for that era's roughness, metalness, and emissive.
- `eraMeshes: THREE.InstancedMesh[]` — array of per-era meshes.
- `eraInstanceCounts: number[]` — track how many instances each era mesh has.
- `blockEraAssignment: number[]` — maps slot index → era index (for restoration).
- `randomBlockColor(eraIndex)` — uses `ERA_VISUALS[eraIndex]` for hue/sat/light ranges.
- `restoreBlocks(count, milestoneBlockRanges)` — assigns each block to its era based on ranges.
- `queueBlocks(targetTotal, milestoneIndex)` — new blocks use current milestone's era.
- `startBlockAnimation(index, milestoneIndex)` — places block in the correct era mesh.
- `placeBlockInstant(index, milestoneIndex)` — same.

The `MeshStandardMaterial` for each era:
```typescript
new THREE.MeshStandardMaterial({
  roughness: era.roughness,
  metalness: era.metalness,
  emissive: new THREE.Color().setHSL(era.hue, era.saturation, era.lightness * 0.3),
  emissiveIntensity: era.emissiveIntensity,
})
```

Each block goes into `eraMeshes[eraIndex]` at instance index `eraInstanceCounts[eraIndex]`. The color is set per-instance using `setColorAt`.

**Step 2: Verify — reload page, blocks should render with era-appropriate colors**

If user has 4,558 XP (milestone 3: Inner Chambers), all restored blocks should use era 0-3 colors. Since there are no `milestone_block_ranges` in existing state yet, fall back to current milestone for all existing blocks.

**Step 3: Commit**

```
feat: multi-material pyramid with per-era block strata
```

---

### Task 4: Scene atmosphere — sky, lighting, and point lights per milestone

**Files:**
- Modify: `src/scene/SceneManager.ts` (add setMilestoneLevel, atmosphere configs, point lights)

**Step 1: Add milestone atmosphere configs**

Add a static config array for per-level atmosphere:

```typescript
interface AtmosphereConfig {
  midColorBoost: number;    // 0-1: how much warmer/more golden the horizon gets
  ambientBoost: number;     // additional ambient light intensity
  sunIntensityBoost: number;
  innerGlow: boolean;       // point light inside pyramid at level 3+
  capstoneBeacon: boolean;  // beacon light at top at level 5
}

const ATMOSPHERE_CONFIGS: AtmosphereConfig[] = [
  { midColorBoost: 0, ambientBoost: 0, sunIntensityBoost: 0, innerGlow: false, capstoneBeacon: false },       // L0
  { midColorBoost: 0, ambientBoost: 0, sunIntensityBoost: 0, innerGlow: false, capstoneBeacon: false },       // L1
  { midColorBoost: 0.15, ambientBoost: 0.05, sunIntensityBoost: 0.1, innerGlow: false, capstoneBeacon: false }, // L2
  { midColorBoost: 0.3, ambientBoost: 0.1, sunIntensityBoost: 0.15, innerGlow: true, capstoneBeacon: false },  // L3
  { midColorBoost: 0.45, ambientBoost: 0.15, sunIntensityBoost: 0.2, innerGlow: true, capstoneBeacon: false }, // L4
  { midColorBoost: 0.6, ambientBoost: 0.25, sunIntensityBoost: 0.3, innerGlow: true, capstoneBeacon: true },  // L5
];
```

**Step 2: Add setMilestoneLevel method**

```typescript
private currentMilestoneLevel = 0;
private innerGlowLight: THREE.PointLight | null = null;
private capstoneLight: THREE.PointLight | null = null;

setMilestoneLevel(level: number): void {
  this.currentMilestoneLevel = Math.min(level, ATMOSPHERE_CONFIGS.length - 1);
  const config = ATMOSPHERE_CONFIGS[this.currentMilestoneLevel];

  // Inner glow: warm amber point light at y=3 (inside lower pyramid layers)
  if (config.innerGlow && !this.innerGlowLight) {
    this.innerGlowLight = new THREE.PointLight(0xffaa44, 2, 30, 1.5);
    this.innerGlowLight.position.set(0, 3, 0);
    this.scene.add(this.innerGlowLight);
  } else if (!config.innerGlow && this.innerGlowLight) {
    this.scene.remove(this.innerGlowLight);
    this.innerGlowLight.dispose();
    this.innerGlowLight = null;
  }

  // Capstone beacon: bright point light at pyramid apex
  if (config.capstoneBeacon && !this.capstoneLight) {
    this.capstoneLight = new THREE.PointLight(0xffd700, 4, 60, 1);
    this.capstoneLight.position.set(0, 11, 0); // top of 10-layer pyramid
    this.scene.add(this.capstoneLight);
  } else if (!config.capstoneBeacon && this.capstoneLight) {
    this.scene.remove(this.capstoneLight);
    this.capstoneLight.dispose();
    this.capstoneLight = null;
  }
}
```

**Step 3: Apply atmosphere in update()**

In the existing `update()` method, after sky color lerp, apply `midColorBoost`:

```typescript
// Apply milestone atmosphere boost to mid-color (warmer horizon)
const config = ATMOSPHERE_CONFIGS[this.currentMilestoneLevel];
if (config.midColorBoost > 0 && this.skyMaterial) {
  const gold = new THREE.Color(0xffd700);
  this.skyMaterial.uniforms.midColor.value.lerp(gold, config.midColorBoost * 0.3);
}
```

And boost ambient/sun intensity:

```typescript
if (this.sunLight) {
  const dayFactor = 0.5 + 0.5 * Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2);
  this.sunLight.intensity = (0.4 + dayFactor * 1.1) + config.sunIntensityBoost;
}
if (this.ambientLight) {
  const dayFactor = 0.5 + 0.5 * Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2);
  this.ambientLight.intensity = (0.15 + dayFactor * 0.25) + config.ambientBoost;
}
```

**Step 4: Verify — call setMilestoneLevel(5) manually in console, confirm beacon light visible**

**Step 5: Commit**

```
feat: scene atmosphere shifts per milestone level
```

---

### Task 5: Sand particle color and density per milestone

**Files:**
- Modify: `src/effects/SandParticles.ts` (add color uniform, setMilestoneLevel)

**Step 1: Add color uniform to shader**

Replace the hardcoded color `vec4(0.835, 0.647, 0.455, ...)` with a uniform:

```typescript
// In constructor, add uniform:
const material = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(0xd5a574) }, // default sand
  },
  // ...
});
```

Update fragment shader to use the uniform:

```glsl
uniform vec3 uColor;
// ...
gl_FragColor = vec4(uColor, edge * vOpacity * 0.6);
```

**Step 2: Add setMilestoneLevel method**

```typescript
private static readonly SAND_COLORS: THREE.Color[] = [
  new THREE.Color(0xd5a574), // L0: default sand
  new THREE.Color(0xd5a574), // L1: default sand
  new THREE.Color(0xd5a574), // L2: default sand
  new THREE.Color(0xdbb070), // L3: faint gold tint
  new THREE.Color(0xe0b850), // L4: golden dust
  new THREE.Color(0xffd700), // L5: bright golden sparkle
];

private static readonly OPACITY_SCALE: number[] = [0.6, 0.6, 0.6, 0.65, 0.7, 0.85];

setMilestoneLevel(level: number): void {
  const idx = Math.min(level, SandParticles.SAND_COLORS.length - 1);
  const mat = this.particles.material as THREE.ShaderMaterial;
  (mat.uniforms.uColor.value as THREE.Color).copy(SandParticles.SAND_COLORS[idx]);
}
```

**Step 3: Verify — reload, sand should appear normal at current level**

**Step 4: Commit**

```
feat: sand particle color shifts per milestone level
```

---

### Task 6: Wire milestone level through EventRouter and main.ts

**Files:**
- Modify: `src/events/EventRouter.ts:43-74` (pass milestone to pyramid and scene)
- Modify: `src/events/EventRouter.ts:87-103` (restore with block ranges)
- Modify: `src/main.ts:21` (wire level-up to scene and sand)

**Step 1: Update EventRouter constructor to accept SandParticles**

```typescript
import { SandParticles } from '../effects/SandParticles.js';

export class EventRouter {
  private characters: CharacterFactory;
  private pyramid: PyramidBuilder;
  private hud: HUD;
  private sidebar: Sidebar;
  private sceneManager: SceneManager;
  private sand: SandParticles;

  constructor(characters: CharacterFactory, pyramid: PyramidBuilder, hud: HUD, sidebar: Sidebar, sceneManager: SceneManager, sand: SandParticles) {
    // ...assign all
  }
}
```

**Step 2: Update handleToolActivity to pass milestone index**

```typescript
private handleToolActivity(
  sessionId: string,
  tool: string,
  xpEarned: number,
  totalXp: number,
  blocksPlaced: number,
  metadata: { file?: string; command?: string },
  currentMilestoneIndex: number
): void {
  // ...existing character/activity code...

  this.pyramid.queueBlocks(blocksPlaced, currentMilestoneIndex);
  this.hud.updateXP(totalXp, blocksPlaced, this.pyramid.totalSlots);

  // Update atmosphere when milestone changes
  this.sceneManager.setMilestoneLevel(currentMilestoneIndex);
  this.sand.setMilestoneLevel(currentMilestoneIndex);

  // ...existing activity text code...
}
```

Update the `handle()` switch to pass `msg.current_milestone_index`:

```typescript
case 'tool_activity':
  this.handleToolActivity(msg.session_id, msg.tool, msg.xp_earned, msg.total_xp, msg.blocks_placed, msg.metadata, msg.current_milestone_index);
  break;
```

**Step 3: Update handleStateSnapshot to restore with block ranges and set atmosphere**

```typescript
private handleStateSnapshot(state: PyramidState): void {
  this.pyramid.restoreBlocks(state.blocks_placed, state.milestone_block_ranges || []);
  this.hud.updateXP(state.total_xp, state.blocks_placed, this.pyramid.totalSlots);

  // Determine current milestone from XP
  let currentMilestone = 0;
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (state.total_xp >= MILESTONES[i].xpThreshold) {
      currentMilestone = i;
      break;
    }
  }
  this.sceneManager.setMilestoneLevel(currentMilestone);
  this.sand.setMilestoneLevel(currentMilestone);

  // ...existing session/milestone restore code...
}
```

**Step 4: Update main.ts wiring**

Pass `sand` to EventRouter:

```typescript
const router = new EventRouter(characters, pyramid, hud, sidebar, sceneManager, sand);
```

Wire HUD level-up to also update scene and sand:

```typescript
hud.onLevelUp((_name, index) => {
  audio.playLevelUp(index);
  sceneManager.setMilestoneLevel(index);
  sand.setMilestoneLevel(index);
});
```

**Step 5: Verify — full end-to-end**

1. Reload page. Existing blocks should restore with era-appropriate colors (or all current-era if no ranges saved yet).
2. Scene should have appropriate atmosphere for current milestone (4,558 XP = level 3, so inner glow should appear).
3. Sand should have faint golden tint.

**Step 6: Commit**

```
feat: wire milestone visual progression through all systems
```

---

### Task 7: Backward compatibility — migrate existing state without block ranges

**Files:**
- Modify: `server/state.ts` (in loadState, synthesize ranges for existing state)

**Step 1: After loading state, if milestone_block_ranges is empty but blocks exist, synthesize ranges**

In `loadState()`, after parsing the state, add:

```typescript
// Migrate: if blocks exist but no ranges tracked, assign all to current milestone
if (state.blocks_placed > 0 && (!state.milestone_block_ranges || state.milestone_block_ranges.length === 0)) {
  let currentMilestone = 0;
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (state.total_xp >= MILESTONES[i].xpThreshold) {
      currentMilestone = i;
      break;
    }
  }
  state.milestone_block_ranges = [{
    milestoneIndex: currentMilestone,
    startBlock: 0,
    endBlock: state.blocks_placed,
  }];
}
```

This means all existing blocks will render with the current era's material, which is reasonable since there's no historical data to reconstruct.

**Step 2: Verify — restart server, check /health endpoint has milestone_block_ranges populated**

**Step 3: Commit**

```
feat: backward compat migration for block range tracking
```
