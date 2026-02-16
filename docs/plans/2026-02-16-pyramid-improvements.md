# Pyramid Visualization Improvements

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 14 visual, UX, performance, and polish improvements to the Pyramid Claude Code visualization.

**Architecture:** Each improvement is a self-contained change to one or two files. The work is grouped into 8 tasks ordered by dependency — HUD migration to HTML first (unblocks progress bar), then pyramid fill order, sky gradient, sand particles, InstancedMesh, HUD texture reuse, audio, and favicon. Character spacing and EventRouter idle filtering are folded into relevant tasks.

**Tech Stack:** Three.js r182, TypeScript, Vite, HTML/CSS overlays

---

### Task 1: Migrate HUD from 3D sprites to HTML overlay

The XP counter and floating "+XP" text are Three.js Sprites in world-space. They drift off-screen when the camera orbits. Convert them to fixed HTML elements.

**Files:**
- Rewrite: `src/hud/HUD.ts` (full rewrite — replace Three.js sprite approach with DOM elements)
- Modify: `src/main.ts:14` (HUD no longer needs scene reference)

**Step 1: Rewrite HUD.ts as an HTML overlay**

Replace the entire file. The new HUD creates a fixed-position container with:
- A `#pyr-hud-bar` div pinned bottom-center showing "Blocks: N / Total | XP: M" plus a thin progress bar
- Floating "+XP" text rendered as absolutely-positioned divs that animate upward with CSS transitions and remove themselves after 2s

```typescript
// src/hud/HUD.ts
interface FloatingText {
  el: HTMLElement;
  startTime: number;
}

export class HUD {
  private container: HTMLElement;
  private barEl: HTMLElement;
  private blocksEl: HTMLElement;
  private xpEl: HTMLElement;
  private progressEl: HTMLElement;
  private floatingTexts: FloatingText[] = [];

  constructor() {
    this.injectStyles();

    this.container = document.createElement('div');
    this.container.id = 'pyr-hud';

    // Bottom bar
    this.barEl = document.createElement('div');
    this.barEl.className = 'pyr-hud-bar';

    this.blocksEl = document.createElement('span');
    this.blocksEl.className = 'pyr-hud-stat';
    this.blocksEl.textContent = 'Blocks: 0 / 0';

    this.xpEl = document.createElement('span');
    this.xpEl.className = 'pyr-hud-stat';
    this.xpEl.textContent = 'XP: 0';

    this.progressEl = document.createElement('div');
    this.progressEl.className = 'pyr-hud-progress';
    const progressFill = document.createElement('div');
    progressFill.className = 'pyr-hud-progress-fill';
    this.progressEl.appendChild(progressFill);

    this.barEl.appendChild(this.blocksEl);
    this.barEl.appendChild(this.xpEl);
    this.container.appendChild(this.barEl);
    this.container.appendChild(this.progressEl);

    document.body.appendChild(this.container);
  }

  updateXP(totalXp: number, blocksPlaced: number, totalSlots: number): void {
    this.blocksEl.textContent = `Blocks: ${blocksPlaced.toLocaleString()} / ${totalSlots.toLocaleString()}`;
    this.xpEl.textContent = `XP: ${totalXp.toLocaleString()}`;
    const pct = totalSlots > 0 ? (blocksPlaced / totalSlots) * 100 : 0;
    const fill = this.progressEl.querySelector('.pyr-hud-progress-fill') as HTMLElement;
    fill.style.width = `${pct}%`;
  }

  showActivityText(label: string, xpEarned: number): void {
    const el = document.createElement('div');
    el.className = 'pyr-hud-float';
    el.textContent = `+${xpEarned} XP  ${label}`;
    // Random horizontal position in the center 60% of screen
    const left = 20 + Math.random() * 60;
    el.style.left = `${left}%`;
    this.container.appendChild(el);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      el.classList.add('pyr-hud-float--animate');
    });

    const entry: FloatingText = { el, startTime: performance.now() };
    this.floatingTexts.push(entry);
  }

  updateSessionLabel(sessionId: string, name: string, status: string): void {
    // No-op — session labels are handled by Sidebar
  }

  update(delta: number): void {
    const now = performance.now();
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      if (now - ft.startTime > 2500) {
        ft.el.remove();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #pyr-hud {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 320px; /* leave room for sidebar */
        z-index: 900;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-bottom: 16px;
      }
      .pyr-hud-bar {
        display: flex;
        gap: 24px;
        background: rgba(62, 39, 35, 0.85);
        padding: 8px 24px;
        border-radius: 8px;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 15px;
        font-weight: 600;
        color: #f5deb3;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(201, 168, 76, 0.3);
      }
      .pyr-hud-progress {
        width: 240px;
        height: 4px;
        background: rgba(62, 39, 35, 0.6);
        border-radius: 2px;
        margin-top: 6px;
        overflow: hidden;
      }
      .pyr-hud-progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #c9a84c, #ffd700);
        border-radius: 2px;
        transition: width 0.5s ease;
      }
      .pyr-hud-float {
        position: absolute;
        bottom: 80px;
        transform: translateX(-50%);
        color: #ffcc00;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 16px;
        font-weight: 700;
        text-shadow: 0 1px 4px rgba(0,0,0,0.7);
        white-space: nowrap;
        opacity: 1;
        transition: opacity 2s ease, bottom 2s ease;
      }
      .pyr-hud-float--animate {
        opacity: 0;
        bottom: 200px;
      }
    `;
    document.head.appendChild(style);
  }
}
```

**Step 2: Update main.ts — HUD no longer takes scene**

Change line 14 from `new HUD(sceneManager.scene)` to `new HUD()`.

```typescript
// src/main.ts line 14
const hud = new HUD();
```

**Step 3: Verify in browser**

Run the app, confirm:
- XP bar stays pinned at bottom-center regardless of camera orbit
- Floating "+XP" text appears and fades upward
- Progress bar fills proportionally to blocks placed

**Step 4: Commit**

```bash
git add src/hud/HUD.ts src/main.ts
git commit -m "feat: migrate HUD from 3D sprites to fixed HTML overlay with progress bar"
```

---

### Task 2: Multi-layer pyramid fill order

Currently the pyramid fills bottom layer (400 blocks) before showing the second layer. Reorder slots to interleave layers so the stepped shape is visible from the very first blocks.

**Files:**
- Modify: `src/pyramid/PyramidBuilder.ts` — rewrite `generateSlots()` to produce a spiral/interleaved fill order

**Step 1: Replace `generateSlots()` with interleaved ordering**

After generating all slots layer-by-layer (keep that logic), sort them so we interleave: place outer-edge blocks of each layer first, then fill inward. This reveals the stepped pyramid shape early.

In `PyramidBuilder.ts`, replace the `generateSlots()` method:

```typescript
private generateSlots(): void {
  // First, generate all slots organized by layer
  const layers: BlockSlot[][] = [];
  let layerIndex = 0;
  for (let size = BASE_SIZE; size >= 2; size -= LAYER_STEP) {
    const yOffset = layerIndex * BLOCK_UNIT;
    const halfExtent = (size * BLOCK_UNIT) / 2;
    const layer: BlockSlot[] = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const x = -halfExtent + col * BLOCK_UNIT + BLOCK_UNIT / 2;
        const z = -halfExtent + row * BLOCK_UNIT + BLOCK_UNIT / 2;
        const y = yOffset + BLOCK_SIZE / 2;

        const isEdge = row === 0 || row === size - 1 || col === 0 || col === size - 1;

        layer.push({
          layer: layerIndex,
          row,
          col,
          position: new THREE.Vector3(x, y, z),
          placed: false,
          isEdge,
        });
      }
    }
    layers.push(layer);
    layerIndex++;
  }

  // Interleave: round-robin across layers, edges first within each layer
  // Sort each layer: edges first, then interior, both shuffled for natural look
  for (const layer of layers) {
    const edges = layer.filter(s => s.isEdge).sort(() => Math.random() - 0.5);
    const interior = layer.filter(s => !s.isEdge).sort(() => Math.random() - 0.5);
    layer.length = 0;
    layer.push(...edges, ...interior);
  }

  // Round-robin pick from each layer, weighted toward lower layers
  // Lower layers get more blocks per round (proportional to their size)
  const cursors = layers.map(() => 0);
  const totalBlocks = layers.reduce((sum, l) => sum + l.length, 0);

  while (this.slots.length < totalBlocks) {
    for (let li = 0; li < layers.length; li++) {
      if (cursors[li] >= layers[li].length) continue;
      // Lower layers get more blocks per round
      const blocksPerRound = Math.max(1, Math.ceil(layers[li].length / layers[0].length * 8));
      for (let b = 0; b < blocksPerRound && cursors[li] < layers[li].length; b++) {
        this.slots.push(layers[li][cursors[li]]);
        cursors[li]++;
      }
    }
  }
}
```

Also add `isEdge` to the `BlockSlot` interface:

```typescript
interface BlockSlot {
  layer: number;
  row: number;
  col: number;
  position: THREE.Vector3;
  placed: boolean;
  isEdge: boolean;
}
```

**Step 2: Verify in browser**

With ~78 blocks placed, the pyramid should now show blocks on multiple layers, revealing the stepped shape. The base should still have the most blocks, but upper layers should have a few.

**Step 3: Commit**

```bash
git add src/pyramid/PyramidBuilder.ts
git commit -m "feat: interleave pyramid fill order across layers for visible stepped shape early"
```

---

### Task 3: Soften sky gradient + add middle transition band

**Files:**
- Modify: `src/scene/SceneManager.ts` — update sky shader to add a warm gold middle band and soften the orange at horizon

**Step 1: Update the sky shader**

Replace the `createSky()` method's shader with a 3-stop gradient: warm amber at bottom, soft gold at middle, deep blue at top.

In `SceneManager.ts`, replace the fragment shader in `createSky()`:

```typescript
private createSky(): void {
  const skyGeo = new THREE.SphereGeometry(400, 32, 15);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x1a237e) },      // Deep blue
      midColor: { value: new THREE.Color(0xf5a623) },      // Warm gold
      bottomColor: { value: new THREE.Color(0xe8824a) },    // Soft terracotta
      midPoint: { value: 0.15 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float midPoint;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float t = max(0.0, h);
        vec3 color;
        if (t < midPoint) {
          color = mix(bottomColor, midColor, t / midPoint);
        } else {
          color = mix(midColor, topColor, (t - midPoint) / (1.0 - midPoint));
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  this.scene.add(new THREE.Mesh(skyGeo, skyMat));

  // Low-poly sun
  const sunGeo = new THREE.SphereGeometry(8, 8, 8);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(-100, 20, -150);
  this.scene.add(sun);
}
```

**Step 2: Verify in browser**

The horizon should now show a warm terracotta-to-gold-to-blue gradient rather than a harsh orange-to-blue split.

**Step 3: Commit**

```bash
git add src/scene/SceneManager.ts
git commit -m "feat: soften sky gradient with 3-stop warm gold transition band"
```

---

### Task 4: Enhance sand particles

Increase count, vary size and opacity, add larger dust clumps.

**Files:**
- Modify: `src/effects/SandParticles.ts`

**Step 1: Enhance particle system**

Replace `SandParticles.ts` with a version that uses per-particle size via a `size` attribute and `PointsMaterial.sizeAttenuation`:

```typescript
import * as THREE from 'three';

const PARTICLE_COUNT = 1500;

export class SandParticles {
  private particles: THREE.Points;
  private velocities: Float32Array;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const opacities = new Float32Array(PARTICLE_COUNT);
    this.velocities = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 8;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      this.velocities[i3] = 2 + Math.random() * 4;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.8;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 1.5;

      // Vary sizes: most small, some larger "dust clumps"
      const isClump = Math.random() < 0.08;
      sizes[i] = isClump ? 0.4 + Math.random() * 0.3 : 0.1 + Math.random() * 0.15;
      opacities[i] = isClump ? 0.25 + Math.random() * 0.15 : 0.3 + Math.random() * 0.35;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xd4a574) },
        pointTexture: { value: null },
      },
      vertexShader: `
        attribute float aSize;
        varying float vOpacity;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (200.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
          // Fade with distance
          vOpacity = smoothstep(150.0, 20.0, -mvPos.z);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          // Soft circle shape
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.2, d) * vOpacity * 0.6;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
  }

  update(delta: number): void {
    const positions = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posArray[i3] += this.velocities[i3] * delta;
      posArray[i3 + 1] += this.velocities[i3 + 1] * delta;
      posArray[i3 + 2] += this.velocities[i3 + 2] * delta;

      if (posArray[i3] > 50) {
        posArray[i3] = -50;
        posArray[i3 + 1] = Math.random() * 8;
        posArray[i3 + 2] = (Math.random() - 0.5) * 100;
      }
    }

    positions.needsUpdate = true;
  }
}
```

**Step 2: Verify in browser**

Sand particles should be more visible — a mix of fine grains and occasional larger dust clumps, with soft circular shapes rather than squares.

**Step 3: Commit**

```bash
git add src/effects/SandParticles.ts
git commit -m "feat: enhance sand particles with varied sizes, soft circles, and dust clumps"
```

---

### Task 5: Convert PyramidBuilder to InstancedMesh

Replace per-block Mesh creation with a single InstancedMesh for all blocks, dramatically reducing draw calls.

**Files:**
- Modify: `src/pyramid/PyramidBuilder.ts` — use `THREE.InstancedMesh` with per-instance color

**Step 1: Refactor to InstancedMesh**

Key changes:
- One shared `BoxGeometry` + `MeshLambertMaterial`
- One `InstancedMesh` allocated to `totalSlots` capacity
- `placeBlockInstant()` and `startBlockAnimation()` set instance transforms via `setMatrixAt()` / `setColorAt()`
- Animating blocks still tracked, but update instance matrices in-place
- Edge wireframes are removed (they don't work with InstancedMesh and aren't visible at distance anyway)

Replace `PyramidBuilder.ts`:

```typescript
import * as THREE from 'three';

const BLOCK_SIZE = 1.0;
const BLOCK_GAP = 0.05;
const BLOCK_UNIT = BLOCK_SIZE + BLOCK_GAP;
const BASE_SIZE = 20;
const LAYER_STEP = 2;

interface BlockSlot {
  layer: number;
  row: number;
  col: number;
  position: THREE.Vector3;
  placed: boolean;
  isEdge: boolean;
}

interface AnimatingBlock {
  index: number;
  target: THREE.Vector3;
  startY: number;
  progress: number;
  speed: number;
  color: THREE.Color;
}

const _tempMatrix = new THREE.Matrix4();
const _tempColor = new THREE.Color();

export class PyramidBuilder {
  private instancedMesh: THREE.InstancedMesh;
  private slots: BlockSlot[] = [];
  private placedCount = 0;
  private visibleCount = 0;
  private animatingBlocks: AnimatingBlock[] = [];
  private pendingPlacements: number[] = [];

  constructor(scene: THREE.Scene) {
    this.generateSlots();

    const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const mat = new THREE.MeshLambertMaterial();
    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.slots.length);
    this.instancedMesh.count = 0;
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    scene.add(this.instancedMesh);
  }

  private generateSlots(): void {
    const layers: BlockSlot[][] = [];
    let layerIndex = 0;
    for (let size = BASE_SIZE; size >= 2; size -= LAYER_STEP) {
      const yOffset = layerIndex * BLOCK_UNIT;
      const halfExtent = (size * BLOCK_UNIT) / 2;
      const layer: BlockSlot[] = [];

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const x = -halfExtent + col * BLOCK_UNIT + BLOCK_UNIT / 2;
          const z = -halfExtent + row * BLOCK_UNIT + BLOCK_UNIT / 2;
          const y = yOffset + BLOCK_SIZE / 2;
          const isEdge = row === 0 || row === size - 1 || col === 0 || col === size - 1;

          layer.push({
            layer: layerIndex,
            row,
            col,
            position: new THREE.Vector3(x, y, z),
            placed: false,
            isEdge,
          });
        }
      }
      layers.push(layer);
      layerIndex++;
    }

    // Sort each layer: edges first, then interior, both shuffled
    for (const layer of layers) {
      const edges = layer.filter(s => s.isEdge).sort(() => Math.random() - 0.5);
      const interior = layer.filter(s => !s.isEdge).sort(() => Math.random() - 0.5);
      layer.length = 0;
      layer.push(...edges, ...interior);
    }

    // Round-robin across layers, weighted toward lower layers
    const cursors = layers.map(() => 0);
    const totalBlocks = layers.reduce((sum, l) => sum + l.length, 0);

    while (this.slots.length < totalBlocks) {
      for (let li = 0; li < layers.length; li++) {
        if (cursors[li] >= layers[li].length) continue;
        const blocksPerRound = Math.max(1, Math.ceil(layers[li].length / layers[0].length * 8));
        for (let b = 0; b < blocksPerRound && cursors[li] < layers[li].length; b++) {
          this.slots.push(layers[li][cursors[li]]);
          cursors[li]++;
        }
      }
    }
  }

  get totalSlots(): number {
    return this.slots.length;
  }

  get currentPlacedCount(): number {
    return this.placedCount;
  }

  restoreBlocks(count: number): void {
    const toPlace = Math.min(count, this.slots.length);
    for (let i = this.placedCount; i < toPlace; i++) {
      this.placeBlockInstant(i);
    }
  }

  private placeBlockInstant(index: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;
    slot.placed = true;

    const instanceIdx = this.visibleCount;
    _tempMatrix.makeTranslation(slot.position.x, slot.position.y, slot.position.z);
    this.instancedMesh.setMatrixAt(instanceIdx, _tempMatrix);
    this.instancedMesh.setColorAt(instanceIdx, this.randomBlockColor());

    this.visibleCount++;
    this.placedCount++;
    this.instancedMesh.count = this.visibleCount;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;
  }

  private randomBlockColor(): THREE.Color {
    const hue = 0.08 + Math.random() * 0.04;
    const sat = 0.3 + Math.random() * 0.2;
    const light = 0.6 + Math.random() * 0.15;
    return _tempColor.setHSL(hue, sat, light);
  }

  queueBlocks(targetTotal: number): void {
    while (this.placedCount + this.pendingPlacements.length < targetTotal
           && this.placedCount + this.pendingPlacements.length < this.slots.length) {
      const nextIndex = this.placedCount + this.pendingPlacements.length;
      this.pendingPlacements.push(nextIndex);
    }
  }

  update(delta: number): void {
    if (this.pendingPlacements.length > 0 && this.animatingBlocks.length < 5) {
      const index = this.pendingPlacements.shift()!;
      this.startBlockAnimation(index);
    }

    for (let i = this.animatingBlocks.length - 1; i >= 0; i--) {
      const anim = this.animatingBlocks[i];
      anim.progress += delta * anim.speed;

      const instanceIdx = anim.index;

      if (anim.progress >= 1) {
        _tempMatrix.makeTranslation(anim.target.x, anim.target.y, anim.target.z);
        this.instancedMesh.setMatrixAt(instanceIdx, _tempMatrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.animatingBlocks.splice(i, 1);
        continue;
      }

      const t = anim.progress;
      const eased = 1 - Math.pow(1 - t, 3);
      const bounceY = t > 0.8 ? Math.sin((t - 0.8) * 25) * 0.1 * (1 - t) : 0;
      const y = anim.startY + (anim.target.y - anim.startY) * eased + bounceY;

      _tempMatrix.makeTranslation(anim.target.x, y, anim.target.z);
      this.instancedMesh.setMatrixAt(instanceIdx, _tempMatrix);
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private startBlockAnimation(index: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;
    slot.placed = true;

    const instanceIdx = this.visibleCount;
    const startY = slot.position.y + 15;
    const color = this.randomBlockColor();

    _tempMatrix.makeTranslation(slot.position.x, startY, slot.position.z);
    this.instancedMesh.setMatrixAt(instanceIdx, _tempMatrix);
    this.instancedMesh.setColorAt(instanceIdx, color);

    this.visibleCount++;
    this.placedCount++;
    this.instancedMesh.count = this.visibleCount;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;

    this.animatingBlocks.push({
      index: instanceIdx,
      target: slot.position.clone(),
      startY,
      progress: 0,
      speed: 1.5,
      color,
    });
  }

  getNextBlockPosition(): THREE.Vector3 | null {
    const nextIndex = this.placedCount;
    if (nextIndex >= this.slots.length) return null;
    return this.slots[nextIndex].position.clone();
  }
}
```

**Step 2: Verify in browser**

Pyramid should look the same visually (minus wireframe edges) but render far more efficiently. Blocks still animate falling from above.

**Step 3: Commit**

```bash
git add src/pyramid/PyramidBuilder.ts
git commit -m "feat: convert pyramid blocks to InstancedMesh for single-draw-call rendering"
```

---

### Task 6: Filter idle/TaskUpdate noise from EventRouter

TaskUpdate and TaskCreate events map to 'idle' and create noisy +1 XP entries. Filter them out of the sidebar visual activity log.

**Files:**
- Modify: `src/events/EventRouter.ts:46` — skip sidebar addTask for idle activities

**Step 1: Skip sidebar entry for idle-mapped tools**

In `handleToolActivity()`, only call `sidebar.addTask` when the activity is meaningful:

```typescript
// In handleToolActivity, after the activity assignment:
const activity: WorkerActivity = TOOL_ACTIVITY_MAP[tool] || 'idle';

// Only drive character movement for non-idle activities
if (activity !== 'idle') {
  chars.controller.setActivity(activity);
  this.sidebar.addTask(sessionId, tool, activity, xpEarned, metadata);
}

// Always update blocks + HUD (XP still counts)
this.pyramid.queueBlocks(blocksPlaced);
this.hud.updateXP(totalXp, blocksPlaced, this.pyramid.totalSlots);

const label = metadata.file || metadata.command || tool;
if (activity !== 'idle') {
  this.hud.showActivityText(label, xpEarned);
}
```

**Step 2: Verify in browser**

"idle" / "TaskUpdate" entries should no longer appear in the sidebar. XP should still count.

**Step 3: Commit**

```bash
git add src/events/EventRouter.ts
git commit -m "fix: filter idle/TaskUpdate noise from sidebar and floating text"
```

---

### Task 7: Add procedural audio feedback

Add a soft sandstone "thunk" when blocks land using the Web Audio API.

**Files:**
- Create: `src/audio/BlockAudio.ts`
- Modify: `src/pyramid/PyramidBuilder.ts` — call audio on block landing
- Modify: `src/main.ts` — initialize audio and pass to pyramid

**Step 1: Create BlockAudio.ts**

```typescript
// src/audio/BlockAudio.ts
export class BlockAudio {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  playBlockLand(): void {
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Short noise burst filtered to sound like stone impact
      const duration = 0.12;
      const now = ctx.currentTime;

      // Noise buffer
      const bufferSize = Math.ceil(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Low-pass filter for stony thud
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + duration);

      // Volume envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(now);
      source.stop(now + duration);
    } catch {
      // Audio not available — silently ignore
    }
  }
}
```

**Step 2: Wire audio into PyramidBuilder**

Add an optional `onBlockLand` callback to PyramidBuilder. When an animating block completes (`progress >= 1`), call the callback.

In `PyramidBuilder.ts`, add a callback field and invoke it:

```typescript
// Add field after other private fields:
private onBlockLandCallback: (() => void) | null = null;

// Add public method:
onBlockLand(callback: () => void): void {
  this.onBlockLandCallback = callback;
}

// In the update() loop, when anim.progress >= 1 (the block lands), after the splice:
if (this.onBlockLandCallback) this.onBlockLandCallback();
```

**Step 3: Wire in main.ts**

```typescript
// After pyramid creation in main.ts:
import { BlockAudio } from './audio/BlockAudio.js';

const audio = new BlockAudio();
pyramid.onBlockLand(() => audio.playBlockLand());
```

**Step 4: Verify in browser**

When blocks fall and land, a soft "thunk" sound should play. First click on the page may be needed to unlock AudioContext.

**Step 5: Commit**

```bash
git add src/audio/BlockAudio.ts src/pyramid/PyramidBuilder.ts src/main.ts
git commit -m "feat: add procedural sandstone thunk sound on block landing"
```

---

### Task 8: Add favicon

**Files:**
- Modify: `index.html` — add inline SVG favicon

**Step 1: Add favicon to index.html**

Add this in the `<head>` section:

```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#x1F3DB;</text></svg>">
```

**Step 2: Verify — refresh browser, confirm favicon shows in tab**

**Step 3: Commit**

```bash
git add index.html
git commit -m "fix: add pyramid emoji favicon to eliminate 404"
```

---

### Task 9: Spread character positions along construction ramp

Multiple sessions stack characters in the same quarry area. Spread them along a path from quarry to pyramid.

**Files:**
- Modify: `src/characters/SessionController.ts` — update `getActivityTarget()` offsets to spread along a ramp

**Step 1: Update character positioning**

Replace the `getActivityTarget()` function to use a wider spread that distributes sessions along a curved path from quarry to pyramid:

```typescript
function getActivityTarget(activity: WorkerActivity, sessionIndex: number): THREE.Vector3 {
  // Spread sessions along a curved path from quarry toward pyramid
  // Each session gets a unique "lane" offset perpendicular to the quarry-pyramid axis
  const laneOffset = (sessionIndex - 0.5) * 5; // 5 units apart per session

  switch (activity) {
    case 'carry':
      return new THREE.Vector3(-8, 0, laneOffset);
    case 'chisel':
      return new THREE.Vector3(-6, 0, -3 + laneOffset);
    case 'survey':
      return new THREE.Vector3(-14, 0, 4 + laneOffset);
    case 'antenna':
      return new THREE.Vector3(-5, 0, 12 + laneOffset);
    case 'portal':
      return new THREE.Vector3(-18, 0, laneOffset);
    case 'idle':
    default:
      return new THREE.Vector3(
        QUARRY_CENTER.x + sessionIndex * 3,
        0,
        QUARRY_CENTER.y + laneOffset
      );
  }
}
```

**Step 2: Verify in browser**

Multiple sessions should have characters in clearly separated lanes, no longer overlapping.

**Step 3: Commit**

```bash
git add src/characters/SessionController.ts
git commit -m "feat: spread character sessions into distinct lanes along construction path"
```

---

### Task 10: Day/night sky cycle

Slowly animate the sky shader uniforms to create a subtle day/night transition.

**Files:**
- Modify: `src/scene/SceneManager.ts` — store sky material ref, add `update()` logic to cycle uniforms
- Modify: `src/scene/SceneManager.ts` — also animate sun position and light intensity/color

**Step 1: Add sky cycle to SceneManager**

Store references to the sky material, sun mesh, sun light, and ambient light. In `update(delta)`, advance a time counter and interpolate between day and dusk palettes.

Add fields:

```typescript
private skyMaterial: THREE.ShaderMaterial | null = null;
private sun: THREE.Mesh | null = null;
private sunLight: THREE.DirectionalLight | null = null;
private ambientLight: THREE.AmbientLight | null = null;
private dayTime = 0; // 0 to 1, cycling
```

In `createSky()`, store `skyMat` and `sun`:

```typescript
this.skyMaterial = skyMat;
this.sun = sun;
```

In `createLighting()`, store lights:

```typescript
this.sunLight = sunLight;
this.ambientLight = ambient;
```

In `update(delta)`:

```typescript
update(delta: number): void {
  this.controls.update();

  // Slow day/night cycle — full cycle every 5 minutes
  this.dayTime = (this.dayTime + delta / 300) % 1;

  if (this.skyMaterial) {
    // Interpolate sky colors based on time
    // 0.0-0.3: warm day, 0.3-0.5: dusk, 0.5-0.8: night, 0.8-1.0: dawn
    const t = this.dayTime;
    const topDay = new THREE.Color(0x1a237e);
    const topNight = new THREE.Color(0x0a0a2e);
    const midDay = new THREE.Color(0xf5a623);
    const midNight = new THREE.Color(0x2a1a4a);
    const botDay = new THREE.Color(0xe8824a);
    const botNight = new THREE.Color(0x1a0a2e);

    // Smooth blend using sine for smooth transitions
    const nightAmount = Math.max(0, Math.sin(t * Math.PI * 2 - Math.PI / 2)) * 0.5;

    this.skyMaterial.uniforms.topColor.value.lerpColors(topDay, topNight, nightAmount);
    this.skyMaterial.uniforms.midColor.value.lerpColors(midDay, midNight, nightAmount);
    this.skyMaterial.uniforms.bottomColor.value.lerpColors(botDay, botNight, nightAmount);
  }

  // Animate sun height
  if (this.sun) {
    const sunAngle = this.dayTime * Math.PI * 2;
    this.sun.position.y = 20 + Math.sin(sunAngle) * 30;
    this.sun.visible = this.sun.position.y > -5;
  }

  // Adjust light intensity
  if (this.sunLight) {
    const dayFactor = 0.5 + 0.5 * Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2);
    const intensity = 0.4 + dayFactor * 1.1;
    this.sunLight.intensity = intensity;
  }
  if (this.ambientLight) {
    const dayFactor = 0.5 + 0.5 * Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2);
    this.ambientLight.intensity = 0.15 + dayFactor * 0.25;
  }
}
```

**Step 2: Verify in browser**

Over 5 minutes the scene should slowly shift between warm daytime and a darker purple/blue night. The sun should dip and rise.

**Step 3: Commit**

```bash
git add src/scene/SceneManager.ts
git commit -m "feat: add slow day/night sky cycle with animated sun and lighting"
```

---

### Task 11: Camera auto-nudge on activity

When a new tool event arrives, gently nudge the orbit target toward the active worker, then ease back.

**Files:**
- Modify: `src/scene/SceneManager.ts` — add `nudgeTarget(position)` method
- Modify: `src/events/EventRouter.ts` — call nudge when handling tool activity
- Modify: `src/main.ts` — pass sceneManager to EventRouter

**Step 1: Add nudge method to SceneManager**

```typescript
// Add fields:
private nudgeTarget: THREE.Vector3 | null = null;
private nudgeProgress = 0;
private baseTarget = new THREE.Vector3(0, 5, 0);

// Add method:
nudgeTo(worldPos: THREE.Vector3): void {
  // Blend 20% toward the target, don't fully snap
  this.nudgeTarget = new THREE.Vector3().lerpVectors(this.baseTarget, worldPos, 0.2);
  this.nudgeTarget.y = Math.max(3, this.nudgeTarget.y); // Keep above ground
  this.nudgeProgress = 0;
}

// In update(), add after controls.update():
if (this.nudgeTarget) {
  this.nudgeProgress += delta * 0.5;
  if (this.nudgeProgress < 1) {
    const t = 1 - Math.pow(1 - this.nudgeProgress, 2);
    this.controls.target.lerpVectors(this.controls.target, this.nudgeTarget, t * 0.03);
  } else {
    // Ease back to base
    this.controls.target.lerp(this.baseTarget, delta * 0.5);
    if (this.controls.target.distanceTo(this.baseTarget) < 0.1) {
      this.nudgeTarget = null;
    }
  }
}
```

**Step 2: Wire into EventRouter**

Update EventRouter constructor to accept SceneManager. In `handleToolActivity`, after setting the activity:

```typescript
const workerPos = chars.worker.mesh.position;
this.sceneManager.nudgeTo(workerPos);
```

**Step 3: Update main.ts**

Pass `sceneManager` to EventRouter:

```typescript
const router = new EventRouter(characters, pyramid, hud, sidebar, sceneManager);
```

**Step 4: Verify — camera should gently drift toward active worker then ease back to center**

**Step 5: Commit**

```bash
git add src/scene/SceneManager.ts src/events/EventRouter.ts src/main.ts
git commit -m "feat: add subtle camera nudge toward active worker on tool events"
```

---

## Summary

| Task | Files Modified | Improvement |
|------|---------------|-------------|
| 1 | HUD.ts, main.ts | Screen-space HTML HUD with progress bar |
| 2 | PyramidBuilder.ts | Multi-layer interleaved fill |
| 3 | SceneManager.ts | 3-stop sky gradient |
| 4 | SandParticles.ts | 1500 particles, varied sizes, soft circles |
| 5 | PyramidBuilder.ts | InstancedMesh (single draw call) |
| 6 | EventRouter.ts | Filter idle noise from sidebar |
| 7 | BlockAudio.ts (new), PyramidBuilder.ts, main.ts | Procedural block landing sound |
| 8 | index.html | Favicon |
| 9 | SessionController.ts | Character lane spacing |
| 10 | SceneManager.ts | Day/night cycle |
| 11 | SceneManager.ts, EventRouter.ts, main.ts | Camera nudge on activity |

Note: Tasks 2 and 5 both modify PyramidBuilder.ts. Task 5 includes the interleaved fill from Task 2, so they are combined in the final Task 5 code.
