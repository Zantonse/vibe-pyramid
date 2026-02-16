# Pyramid Visualization App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time 3D visualization of Claude Code activity as an ancient Egyptian pyramid construction site, where pharaohs with whips drive worker agents to stack blocks into a growing stepped pyramid.

**Architecture:** Vite+TypeScript frontend with Three.js rendering a fullscreen 3D scene. Node.js backend receives Claude Code hook events via HTTP, persists state to a JSON file, and broadcasts to the browser over WebSocket. Characters built from Three.js primitives behind an interface that allows future GLB model swaps.

**Tech Stack:** Vite, TypeScript, Three.js, Node.js, ws (WebSocket library), express (HTTP server), Claude Code hooks (shell scripts)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts` (empty entry point)
- Create: `server/index.ts` (empty entry point)

**Step 1: Initialize the npm project**

```bash
cd /Users/craigverzosa/Documents/Personal/Vibes/Claude/Pyramid
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install three ws express
npm install -D typescript vite @types/three @types/ws @types/express @types/node tsx
```

**Step 3: Create `tsconfig.json` (browser)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "server"]
}
```

**Step 4: Create `tsconfig.server.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist-server",
    "rootDir": "."
  },
  "include": ["server/**/*", "shared/**/*"],
  "exclude": ["node_modules"]
}
```

**Step 5: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 4201,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
```

**Step 6: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pyramid — Claude Code Visualization</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 7: Create placeholder entry points**

`src/main.ts`:
```typescript
console.log('Pyramid visualization starting...');
```

`server/index.ts`:
```typescript
console.log('Pyramid server starting...');
```

**Step 8: Add npm scripts to `package.json`**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx watch server/index.ts",
    "build": "vite build",
    "start": "tsx server/index.ts"
  }
}
```

**Step 9: Verify the Vite dev server starts**

```bash
npm run dev
```

Expected: Browser opens to `http://localhost:4201` showing a black page. Console shows "Pyramid visualization starting...".

**Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.server.json vite.config.ts index.html src/main.ts server/index.ts
git commit -m "feat: scaffold Vite + TypeScript + Three.js project"
```

---

## Task 2: Shared Types

**Files:**
- Create: `shared/types.ts`

These types are used by both the server and the browser client to ensure the WebSocket message contract is consistent.

**Step 1: Create shared type definitions**

`shared/types.ts`:
```typescript
// XP values for each tool type
export const XP_TABLE: Record<string, number> = {
  Read: 1,
  Glob: 1,
  Grep: 1,
  Bash: 2,
  WebFetch: 2,
  WebSearch: 2,
  Edit: 3,
  Task: 4,
  Write: 5,
};

export const XP_PER_BLOCK = 5;

// Inbound: Claude Code hook events POSTed to the server
export interface HookEvent {
  hook_event_name: string;
  session_id: string;
  cwd?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_use_id?: string;
}

// Outbound: WebSocket messages from server to browser
export type WSMessage =
  | ToolActivityMessage
  | SessionUpdateMessage
  | StateSnapshotMessage;

export interface ToolActivityMessage {
  type: 'tool_activity';
  session_id: string;
  tool: string;
  xp_earned: number;
  total_xp: number;
  blocks_placed: number;
  metadata: { file?: string; command?: string };
}

export interface SessionUpdateMessage {
  type: 'session_update';
  session_id: string;
  status: 'active' | 'idle' | 'ended';
  name: string;
}

export interface StateSnapshotMessage {
  type: 'state_snapshot';
  state: PyramidState;
}

// Persisted state
export interface PyramidState {
  total_xp: number;
  blocks_placed: number;
  pyramid_layer: number;
  sessions: Record<string, SessionState>;
}

export interface SessionState {
  name: string;
  xp_contributed: number;
  last_active: string;
  status: 'active' | 'idle' | 'ended';
}

// Tool-to-activity mapping for the 3D scene
export type WorkerActivity = 'survey' | 'carry' | 'chisel' | 'antenna' | 'portal' | 'idle';

export const TOOL_ACTIVITY_MAP: Record<string, WorkerActivity> = {
  Read: 'survey',
  Glob: 'survey',
  Grep: 'survey',
  Edit: 'carry',
  Write: 'carry',
  Bash: 'chisel',
  WebFetch: 'antenna',
  WebSearch: 'antenna',
  Task: 'portal',
};
```

**Step 2: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add shared types for hook events, WS messages, and XP system"
```

---

## Task 3: Node.js Server — HTTP + WebSocket + Persistence

**Files:**
- Create: `server/index.ts`
- Create: `server/state.ts`

**Step 1: Create the state manager**

`server/state.ts` handles loading/saving `~/.pyramid/state.json` with debounced writes.

```typescript
import fs from 'fs';
import path from 'path';
import { PyramidState, XP_TABLE, XP_PER_BLOCK } from '../shared/types.js';

const PYRAMID_DIR = path.join(process.env.HOME || '~', '.pyramid');
const STATE_FILE = path.join(PYRAMID_DIR, 'state.json');

const DEFAULT_STATE: PyramidState = {
  total_xp: 0,
  blocks_placed: 0,
  pyramid_layer: 0,
  sessions: {},
};

let state: PyramidState = DEFAULT_STATE;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function loadState(): PyramidState {
  try {
    if (!fs.existsSync(PYRAMID_DIR)) {
      fs.mkdirSync(PYRAMID_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      state = JSON.parse(raw);
    }
  } catch {
    console.warn('Failed to load state, using defaults');
    state = { ...DEFAULT_STATE };
  }
  return state;
}

function saveState(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch {
      console.warn('Failed to save state');
    }
    saveTimer = null;
  }, 500);
}

export function getState(): PyramidState {
  return state;
}

/** Calculate which pyramid layer a given block count reaches */
function calculateLayer(blocksPlaced: number): number {
  let remaining = blocksPlaced;
  let layer = 0;
  // Base is 20x20=400, then 18x18=324, 16x16=256, ...
  for (let size = 20; size >= 2; size -= 2) {
    const layerBlocks = size * size;
    if (remaining >= layerBlocks) {
      remaining -= layerBlocks;
      layer++;
    } else {
      break;
    }
  }
  return layer;
}

export function processToolEvent(
  sessionId: string,
  toolName: string,
  metadata: { file?: string; command?: string }
): { xp_earned: number; total_xp: number; blocks_placed: number } {
  const xp = XP_TABLE[toolName] ?? 1;

  state.total_xp += xp;
  state.blocks_placed = Math.floor(state.total_xp / XP_PER_BLOCK);
  state.pyramid_layer = calculateLayer(state.blocks_placed);

  if (!state.sessions[sessionId]) {
    state.sessions[sessionId] = {
      name: sessionId.slice(0, 8),
      xp_contributed: 0,
      last_active: new Date().toISOString(),
      status: 'active',
    };
  }
  state.sessions[sessionId].xp_contributed += xp;
  state.sessions[sessionId].last_active = new Date().toISOString();
  state.sessions[sessionId].status = 'active';

  saveState();

  return {
    xp_earned: xp,
    total_xp: state.total_xp,
    blocks_placed: state.blocks_placed,
  };
}

export function updateSessionStatus(sessionId: string, status: 'active' | 'idle' | 'ended'): void {
  if (state.sessions[sessionId]) {
    state.sessions[sessionId].status = status;
    state.sessions[sessionId].last_active = new Date().toISOString();
    saveState();
  }
}
```

**Step 2: Create the server**

`server/index.ts`:
```typescript
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { loadState, getState, processToolEvent, updateSessionStatus } from './state.js';
import type { HookEvent, WSMessage, ToolActivityMessage, SessionUpdateMessage, StateSnapshotMessage } from '../shared/types.js';

const PORT = parseInt(process.env.PYRAMID_PORT || '4200', 10);

const app = express();
app.use(express.json());

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Track connected clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  // Send current state on connect
  const snapshot: StateSnapshotMessage = { type: 'state_snapshot', state: getState() };
  ws.send(JSON.stringify(snapshot));
  ws.on('close', () => clients.delete(ws));
});

function broadcast(msg: WSMessage): void {
  const data = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Receive hook events from Claude Code
app.post('/event', (req, res) => {
  const event = req.body as HookEvent;

  if (!event.hook_event_name || !event.session_id) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (event.hook_event_name === 'PostToolUse' && event.tool_name) {
    const file = typeof event.tool_input?.file_path === 'string' ? event.tool_input.file_path : undefined;
    const command = typeof event.tool_input?.command === 'string' ? event.tool_input.command : undefined;

    const result = processToolEvent(event.session_id, event.tool_name, { file, command });

    const msg: ToolActivityMessage = {
      type: 'tool_activity',
      session_id: event.session_id,
      tool: event.tool_name,
      xp_earned: result.xp_earned,
      total_xp: result.total_xp,
      blocks_placed: result.blocks_placed,
      metadata: { file, command },
    };
    broadcast(msg);
  }

  if (event.hook_event_name === 'SessionStart') {
    const msg: SessionUpdateMessage = {
      type: 'session_update',
      session_id: event.session_id,
      status: 'active',
      name: event.session_id.slice(0, 8),
    };
    broadcast(msg);
  }

  if (event.hook_event_name === 'SessionEnd') {
    updateSessionStatus(event.session_id, 'ended');
    const msg: SessionUpdateMessage = {
      type: 'session_update',
      session_id: event.session_id,
      status: 'ended',
      name: event.session_id.slice(0, 8),
    };
    broadcast(msg);
  }

  res.json({ ok: true });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', state: getState() });
});

// Start
loadState();
httpServer.listen(PORT, () => {
  console.log(`Pyramid server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});
```

**Step 3: Verify the server starts**

```bash
npx tsx server/index.ts
```

Expected: "Pyramid server running on http://localhost:4200" and "WebSocket available at ws://localhost:4200"

**Step 4: Test the HTTP endpoint with curl**

```bash
curl -X POST http://localhost:4200/event \
  -H "Content-Type: application/json" \
  -d '{"hook_event_name":"PostToolUse","session_id":"test123","tool_name":"Edit","tool_input":{"file_path":"src/app.ts"}}'
```

Expected: `{"ok":true}`. Verify `~/.pyramid/state.json` was created with `total_xp: 3`.

**Step 5: Test the health endpoint**

```bash
curl http://localhost:4200/health
```

Expected: JSON with `{"status":"ok","state":{"total_xp":3,...}}`

**Step 6: Commit**

```bash
git add server/index.ts server/state.ts
git commit -m "feat: add Node.js server with HTTP hooks, WebSocket broadcast, and file persistence"
```

---

## Task 4: Claude Code Hook Script + CLI Setup/Uninstall

**Files:**
- Create: `hooks/pyramid-hook.sh`
- Create: `bin/setup.ts`
- Create: `bin/uninstall.ts`
- Create: `bin/cli.ts`

**Step 1: Create the hook shell script**

`hooks/pyramid-hook.sh`:
```bash
#!/bin/bash
# Pyramid hook — receives Claude Code events and forwards to the Pyramid server.
# Reads JSON from stdin, POSTs to the local server.

set -euo pipefail

PYRAMID_PORT="${PYRAMID_PORT:-4200}"
PYRAMID_URL="http://localhost:${PYRAMID_PORT}/event"

# Read all stdin
INPUT=$(cat)

# Find curl
CURL=$(command -v curl 2>/dev/null || echo "")
if [ -z "$CURL" ]; then
  exit 0
fi

# Fire-and-forget POST to the server
$CURL -s -o /dev/null --max-time 2 \
  -X POST "$PYRAMID_URL" \
  -H "Content-Type: application/json" \
  -d "$INPUT" &>/dev/null || true

exit 0
```

**Step 2: Create the setup script**

`bin/setup.ts`:
```typescript
import fs from 'fs';
import path from 'path';

const CLAUDE_SETTINGS_DIR = path.join(process.env.HOME || '~', '.claude');
const SETTINGS_FILE = path.join(CLAUDE_SETTINGS_DIR, 'settings.json');
const PYRAMID_DIR = path.join(process.env.HOME || '~', '.pyramid');

// Resolve the absolute path to our hook script
const HOOK_SCRIPT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'hooks', 'pyramid-hook.sh');

const HOOK_EVENTS = [
  'PostToolUse',
  'SessionStart',
  'SessionEnd',
  'SubagentStart',
  'SubagentStop',
];

function setup(): void {
  // Ensure ~/.pyramid exists
  if (!fs.existsSync(PYRAMID_DIR)) {
    fs.mkdirSync(PYRAMID_DIR, { recursive: true });
  }

  // Make hook script executable
  fs.chmodSync(HOOK_SCRIPT, 0o755);

  // Read existing settings
  let settings: Record<string, unknown> = {};
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {
    settings = {};
  }

  // Build hooks config
  const hooks: Record<string, unknown[]> = (settings.hooks as Record<string, unknown[]>) || {};

  for (const event of HOOK_EVENTS) {
    const hookEntry = {
      matcher: event === 'SessionStart' || event === 'SessionEnd' ? undefined : '*',
      hooks: [
        {
          type: 'command',
          command: HOOK_SCRIPT,
          timeout: 5,
        },
      ],
    };

    if (!hooks[event]) {
      hooks[event] = [];
    }

    // Avoid duplicate entries
    const existing = hooks[event] as Array<{ hooks?: Array<{ command?: string }> }>;
    const alreadyInstalled = existing.some(
      (entry) => entry.hooks?.some((h) => h.command === HOOK_SCRIPT)
    );
    if (!alreadyInstalled) {
      hooks[event].push(hookEntry);
    }
  }

  settings.hooks = hooks;

  // Ensure settings directory exists
  if (!fs.existsSync(CLAUDE_SETTINGS_DIR)) {
    fs.mkdirSync(CLAUDE_SETTINGS_DIR, { recursive: true });
  }

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

  console.log('Pyramid hooks installed successfully.');
  console.log(`Hook script: ${HOOK_SCRIPT}`);
  console.log(`Settings updated: ${SETTINGS_FILE}`);
  console.log(`Data directory: ${PYRAMID_DIR}`);
}

setup();
```

**Step 3: Create the uninstall script**

`bin/uninstall.ts`:
```typescript
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.env.HOME || '~', '.claude', 'settings.json');
const HOOK_SCRIPT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'hooks', 'pyramid-hook.sh');

function uninstall(): void {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      console.log('No Claude settings file found. Nothing to uninstall.');
      return;
    }

    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    const hooks = settings.hooks as Record<string, unknown[]> | undefined;
    if (!hooks) {
      console.log('No hooks found in settings. Nothing to uninstall.');
      return;
    }

    // Remove pyramid hook entries from each event
    for (const event of Object.keys(hooks)) {
      hooks[event] = (hooks[event] as Array<{ hooks?: Array<{ command?: string }> }>).filter(
        (entry) => !entry.hooks?.some((h) => h.command === HOOK_SCRIPT)
      );
      if ((hooks[event] as unknown[]).length === 0) {
        delete hooks[event];
      }
    }

    if (Object.keys(hooks).length === 0) {
      delete settings.hooks;
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('Pyramid hooks removed successfully.');
    console.log('Note: ~/.pyramid/ data preserved. Delete manually if desired.');
  } catch {
    console.error('Failed to uninstall hooks.');
  }
}

uninstall();
```

**Step 4: Create the CLI entry point**

`bin/cli.ts`:
```typescript
const command = process.argv[2];

if (command === 'setup') {
  await import('./setup.js');
} else if (command === 'uninstall') {
  await import('./uninstall.js');
} else {
  // Default: start the server
  await import('../server/index.js');
}
```

**Step 5: Update `package.json` scripts**

Add/update these in `package.json`:
```json
{
  "bin": {
    "pyramid": "./bin/cli.ts"
  },
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx watch server/index.ts",
    "build": "vite build",
    "start": "tsx bin/cli.ts",
    "setup": "tsx bin/setup.ts",
    "uninstall": "tsx bin/uninstall.ts"
  }
}
```

**Step 6: Verify setup works**

```bash
npm run setup
cat ~/.claude/settings.json | head -40
```

Expected: Settings file shows pyramid hooks registered for PostToolUse, SessionStart, SessionEnd, SubagentStart, SubagentStop.

**Step 7: Verify uninstall works**

```bash
npm run uninstall
cat ~/.claude/settings.json | head -40
```

Expected: Pyramid hook entries removed. ~/.pyramid/ directory still exists.

**Step 8: Commit**

```bash
git add hooks/pyramid-hook.sh bin/setup.ts bin/uninstall.ts bin/cli.ts package.json
git commit -m "feat: add Claude Code hook script and CLI setup/uninstall commands"
```

---

## Task 5: Three.js Scene Foundation — Terrain, Sky, Lighting, Camera

**Files:**
- Create: `src/scene/SceneManager.ts`
- Modify: `src/main.ts`

**Step 1: Create SceneManager**

`src/scene/SceneManager.ts`:
```typescript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  constructor() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(30, 25, 30);
    this.camera.lookAt(0, 5, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 5, 0);
    this.controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below ground
    this.controls.update();

    // Build the scene
    this.createSky();
    this.createTerrain();
    this.createLighting();
    this.createQuarry();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  private createSky(): void {
    // Gradient sky using a large sphere with vertex colors
    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1a237e) },    // Deep blue
        bottomColor: { value: new THREE.Color(0xf57c00) }, // Warm amber
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
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float t = max(0.0, h);
          gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
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

  private createTerrain(): void {
    // Desert floor with subtle vertex displacement
    const geo = new THREE.PlaneGeometry(500, 500, 64, 64);
    geo.rotateX(-Math.PI / 2);

    // Subtle dune displacement
    const positions = geo.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = Math.sin(x * 0.02) * Math.cos(z * 0.03) * 0.5
              + Math.sin(x * 0.05 + z * 0.04) * 0.3;
      positions.setY(i, y);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({ color: 0xd4a574 }); // Sand color
    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  private createLighting(): void {
    // Sun directional light
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
    sunLight.position.set(-50, 40, -30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    this.scene.add(sunLight);

    // Ambient fill
    const ambient = new THREE.AmbientLight(0xffe0b2, 0.4);
    this.scene.add(ambient);
  }

  private createQuarry(): void {
    // Cluster of dark rocks off to the side
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const positions = [
      { x: -20, z: 10, s: 2.5 },
      { x: -22, z: 12, s: 1.8 },
      { x: -18, z: 11, s: 2.0 },
      { x: -21, z: 8, s: 1.5 },
      { x: -19, z: 13, s: 1.2 },
    ];
    for (const pos of positions) {
      const geo = new THREE.DodecahedronGeometry(pos.s, 0);
      const rock = new THREE.Mesh(geo, rockMat);
      rock.position.set(pos.x, pos.s * 0.6, pos.z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(delta: number): void {
    this.controls.update();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

**Step 2: Wire up `src/main.ts` with a render loop**

```typescript
import { SceneManager } from './scene/SceneManager.js';

const scene = new SceneManager();

let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  scene.update(delta);
  scene.render();
}

animate();
```

**Step 3: Verify the scene renders**

```bash
npm run dev
```

Expected: Browser shows a desert terrain with gradient sky, warm lighting, a sun, and a quarry cluster. Camera is orbitable with mouse.

**Step 4: Commit**

```bash
git add src/scene/SceneManager.ts src/main.ts
git commit -m "feat: add Three.js scene with desert terrain, gradient sky, lighting, and quarry"
```

---

## Task 6: Pyramid Builder — Block Grid + Placement Animation

**Files:**
- Create: `src/pyramid/PyramidBuilder.ts`
- Modify: `src/main.ts`

**Step 1: Create PyramidBuilder**

`src/pyramid/PyramidBuilder.ts`:
```typescript
import * as THREE from 'three';

const BLOCK_SIZE = 1.0;
const BLOCK_GAP = 0.05;
const BLOCK_UNIT = BLOCK_SIZE + BLOCK_GAP;
const BASE_SIZE = 20;
const LAYER_STEP = 2; // Shrink by 2 per side per layer

interface BlockSlot {
  layer: number;
  row: number;
  col: number;
  position: THREE.Vector3; // world position
  placed: boolean;
}

interface AnimatingBlock {
  mesh: THREE.Mesh;
  target: THREE.Vector3;
  startY: number;
  progress: number;
  speed: number;
}

export class PyramidBuilder {
  private group: THREE.Group;
  private slots: BlockSlot[] = [];
  private placedCount = 0;
  private animatingBlocks: AnimatingBlock[] = [];
  private pendingPlacements: number[] = []; // indices into slots

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.generateSlots();
  }

  /** Pre-calculate all block positions for the full pyramid */
  private generateSlots(): void {
    let layerIndex = 0;
    for (let size = BASE_SIZE; size >= 2; size -= LAYER_STEP) {
      const yOffset = layerIndex * BLOCK_UNIT;
      const halfExtent = (size * BLOCK_UNIT) / 2;

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const x = -halfExtent + col * BLOCK_UNIT + BLOCK_UNIT / 2;
          const z = -halfExtent + row * BLOCK_UNIT + BLOCK_UNIT / 2;
          const y = yOffset + BLOCK_SIZE / 2;

          this.slots.push({
            layer: layerIndex,
            row,
            col,
            position: new THREE.Vector3(x, y, z),
            placed: false,
          });
        }
      }
      layerIndex++;
    }
  }

  get totalSlots(): number {
    return this.slots.length;
  }

  get currentPlacedCount(): number {
    return this.placedCount;
  }

  /** Restore N blocks instantly (for loading persisted state) */
  restoreBlocks(count: number): void {
    const toPlace = Math.min(count, this.slots.length);
    for (let i = 0; i < toPlace; i++) {
      if (!this.slots[i].placed) {
        this.placeBlockInstant(i);
      }
    }
  }

  private placeBlockInstant(index: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;

    const mesh = this.createBlockMesh();
    mesh.position.copy(slot.position);
    this.group.add(mesh);
    slot.placed = true;
    this.placedCount++;
  }

  /** Queue the next N blocks for animated placement */
  queueBlocks(targetTotal: number): void {
    while (this.placedCount + this.pendingPlacements.length < targetTotal
           && this.placedCount + this.pendingPlacements.length < this.slots.length) {
      const nextIndex = this.placedCount + this.pendingPlacements.length;
      this.pendingPlacements.push(nextIndex);
    }
  }

  /** Call each frame to start pending placements and advance animations */
  update(delta: number): void {
    // Start next pending placement if animation queue isn't too full
    if (this.pendingPlacements.length > 0 && this.animatingBlocks.length < 5) {
      const index = this.pendingPlacements.shift()!;
      this.startBlockAnimation(index);
    }

    // Update animating blocks
    for (let i = this.animatingBlocks.length - 1; i >= 0; i--) {
      const anim = this.animatingBlocks[i];
      anim.progress += delta * anim.speed;

      if (anim.progress >= 1) {
        // Snap to final position
        anim.mesh.position.copy(anim.target);
        anim.mesh.material = this.createBlockMaterial(); // Remove transparency
        this.animatingBlocks.splice(i, 1);
        continue;
      }

      // Ease-out bounce
      const t = anim.progress;
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const bounceY = t > 0.8 ? Math.sin((t - 0.8) * 25) * 0.1 * (1 - t) : 0;

      const y = anim.startY + (anim.target.y - anim.startY) * eased + bounceY;
      anim.mesh.position.set(anim.target.x, y, anim.target.z);
    }
  }

  private startBlockAnimation(index: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;

    const mesh = this.createBlockMesh(0.7); // Semi-transparent while animating
    const startY = slot.position.y + 15;
    mesh.position.set(slot.position.x, startY, slot.position.z);
    this.group.add(mesh);

    slot.placed = true;
    this.placedCount++;

    this.animatingBlocks.push({
      mesh,
      target: slot.position.clone(),
      startY,
      progress: 0,
      speed: 1.5, // Complete in ~0.67s
    });
  }

  private createBlockMesh(opacity = 1): THREE.Mesh {
    const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const mat = this.createBlockMaterial(opacity);
    const mesh = new THREE.Mesh(geo, mat);

    // Edge outline
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8d6e3d, linewidth: 1 }));
    mesh.add(line);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createBlockMaterial(opacity = 1): THREE.MeshLambertMaterial {
    // Subtle random warm hue variation
    const hue = 0.08 + Math.random() * 0.04;  // 0.08-0.12 (warm yellow-orange)
    const sat = 0.3 + Math.random() * 0.2;
    const light = 0.6 + Math.random() * 0.15;
    const color = new THREE.Color().setHSL(hue, sat, light);

    return new THREE.MeshLambertMaterial({
      color,
      transparent: opacity < 1,
      opacity,
    });
  }

  /** Get the world position of the next block to be placed (for worker targeting) */
  getNextBlockPosition(): THREE.Vector3 | null {
    const nextIndex = this.placedCount;
    if (nextIndex >= this.slots.length) return null;
    return this.slots[nextIndex].position.clone();
  }
}
```

**Step 2: Wire into `src/main.ts`**

Add to `src/main.ts` after SceneManager creation:
```typescript
import { PyramidBuilder } from './pyramid/PyramidBuilder.js';

// ... after scene creation
const pyramid = new PyramidBuilder(scene.scene);

// Restore some test blocks to see it work (remove later)
pyramid.restoreBlocks(50);
```

Update the animate loop to include:
```typescript
pyramid.update(delta);
```

**Step 3: Verify the pyramid renders**

```bash
npm run dev
```

Expected: 50 sandstone blocks forming the start of the base layer of a stepped pyramid, centered in the scene, with subtle color variation and edge outlines.

**Step 4: Test animated placement**

Temporarily add to main.ts to test animation:
```typescript
// Test: queue blocks every 2 seconds
let testBlocks = 50;
setInterval(() => {
  testBlocks += 5;
  pyramid.queueBlocks(testBlocks);
}, 2000);
```

Expected: Every 2 seconds, 5 new blocks drop from above and settle into place with a bounce.

**Step 5: Remove test code, commit**

Remove the test `setInterval` and `restoreBlocks(50)` call.

```bash
git add src/pyramid/PyramidBuilder.ts src/main.ts
git commit -m "feat: add PyramidBuilder with block grid calculation and drop animation"
```

---

## Task 7: Procedural Characters — Worker + Pharaoh

**Files:**
- Create: `src/characters/CharacterModel.ts`
- Create: `src/characters/ProceduralWorker.ts`
- Create: `src/characters/ProceduralPharaoh.ts`
- Create: `src/characters/CharacterFactory.ts`

**Step 1: Create the CharacterModel interface**

`src/characters/CharacterModel.ts`:
```typescript
import * as THREE from 'three';

export type AnimationName = 'idle' | 'walk' | 'whip' | 'carry' | 'chisel' | 'survey' | 'antenna' | 'portal';

export interface CharacterModel {
  mesh: THREE.Group;
  playAnimation(name: AnimationName): void;
  update(delta: number): void;
  setPosition(pos: THREE.Vector3): void;
  lookAt(target: THREE.Vector3): void;
  dispose(): void;
}
```

**Step 2: Create ProceduralWorker**

`src/characters/ProceduralWorker.ts`:
```typescript
import * as THREE from 'three';
import { CharacterModel, AnimationName } from './CharacterModel.js';

export class ProceduralWorker implements CharacterModel {
  mesh: THREE.Group;
  private currentAnimation: AnimationName = 'idle';
  private animTime = 0;

  // Body parts for animation
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private prop: THREE.Group; // Current held item

  constructor() {
    this.mesh = new THREE.Group();
    const skinColor = 0xb07850; // Brown/tan
    const clothColor = 0xf5f0e0; // White loincloth

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.7, 0.35);
    this.body = new THREE.Mesh(torsoGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.body.position.y = 1.2;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Head (shaved)
    const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
    this.head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.head.position.y = 1.8;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Loincloth
    const clothGeo = new THREE.BoxGeometry(0.65, 0.3, 0.4);
    const cloth = new THREE.Mesh(clothGeo, new THREE.MeshLambertMaterial({ color: clothColor }));
    cloth.position.y = 0.75;
    this.mesh.add(cloth);

    // Arms
    this.leftArm = this.createLimb(skinColor, 0.15, 0.5);
    this.leftArm.position.set(-0.4, 1.3, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = this.createLimb(skinColor, 0.15, 0.5);
    this.rightArm.position.set(0.4, 1.3, 0);
    this.mesh.add(this.rightArm);

    // Legs
    this.leftLeg = this.createLimb(skinColor, 0.15, 0.5);
    this.leftLeg.position.set(-0.15, 0.5, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = this.createLimb(skinColor, 0.15, 0.5);
    this.rightLeg.position.set(0.15, 0.5, 0);
    this.mesh.add(this.rightLeg);

    // Prop group (swappable)
    this.prop = new THREE.Group();
    this.mesh.add(this.prop);
  }

  private createLimb(color: number, radius: number, height: number): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius, radius * 0.8, height, 6);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
    mesh.position.y = -height / 2;
    mesh.castShadow = true;
    group.add(mesh);
    return group;
  }

  playAnimation(name: AnimationName): void {
    if (this.currentAnimation === name) return;
    this.currentAnimation = name;
    this.animTime = 0;
    this.updateProp(name);
  }

  private updateProp(activity: AnimationName): void {
    // Clear existing props
    while (this.prop.children.length > 0) {
      this.prop.remove(this.prop.children[0]);
    }

    if (activity === 'survey') {
      // Papyrus scroll
      const scrollGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
      const scroll = new THREE.Mesh(scrollGeo, new THREE.MeshLambertMaterial({ color: 0xf5deb3 }));
      scroll.rotation.z = Math.PI / 4;
      scroll.position.set(0.5, 1.4, 0.2);
      this.prop.add(scroll);
    } else if (activity === 'carry') {
      // Stone block on shoulders
      const blockGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
      const block = new THREE.Mesh(blockGeo, new THREE.MeshLambertMaterial({ color: 0xc4a56a }));
      block.position.set(0, 2.1, 0);
      block.castShadow = true;
      this.prop.add(block);
    } else if (activity === 'chisel') {
      // Hammer
      const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
      const handle = new THREE.Mesh(handleGeo, new THREE.MeshLambertMaterial({ color: 0x8b4513 }));
      handle.position.set(0.5, 1.2, 0.2);
      handle.rotation.z = -Math.PI / 3;
      this.prop.add(handle);

      const headGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
      const hammerHead = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0x808080 }));
      hammerHead.position.set(0.6, 1.35, 0.2);
      this.prop.add(hammerHead);
    } else if (activity === 'antenna') {
      // Staff with Eye of Horus
      const staffGeo = new THREE.CylinderGeometry(0.02, 0.025, 1.5, 6);
      const staff = new THREE.Mesh(staffGeo, new THREE.MeshLambertMaterial({ color: 0xdaa520 }));
      staff.position.set(0.4, 1.5, 0);
      this.prop.add(staff);

      // Eye symbol (simple torus at top)
      const eyeGeo = new THREE.TorusGeometry(0.08, 0.02, 6, 8);
      const eye = new THREE.Mesh(eyeGeo, new THREE.MeshLambertMaterial({ color: 0x1565c0 }));
      eye.position.set(0.4, 2.3, 0);
      this.prop.add(eye);
    }
  }

  update(delta: number): void {
    this.animTime += delta;
    const t = this.animTime;

    switch (this.currentAnimation) {
      case 'walk':
      case 'carry':
        // Walking animation — swing arms and legs
        this.leftArm.rotation.x = Math.sin(t * 4) * 0.5;
        this.rightArm.rotation.x = -Math.sin(t * 4) * 0.5;
        this.leftLeg.rotation.x = -Math.sin(t * 4) * 0.4;
        this.rightLeg.rotation.x = Math.sin(t * 4) * 0.4;
        // Slight bob
        this.mesh.position.y = Math.abs(Math.sin(t * 4)) * 0.05;
        break;
      case 'chisel':
        // Hammering motion — right arm swings
        this.rightArm.rotation.x = -0.5 + Math.sin(t * 6) * 0.8;
        this.leftArm.rotation.x = -0.3;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      case 'survey':
        // Looking around — subtle head rotation
        this.head.rotation.y = Math.sin(t * 1.5) * 0.3;
        this.leftArm.rotation.x = -0.5;
        this.rightArm.rotation.x = -0.8;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      case 'antenna':
        // Holding staff, looking up
        this.head.rotation.x = -0.3;
        this.rightArm.rotation.x = -1.2;
        this.leftArm.rotation.x = 0;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      default:
        // Idle — subtle breathing
        this.body.scale.y = 1 + Math.sin(t * 2) * 0.02;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.mesh.position.y = 0;
        break;
    }
  }

  setPosition(pos: THREE.Vector3): void {
    this.mesh.position.copy(pos);
  }

  lookAt(target: THREE.Vector3): void {
    // Only rotate on Y axis (keep upright)
    const dir = new THREE.Vector3().subVectors(target, this.mesh.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      this.mesh.lookAt(this.mesh.position.clone().add(dir));
    }
  }

  dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
```

**Step 3: Create ProceduralPharaoh**

`src/characters/ProceduralPharaoh.ts`:
```typescript
import * as THREE from 'three';
import { CharacterModel, AnimationName } from './CharacterModel.js';

export class ProceduralPharaoh implements CharacterModel {
  mesh: THREE.Group;
  private currentAnimation: AnimationName = 'idle';
  private animTime = 0;

  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private headdress: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private whipGroup: THREE.Group;
  private whipSegments: THREE.Mesh[] = [];

  constructor() {
    this.mesh = new THREE.Group();
    const skinColor = 0xc68642;
    const goldColor = 0xffd700;
    const clothColor = 0xfafafa;

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.4);
    this.body = new THREE.Mesh(torsoGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.body.position.y = 1.25;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Gold chest piece
    const chestGeo = new THREE.BoxGeometry(0.55, 0.25, 0.42);
    const chest = new THREE.Mesh(chestGeo, new THREE.MeshLambertMaterial({ color: goldColor }));
    chest.position.y = 1.45;
    this.mesh.add(chest);

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 8, 6);
    this.head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.head.position.y = 1.9;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Nemes headdress (golden trapezoid)
    const hdGeo = new THREE.ConeGeometry(0.35, 0.5, 4);
    this.headdress = new THREE.Mesh(hdGeo, new THREE.MeshLambertMaterial({ color: goldColor }));
    this.headdress.position.y = 2.15;
    this.headdress.rotation.y = Math.PI / 4;
    this.headdress.castShadow = true;
    this.mesh.add(this.headdress);

    // White kilt
    const kiltGeo = new THREE.ConeGeometry(0.4, 0.5, 6);
    const kilt = new THREE.Mesh(kiltGeo, new THREE.MeshLambertMaterial({ color: clothColor }));
    kilt.position.y = 0.65;
    kilt.rotation.x = Math.PI; // Inverted cone
    this.mesh.add(kilt);

    // Gold arm bands
    const bandGeo = new THREE.TorusGeometry(0.12, 0.03, 6, 8);
    const bandMat = new THREE.MeshLambertMaterial({ color: goldColor });

    // Arms
    this.leftArm = this.createLimb(skinColor, 0.13, 0.5);
    this.leftArm.position.set(-0.45, 1.35, 0);
    const lBand = new THREE.Mesh(bandGeo, bandMat);
    lBand.position.y = -0.1;
    lBand.rotation.x = Math.PI / 2;
    this.leftArm.add(lBand);
    this.mesh.add(this.leftArm);

    this.rightArm = this.createLimb(skinColor, 0.13, 0.5);
    this.rightArm.position.set(0.45, 1.35, 0);
    const rBand = new THREE.Mesh(bandGeo.clone(), bandMat);
    rBand.position.y = -0.1;
    rBand.rotation.x = Math.PI / 2;
    this.rightArm.add(rBand);
    this.mesh.add(this.rightArm);

    // Legs
    this.leftLeg = this.createLimb(skinColor, 0.14, 0.5);
    this.leftLeg.position.set(-0.18, 0.5, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = this.createLimb(skinColor, 0.14, 0.5);
    this.rightLeg.position.set(0.18, 0.5, 0);
    this.mesh.add(this.rightLeg);

    // Whip
    this.whipGroup = new THREE.Group();
    this.whipGroup.position.set(0.5, 1.3, 0);
    const whipMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    for (let i = 0; i < 10; i++) {
      const segGeo = new THREE.SphereGeometry(0.03 - i * 0.002, 4, 4);
      const seg = new THREE.Mesh(segGeo, whipMat);
      seg.position.set(i * 0.15, 0, 0);
      this.whipGroup.add(seg);
      this.whipSegments.push(seg);
    }
    this.mesh.add(this.whipGroup);
  }

  private createLimb(color: number, radius: number, height: number): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius, radius * 0.85, height, 6);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
    mesh.position.y = -height / 2;
    mesh.castShadow = true;
    group.add(mesh);
    return group;
  }

  playAnimation(name: AnimationName): void {
    if (this.currentAnimation === name) return;
    this.currentAnimation = name;
    this.animTime = 0;
  }

  update(delta: number): void {
    this.animTime += delta;
    const t = this.animTime;

    // Always animate whip with subtle idle sway
    for (let i = 0; i < this.whipSegments.length; i++) {
      const seg = this.whipSegments[i];
      const baseX = i * 0.15;

      if (this.currentAnimation === 'whip') {
        // Crack animation — wave propagates along whip
        const wave = Math.sin(t * 12 - i * 0.8) * (0.1 + i * 0.04);
        seg.position.set(baseX, wave, Math.sin(t * 8 - i * 0.5) * 0.05);
      } else {
        // Gentle sway
        const sway = Math.sin(t * 1.5 + i * 0.3) * 0.02 * i;
        seg.position.set(baseX, sway - i * 0.01, 0);
      }
    }

    switch (this.currentAnimation) {
      case 'whip':
        // Whip crack — right arm swings
        this.rightArm.rotation.x = -1.0 + Math.sin(t * 8) * 0.5;
        this.rightArm.rotation.z = -0.3;
        this.leftArm.rotation.x = -0.3;
        // Auto-return to idle after crack
        if (t > 1.0) {
          this.currentAnimation = 'idle';
          this.animTime = 0;
        }
        break;
      case 'walk':
        this.leftArm.rotation.x = Math.sin(t * 3) * 0.3;
        this.rightArm.rotation.x = -Math.sin(t * 3) * 0.3;
        this.leftLeg.rotation.x = -Math.sin(t * 3) * 0.3;
        this.rightLeg.rotation.x = Math.sin(t * 3) * 0.3;
        break;
      default:
        // Idle — crossed arms stance
        this.leftArm.rotation.x = -0.7;
        this.leftArm.rotation.z = 0.3;
        this.rightArm.rotation.x = -0.7;
        this.rightArm.rotation.z = -0.3;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        // Subtle breathing
        this.body.scale.y = 1 + Math.sin(t * 2) * 0.015;
        break;
    }
  }

  setPosition(pos: THREE.Vector3): void {
    this.mesh.position.copy(pos);
  }

  lookAt(target: THREE.Vector3): void {
    const dir = new THREE.Vector3().subVectors(target, this.mesh.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      this.mesh.lookAt(this.mesh.position.clone().add(dir));
    }
  }

  dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
```

**Step 4: Create CharacterFactory**

`src/characters/CharacterFactory.ts`:
```typescript
import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';
import { ProceduralWorker } from './ProceduralWorker.js';
import { ProceduralPharaoh } from './ProceduralPharaoh.js';

export interface SessionCharacters {
  pharaoh: CharacterModel;
  worker: CharacterModel;
}

export class CharacterFactory {
  private scene: THREE.Scene;
  private sessions: Map<string, SessionCharacters> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  getOrCreate(sessionId: string): SessionCharacters {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const worker = new ProceduralWorker();
    const pharaoh = new ProceduralPharaoh();

    // Position them near the quarry with offset per session
    const index = this.sessions.size;
    const baseX = -15;
    const baseZ = 5 + index * 4;

    worker.setPosition(new THREE.Vector3(baseX, 0, baseZ));
    pharaoh.setPosition(new THREE.Vector3(baseX - 2, 0, baseZ));
    pharaoh.lookAt(new THREE.Vector3(baseX, 0, baseZ)); // Face the worker

    this.scene.add(worker.mesh);
    this.scene.add(pharaoh.mesh);

    const chars = { pharaoh, worker };
    this.sessions.set(sessionId, chars);
    return chars;
  }

  remove(sessionId: string): void {
    const chars = this.sessions.get(sessionId);
    if (chars) {
      this.scene.remove(chars.worker.mesh);
      this.scene.remove(chars.pharaoh.mesh);
      chars.worker.dispose();
      chars.pharaoh.dispose();
      this.sessions.delete(sessionId);
    }
  }

  update(delta: number): void {
    for (const { pharaoh, worker } of this.sessions.values()) {
      pharaoh.update(delta);
      worker.update(delta);
    }
  }

  getAllSessions(): Map<string, SessionCharacters> {
    return this.sessions;
  }
}
```

**Step 5: Wire into main.ts for visual verification**

Add to `src/main.ts`:
```typescript
import { CharacterFactory } from './characters/CharacterFactory.js';

const characters = new CharacterFactory(scene.scene);

// Test: create a pair
const testChars = characters.getOrCreate('test-session');
testChars.worker.playAnimation('carry');
testChars.pharaoh.playAnimation('whip');
```

Update animate loop:
```typescript
characters.update(delta);
```

**Step 6: Verify characters render**

```bash
npm run dev
```

Expected: A pharaoh and worker appear near the quarry. Worker has a block on shoulders and walks in place. Pharaoh cracks whip animation plays. Both have cast shadows.

**Step 7: Remove test code, commit**

Remove test character creation from main.ts (keep the factory creation and update call).

```bash
git add src/characters/CharacterModel.ts src/characters/ProceduralWorker.ts src/characters/ProceduralPharaoh.ts src/characters/CharacterFactory.ts src/main.ts
git commit -m "feat: add procedural pharaoh and worker characters with animation system"
```

---

## Task 8: WebSocket Client + Event Router

**Files:**
- Create: `src/network/WSClient.ts`
- Create: `src/events/EventRouter.ts`
- Modify: `src/main.ts`

**Step 1: Create WebSocket client**

`src/network/WSClient.ts`:
```typescript
import type { WSMessage } from '../../shared/types.js';

type MessageHandler = (msg: WSMessage) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;

  constructor(url = 'ws://localhost:4200') {
    this.url = url;
    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('Connected to Pyramid server');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WSMessage;
          for (const handler of this.handlers) {
            handler(msg);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        console.log('Disconnected from Pyramid server, reconnecting...');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  onMessage(handler: MessageHandler): void {
    this.handlers.push(handler);
  }
}
```

**Step 2: Create EventRouter**

`src/events/EventRouter.ts`:
```typescript
import { CharacterFactory } from '../characters/CharacterFactory.js';
import { PyramidBuilder } from '../pyramid/PyramidBuilder.js';
import { HUD } from '../hud/HUD.js';
import { TOOL_ACTIVITY_MAP, type WorkerActivity } from '../../shared/types.js';
import type { WSMessage, PyramidState } from '../../shared/types.js';

export class EventRouter {
  private characters: CharacterFactory;
  private pyramid: PyramidBuilder;
  private hud: HUD;

  constructor(characters: CharacterFactory, pyramid: PyramidBuilder, hud: HUD) {
    this.characters = characters;
    this.pyramid = pyramid;
    this.hud = hud;
  }

  handle(msg: WSMessage): void {
    switch (msg.type) {
      case 'tool_activity':
        this.handleToolActivity(msg.session_id, msg.tool, msg.xp_earned, msg.total_xp, msg.blocks_placed, msg.metadata);
        break;
      case 'session_update':
        this.handleSessionUpdate(msg.session_id, msg.status, msg.name);
        break;
      case 'state_snapshot':
        this.handleStateSnapshot(msg.state);
        break;
    }
  }

  private handleToolActivity(
    sessionId: string,
    tool: string,
    xpEarned: number,
    totalXp: number,
    blocksPlaced: number,
    metadata: { file?: string; command?: string }
  ): void {
    // Get or create characters for this session
    const chars = this.characters.getOrCreate(sessionId);

    // Set worker activity based on tool
    const activity: WorkerActivity = TOOL_ACTIVITY_MAP[tool] || 'idle';
    chars.worker.playAnimation(activity === 'carry' ? 'carry' : activity === 'chisel' ? 'chisel' : activity === 'survey' ? 'survey' : activity === 'antenna' ? 'antenna' : activity === 'portal' ? 'portal' : 'idle');

    // Pharaoh cracks whip
    chars.pharaoh.playAnimation('whip');

    // Queue blocks on the pyramid
    this.pyramid.queueBlocks(blocksPlaced);

    // Update HUD
    this.hud.updateXP(totalXp, blocksPlaced, this.pyramid.totalSlots);
    const label = metadata.file || metadata.command || tool;
    this.hud.showActivityText(label, xpEarned);
  }

  private handleSessionUpdate(sessionId: string, status: string, name: string): void {
    if (status === 'ended') {
      // Could remove characters or mark them idle
      const chars = this.characters.getOrCreate(sessionId);
      chars.worker.playAnimation('idle');
      chars.pharaoh.playAnimation('idle');
    } else {
      this.characters.getOrCreate(sessionId);
    }
    this.hud.updateSessionLabel(sessionId, name, status);
  }

  private handleStateSnapshot(state: PyramidState): void {
    // Restore pyramid to persisted block count
    this.pyramid.restoreBlocks(state.blocks_placed);
    this.hud.updateXP(state.total_xp, state.blocks_placed, this.pyramid.totalSlots);

    // Create characters for active sessions
    for (const [sessionId, sessionState] of Object.entries(state.sessions)) {
      if (sessionState.status !== 'ended') {
        this.characters.getOrCreate(sessionId);
      }
    }
  }
}
```

**Step 3: Create a stub HUD** (will flesh out in next task)

`src/hud/HUD.ts`:
```typescript
import * as THREE from 'three';

export class HUD {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updateXP(totalXp: number, blocksPlaced: number, totalSlots: number): void {
    console.log(`XP: ${totalXp} | Blocks: ${blocksPlaced}/${totalSlots}`);
  }

  showActivityText(label: string, xpEarned: number): void {
    console.log(`+${xpEarned} XP: ${label}`);
  }

  updateSessionLabel(sessionId: string, name: string, status: string): void {
    console.log(`Session ${name}: ${status}`);
  }

  update(delta: number): void {
    // Will animate floating text etc.
  }
}
```

**Step 4: Wire everything together in main.ts**

Replace `src/main.ts` content:
```typescript
import { SceneManager } from './scene/SceneManager.js';
import { PyramidBuilder } from './pyramid/PyramidBuilder.js';
import { CharacterFactory } from './characters/CharacterFactory.js';
import { HUD } from './hud/HUD.js';
import { WSClient } from './network/WSClient.js';
import { EventRouter } from './events/EventRouter.js';

// Core systems
const sceneManager = new SceneManager();
const pyramid = new PyramidBuilder(sceneManager.scene);
const characters = new CharacterFactory(sceneManager.scene);
const hud = new HUD(sceneManager.scene);

// Networking
const ws = new WSClient();
const router = new EventRouter(characters, pyramid, hud);
ws.onMessage((msg) => router.handle(msg));

// Render loop
let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  pyramid.update(delta);
  characters.update(delta);
  hud.update(delta);
  sceneManager.update(delta);
  sceneManager.render();
}

animate();
```

**Step 5: End-to-end test**

1. Start the server: `npx tsx server/index.ts`
2. Start the frontend: `npm run dev`
3. Send a test event:
```bash
curl -X POST http://localhost:4200/event \
  -H "Content-Type: application/json" \
  -d '{"hook_event_name":"PostToolUse","session_id":"test-abc","tool_name":"Write","tool_input":{"file_path":"src/components/App.tsx"}}'
```

Expected: Browser console logs "+5 XP: src/components/App.tsx". A pharaoh/worker pair appears near the quarry. After enough events (5 XP per block), a block drops onto the pyramid.

**Step 6: Commit**

```bash
git add src/network/WSClient.ts src/events/EventRouter.ts src/hud/HUD.ts src/main.ts
git commit -m "feat: add WebSocket client, event router, and wiring for end-to-end data flow"
```

---

## Task 9: In-World HUD — XP Counter, Session Labels, Activity Text

**Files:**
- Modify: `src/hud/HUD.ts`

This replaces the stub HUD with actual 3D floating text and labels using Three.js `CSS2DRenderer` or canvas-based sprites.

**Step 1: Implement the full HUD**

Replace `src/hud/HUD.ts`:
```typescript
import * as THREE from 'three';

interface FloatingText {
  sprite: THREE.Sprite;
  lifetime: number;
  age: number;
  startY: number;
}

export class HUD {
  private scene: THREE.Scene;
  private xpSprite: THREE.Sprite | null = null;
  private floatingTexts: FloatingText[] = [];
  private sessionLabels: Map<string, THREE.Sprite> = new Map();
  private totalXp = 0;
  private blocksPlaced = 0;
  private totalSlots = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createXPCounter();
  }

  private createXPCounter(): void {
    this.xpSprite = this.createTextSprite('Blocks: 0 / 0', 512, 64, 28, '#f5deb3', '#3e2723');
    this.xpSprite.position.set(12, 12, 0);
    this.xpSprite.scale.set(8, 1, 1);
    this.scene.add(this.xpSprite);
  }

  updateXP(totalXp: number, blocksPlaced: number, totalSlots: number): void {
    this.totalXp = totalXp;
    this.blocksPlaced = blocksPlaced;
    this.totalSlots = totalSlots;

    if (this.xpSprite) {
      this.scene.remove(this.xpSprite);
      this.xpSprite.material.dispose();
    }
    this.xpSprite = this.createTextSprite(
      `Blocks: ${blocksPlaced.toLocaleString()} / ${totalSlots.toLocaleString()}  |  XP: ${totalXp.toLocaleString()}`,
      512, 64, 24, '#f5deb3', '#3e2723'
    );
    this.xpSprite.position.set(12, 12, 0);
    this.xpSprite.scale.set(8, 1, 1);
    this.scene.add(this.xpSprite);
  }

  showActivityText(label: string, xpEarned: number): void {
    const text = `+${xpEarned} XP  ${label}`;
    const sprite = this.createTextSprite(text, 512, 48, 20, '#ffcc00', 'transparent');
    const x = -5 + Math.random() * 10;
    const startY = 14;
    sprite.position.set(x, startY, -5 + Math.random() * 10);
    sprite.scale.set(6, 0.6, 1);
    this.scene.add(sprite);

    this.floatingTexts.push({
      sprite,
      lifetime: 3,
      age: 0,
      startY,
    });
  }

  updateSessionLabel(sessionId: string, name: string, status: string): void {
    // Session labels will be positioned above pharaohs by the EventRouter
    // For now, just log
    console.log(`Session ${name} (${sessionId.slice(0, 8)}): ${status}`);
  }

  update(delta: number): void {
    // Animate floating text (rise + fade)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.age += delta;

      if (ft.age >= ft.lifetime) {
        this.scene.remove(ft.sprite);
        ft.sprite.material.dispose();
        this.floatingTexts.splice(i, 1);
        continue;
      }

      const t = ft.age / ft.lifetime;
      ft.sprite.position.y = ft.startY + t * 3;
      (ft.sprite.material as THREE.SpriteMaterial).opacity = 1 - t;
    }
  }

  private createTextSprite(
    text: string,
    width: number,
    height: number,
    fontSize: number,
    textColor: string,
    bgColor: string
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Background
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.roundRect(0, 0, width, height, 8);
      ctx.fill();
    }

    // Text
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    return new THREE.Sprite(material);
  }
}
```

**Step 2: Verify HUD renders**

Start server and frontend, send test events. Expected: Stone tablet-styled XP counter floating above the pyramid. Gold "+5 XP" text floats up and fades when events arrive.

**Step 3: Commit**

```bash
git add src/hud/HUD.ts
git commit -m "feat: add in-world HUD with XP counter and floating activity text"
```

---

## Task 10: Sand Particle System

**Files:**
- Create: `src/effects/SandParticles.ts`
- Modify: `src/main.ts`

**Step 1: Create wind-blown sand particle system**

`src/effects/SandParticles.ts`:
```typescript
import * as THREE from 'three';

const PARTICLE_COUNT = 500;

export class SandParticles {
  private particles: THREE.Points;
  private velocities: Float32Array;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    this.velocities = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Spread across scene
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 5;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      // Wind direction (mostly +x with some variance)
      this.velocities[i3] = 2 + Math.random() * 3;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xd4a574,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
  }

  update(delta: number): void {
    const positions = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions.array[i3] += this.velocities[i3] * delta;
      positions.array[i3 + 1] += this.velocities[i3 + 1] * delta;
      positions.array[i3 + 2] += this.velocities[i3 + 2] * delta;

      // Wrap around when particles go too far
      if ((positions.array[i3] as number) > 50) {
        (positions.array as Float32Array)[i3] = -50;
        (positions.array as Float32Array)[i3 + 1] = Math.random() * 5;
        (positions.array as Float32Array)[i3 + 2] = (Math.random() - 0.5) * 100;
      }
    }

    positions.needsUpdate = true;
  }
}
```

**Step 2: Add to main.ts**

```typescript
import { SandParticles } from './effects/SandParticles.js';

const sand = new SandParticles(sceneManager.scene);
```

Add `sand.update(delta);` to the animate loop.

**Step 3: Verify particles render**

Expected: Subtle sand particles drift across the scene from left to right, creating a wind effect.

**Step 4: Commit**

```bash
git add src/effects/SandParticles.ts src/main.ts
git commit -m "feat: add wind-blown sand particle system for desert atmosphere"
```

---

## Task 11: Integration Test + Polish

**Files:**
- Modify: `src/main.ts` (final wiring)
- Create: `scripts/test-events.sh` (test harness)

**Step 1: Create test event script**

`scripts/test-events.sh`:
```bash
#!/bin/bash
# Sends a sequence of test hook events to the Pyramid server
PORT="${PYRAMID_PORT:-4200}"
URL="http://localhost:${PORT}/event"

echo "Sending test events to ${URL}..."

# Session start
curl -s -X POST "$URL" -H "Content-Type: application/json" \
  -d '{"hook_event_name":"SessionStart","session_id":"demo-session-1","cwd":"/project"}'
sleep 0.5

# A series of tool calls
TOOLS=("Read" "Read" "Grep" "Edit" "Write" "Bash" "Edit" "Write" "Read" "WebFetch" "Edit" "Write" "Write" "Bash" "Task")

for tool in "${TOOLS[@]}"; do
  echo "  -> $tool"
  curl -s -X POST "$URL" -H "Content-Type: application/json" \
    -d "{\"hook_event_name\":\"PostToolUse\",\"session_id\":\"demo-session-1\",\"tool_name\":\"${tool}\",\"tool_input\":{\"file_path\":\"src/example.ts\"}}"
  sleep 1
done

echo ""
echo "Done! Check the visualization."
```

**Step 2: Make executable and run full integration test**

```bash
chmod +x scripts/test-events.sh
```

1. Start server: `npx tsx server/index.ts`
2. Start frontend: `npm run dev`
3. Run test: `./scripts/test-events.sh`

Expected:
- Pharaoh and worker appear near the quarry
- Worker cycles through activities (survey → carry → chisel → antenna)
- Pharaoh cracks whip on each tool event
- Blocks drop onto the pyramid
- XP counter updates in real-time
- Floating "+N XP" text rises and fades
- Sand blows across the scene throughout

**Step 3: Commit**

```bash
git add scripts/test-events.sh
git commit -m "feat: add integration test script for simulating Claude Code events"
```

---

## Task 12: npm Package Configuration

**Files:**
- Modify: `package.json`

**Step 1: Update package.json for npm distribution**

Update `package.json` with proper metadata for `npx pyramid`:
```json
{
  "name": "pyramid-viz",
  "version": "0.1.0",
  "description": "Ancient Egyptian pyramid visualization for Claude Code activity",
  "type": "module",
  "bin": {
    "pyramid": "./bin/cli.ts"
  },
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx watch server/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\"",
    "build": "vite build",
    "start": "tsx bin/cli.ts",
    "setup": "tsx bin/setup.ts",
    "uninstall": "tsx bin/uninstall.ts"
  },
  "keywords": ["claude-code", "visualization", "three.js", "pyramid"],
  "license": "MIT"
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "feat: configure npm package for pyramid-viz distribution"
```

---

## Summary of Tasks

| # | Task | Key Files |
|---|------|-----------|
| 1 | Project Scaffolding | `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` |
| 2 | Shared Types | `shared/types.ts` |
| 3 | Node.js Server | `server/index.ts`, `server/state.ts` |
| 4 | Claude Code Hooks + CLI | `hooks/pyramid-hook.sh`, `bin/setup.ts`, `bin/uninstall.ts`, `bin/cli.ts` |
| 5 | Three.js Scene Foundation | `src/scene/SceneManager.ts`, `src/main.ts` |
| 6 | Pyramid Builder | `src/pyramid/PyramidBuilder.ts` |
| 7 | Procedural Characters | `src/characters/CharacterModel.ts`, `ProceduralWorker.ts`, `ProceduralPharaoh.ts`, `CharacterFactory.ts` |
| 8 | WebSocket Client + Event Router | `src/network/WSClient.ts`, `src/events/EventRouter.ts` |
| 9 | In-World HUD | `src/hud/HUD.ts` |
| 10 | Sand Particle System | `src/effects/SandParticles.ts` |
| 11 | Integration Test | `scripts/test-events.sh` |
| 12 | npm Package Config | `package.json` |

Dependencies: Task 2 → Tasks 3, 8. Task 5 → Tasks 6, 7, 9, 10. All others can be parallelized within their dependency chains.
