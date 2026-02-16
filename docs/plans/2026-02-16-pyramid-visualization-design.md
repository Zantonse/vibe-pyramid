# Pyramid: Claude Code Visualization App — Design Document

**Date**: 2026-02-16
**Status**: Approved

## Overview

Pyramid is a real-time 3D visualization app for Claude Code that renders an ancient Egyptian pyramid construction scene. Each active Claude Code session is represented by a pharaoh/worker pair. Workers perform construction activities mapped to Claude's tool usage, while pharaohs crack whips to drive them. The pyramid grows block-by-block as XP accumulates from tool events.

## Core Concept

- **Metaphor**: Ancient Egypt pyramid construction site
- **Agents**: Each Claude Code session = 1 pharaoh + 1 worker
- **Progression**: Tool calls earn XP → XP fills blocks → blocks stack into a stepped pyramid
- **Visual style**: Low-poly stylized (Monument Valley / Crossy Road aesthetic)
- **UI**: Fullscreen 3D with in-world floating labels and HUD elements (no side panel)

## Tech Stack

- **Frontend**: Vite + TypeScript + Three.js
- **Backend**: Node.js WebSocket server
- **Data source**: Claude Code hooks (real-time tool events)
- **Persistence**: File-based JSON state (`~/.pyramid/state.json`)
- **Package**: npm CLI (`npx pyramid setup`, `npx pyramid`, `npx pyramid uninstall`)

## Architecture

```
Browser (Three.js)
├── SceneManager       — terrain, lighting, sky, camera (OrbitControls)
├── CharacterFactory   — creates pharaoh/worker pairs (procedural, swappable to GLB)
├── PyramidBuilder     — block grid, placement queue, XP→block math
├── EventRouter        — maps WebSocket events to visual actions
└── HUD               — floating XP counter, session labels, activity text

Node.js Server
├── WebSocket server   — broadcasts events to browser
├── HTTP endpoint      — receives hook POST events
├── State manager      — reads/writes ~/.pyramid/state.json (debounced)
└── Hook installer     — CLI setup/uninstall for Claude Code hooks
```

### Character Model Abstraction

```typescript
interface CharacterModel {
  mesh: THREE.Group;
  playAnimation(name: string): void; // 'idle' | 'walk' | 'whip' | 'carry' | 'chisel' | 'survey'
  setPosition(pos: THREE.Vector3): void;
  dispose(): void;
}
```

Currently implemented by `ProceduralCharacter` (Three.js primitives). Designed so a `GLBCharacter` implementation can be swapped in later by loading `.glb` files via `GLTFLoader`.

## Characters

### Pharaoh (one per Claude Code session)

- **Build**: Stacked cylinders/boxes — golden nemes headdress, white linen kilt, gold arm bands
- **Whip**: Series of small spheres on a bezier curve, animated with sine waves for cracking motion
- **Behavior**:
  - Patrols behind its paired worker
  - Tool call starts → whip crack animation + dust particles
  - Idle (>5s no activity) → stands with crossed arms
  - Session error → specific reaction animation

### Worker (one per Claude Code session)

- **Build**: Simpler — brown/tan body, white loincloth, shaved head
- **Props** (swappable by active tool):
  - **Read/Grep/Glob**: Holds papyrus scroll, surveys pyramid
  - **Edit/Write**: Carries stone block on shoulders, walks to pyramid, places it
  - **Bash**: Holds chisel/hammer, chips at blocks on the pyramid
  - **WebFetch/WebSearch**: Holds staff with Eye of Horus (antenna metaphor), looks skyward
  - **Task (subagents)**: Mini portal opens, smaller worker emerges
- **Movement**: Waypoint-based path between activity stations and pyramid

## XP System

| Tool Event | XP Value |
|---|---|
| Read, Glob, Grep | 1 XP |
| Bash | 2 XP |
| WebFetch, WebSearch | 2 XP |
| Edit | 3 XP |
| Task (subagent spawn) | 4 XP |
| Write | 5 XP |

- **1 block = 5 XP**
- Fractional progress shown as worker carrying a translucent/partially-materialized block
- 10-layer stepped pyramid = ~1,100 total blocks

## Pyramid Design

- **Style**: Stepped pyramid (Djoser-inspired)
- **Layers**: Base layer ~20x20 blocks, decreases by 2 per side per layer (20, 18, 16, 14... → capstone)
- **Fill order**: Left-to-right, front-to-back within a layer, then up to next layer
- **Block appearance**: Sandstone-colored `BoxGeometry` with subtle random warm hue variation + darker edge outlines (`EdgesGeometry`)
- **Placement animation**: Block floats down from above with ease-out bounce + dust particle burst on landing

## Scene Design

### Terrain
- Flat desert plane with sand-colored material and subtle vertex displacement for dunes
- Extends to horizon

### Sky
- Gradient from deep blue (zenith) to warm amber (horizon)
- Low-poly sun near horizon for dramatic lighting

### Lighting
- Directional light (sun) — warm yellow-white, casts shadows
- Soft ambient fill light

### Quarry
- Rocky area off to one side of the pyramid
- Workers "pick up" blocks here (dark stone primitive clusters)

### Camera
- `OrbitControls` — orbitable via mouse drag
- Default: ~45 degrees looking at pyramid center
- Auto-follows activity when events occur

### In-World UI
- Floating text labels above pharaohs (session name)
- XP counter as stone tablet near pyramid: "Blocks: 47 / 1,100"
- Tool activity as hieroglyph-styled floating text (fades out)
- Current file path shown as papyrus scroll unfurling near active worker

### Atmosphere
- Sand particle system drifting across scene (wind effect)
- Heat shimmer near pyramid base (stretch goal — vertex distortion shader)
- Day/night cycle tied to real clock (stretch goal)

## Data Flow

### Claude Code Hooks

Installed at `~/.claude/hooks/`:

```
tool_start.sh   — fires when Claude starts using a tool
tool_end.sh     — fires when tool execution completes
session.sh      — fires on session start/end
```

Each hook POSTs JSON to the local server:

```json
{
  "event": "tool_start",
  "tool": "Edit",
  "session_id": "abc123",
  "session_name": "my-feature",
  "timestamp": 1708070400,
  "metadata": {
    "file": "src/app.ts",
    "command": null
  }
}
```

### Server → Browser WebSocket Message

```json
{
  "type": "tool_activity",
  "session_id": "abc123",
  "tool": "Edit",
  "xp_earned": 3,
  "total_xp": 247,
  "blocks_placed": 49,
  "metadata": { "file": "src/app.ts" }
}
```

### Browser Event Routing

1. WebSocket message received
2. EventRouter dispatches to:
   - CharacterFactory: Worker starts activity animation
   - Pharaoh: Cracks whip
   - PyramidBuilder: Queues block placement (when worker arrives at pyramid)
   - HUD: Updates XP counter and floating text

## Persistence

Server maintains `~/.pyramid/state.json`:

```json
{
  "total_xp": 5500,
  "blocks_placed": 1100,
  "pyramid_layer": 10,
  "sessions": {
    "abc123": {
      "name": "my-feature",
      "xp_contributed": 2400,
      "last_active": "2026-02-16T01:30:00Z"
    }
  },
  "block_history": [
    { "placed_at": "2026-02-15T...", "session": "abc123", "tool": "Write" }
  ]
}
```

State loaded on server start. Written on every XP change (debounced to avoid disk thrashing).

## CLI Interface

```bash
npx pyramid setup      # Installs Claude Code hooks, creates ~/.pyramid/
npx pyramid            # Starts server + opens browser
npx pyramid uninstall  # Removes hooks, preserves state data
```

## Future Enhancements (Not in V1)

- **GLB character models**: Swap procedural characters for AI-generated models (Nano Banana → Meshy → Blender → GLB pipeline)
- **Sound effects**: Whip cracks, block placement thuds, ambient desert wind
- **Multi-pyramid**: Different projects build different pyramids
- **Achievements**: Visual milestones (e.g., pyramid tip capstone placement celebration)
- **Heat shimmer shader**: Vertex distortion effect near pyramid base
- **Day/night cycle**: Sun position tied to real-world clock

## Nano Banana / GLB Upgrade Path

When ready to upgrade characters from procedural to GLB models:

1. Use Gemini 2.5 Flash Image ("Nano Banana") to generate multi-angle reference images of pharaoh/worker in the desired style
2. Feed reference images into Meshy (image-to-3D) to generate initial mesh
3. Clean up in Blender 4.x: fix normals, decimate, UV unwrap, re-texture
4. Export as `.glb` with PBR materials
5. Implement `GLBCharacter` class conforming to `CharacterModel` interface
6. Load via Three.js `GLTFLoader`, replace `ProceduralCharacter` instantiation

Note: Nano Banana generates 2D images only — it does not output 3D meshes directly. The Meshy/Blender pipeline is required to convert to actual geometry.
