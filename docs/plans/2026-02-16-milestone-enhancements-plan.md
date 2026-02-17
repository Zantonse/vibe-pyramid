# Milestone System Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the existing milestone system with a progress bar toward the next tier, per-milestone unique icons, persistent server-side unlock history displayed in the sidebar, tier-scaled audio chimes, and rebalanced XP values.

**Architecture:** Tasks 1, 2, 4, and 5 are purely client-side changes to `shared/types.ts`, `HUD.ts`, and `BlockAudio.ts`. Task 3 adds a `milestone_unlocks` array to the server's persisted `PyramidState`, a new `milestone_unlock` WebSocket message type, and an achievements section in the Sidebar. Task 5 adjusts constants in `shared/types.ts` affecting both server and client.

**Tech Stack:** TypeScript, Web Audio API, CSS animations, Node.js/Express/WebSocket

---

### Task 1: Add per-milestone icons and rebalance XP thresholds

**Files:**
- Modify: `shared/types.ts`

**Context:** The `Milestone` interface currently has `name` and `xpThreshold`. We need to add an `icon` field (emoji string). We also need to rebalance `XP_TABLE` values and milestone thresholds to make early milestones feel faster and later ones more earned. The current `XP_PER_BLOCK` of 5 means 1 block per tool use for Write (5 XP). We'll keep that but increase high-effort tools and add a wider range of milestone thresholds.

**Step 1: Add `icon` field to `Milestone` interface and update `MILESTONES`**

Replace the `Milestone` interface and `MILESTONES` array in `shared/types.ts` (lines 16-28) with:

```typescript
export interface Milestone {
  name: string;
  xpThreshold: number;
  icon: string;
}

export const MILESTONES: Milestone[] = [
  { name: 'Surveying the Sands', xpThreshold: 0, icon: '\u{1F3DC}' },       // desert
  { name: 'Laying Foundations', xpThreshold: 50, icon: '\u{1F9F1}' },        // brick
  { name: 'Rising Walls', xpThreshold: 500, icon: '\u{1F3D7}' },            // building construction
  { name: 'Inner Chambers', xpThreshold: 2000, icon: '\u{1F3FA}' },         // amphora
  { name: 'Gilding the Facade', xpThreshold: 5000, icon: '\u{2728}' },      // sparkles
  { name: 'Placing the Capstone', xpThreshold: 7500, icon: '\u{1F3DB}' },   // classical building
];
```

**Step 2: Rebalance XP_TABLE**

Replace the `XP_TABLE` (lines 1-12) with:

```typescript
// XP values for each tool type
export const XP_TABLE: Record<string, number> = {
  Read: 1,
  Glob: 1,
  Grep: 1,
  Bash: 3,
  WebFetch: 3,
  WebSearch: 3,
  Edit: 5,
  Task: 7,
  Write: 8,
};
```

This makes heavy-lifting tools (Write, Task, Edit) feel more rewarding and widens the gap between exploration (Read/Glob/Grep) and creation.

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Errors in `HUD.ts` referencing `milestone.icon` — that's expected, we fix that in Task 2.

Actually, since `icon` is a new field, existing code only reads `milestone.name` and `milestone.xpThreshold`, so it should compile cleanly.

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 4: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add per-milestone icons and rebalance XP table"
```

---

### Task 2: Update HUD to show milestone icons and XP progress toward next tier

**Files:**
- Modify: `src/hud/HUD.ts`

**Context:** The HUD currently shows `🏛 Rising Walls | Blocks: 255 / 1,540 | XP: 1,278`. We need to:
1. Use the milestone's `icon` field instead of hardcoded `🏛`
2. Add XP progress toward the next milestone (e.g., `1,278 / 2,000 XP`)
3. Update the floating level-up text to use the milestone's icon

**Step 1: Update `updateXP()` to use milestone icon and show progress**

In `src/hud/HUD.ts`, replace the `updateXP` method (lines 133-155) with:

```typescript
  updateXP(totalXp: number, blocksPlaced: number, totalSlots: number): void {
    this.totalXp = totalXp;
    this.blocksPlaced = blocksPlaced;
    this.totalSlots = totalSlots;

    const newIndex = this.getMilestoneIndex(totalXp);
    const milestone = MILESTONES[newIndex];
    const nextMilestone = MILESTONES[newIndex + 1];

    let xpText: string;
    if (nextMilestone) {
      xpText = `XP: ${totalXp.toLocaleString()} / ${nextMilestone.xpThreshold.toLocaleString()}`;
    } else {
      xpText = `XP: ${totalXp.toLocaleString()} (MAX)`;
    }

    this.statsBar.textContent = `${milestone.icon} ${milestone.name}  |  Blocks: ${blocksPlaced.toLocaleString()} / ${totalSlots.toLocaleString()}  |  ${xpText}`;

    const progress = totalSlots > 0 ? (blocksPlaced / totalSlots) * 100 : 0;
    const fillElement = this.progressBar.querySelector('div') as HTMLElement;
    if (fillElement) {
      fillElement.style.width = `${progress}%`;
    }

    if (newIndex > this.currentMilestoneIndex) {
      this.currentMilestoneIndex = newIndex;
      this.triggerLevelUp(milestone.name, milestone.icon);
    } else if (newIndex > 0 && this.currentMilestoneIndex === 0) {
      this.currentMilestoneIndex = newIndex;
    }
  }
```

**Step 2: Update `triggerLevelUp()` to accept and use icon**

Replace the `triggerLevelUp` method (lines 157-189) with:

```typescript
  private triggerLevelUp(milestoneName: string, icon: string): void {
    this.statsBar.classList.remove('pyr-hud-shimmer');
    void this.statsBar.offsetWidth;
    this.statsBar.classList.add('pyr-hud-shimmer');

    const floatingDiv = document.createElement('div');
    floatingDiv.style.cssText = `
      position: fixed;
      bottom: 160px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffd700;
      font-size: 28px;
      font-weight: bold;
      font-family: monospace;
      white-space: nowrap;
      pointer-events: none;
      text-shadow: 0 0 12px rgba(255, 215, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.8);
      animation: hudFloatUp 3s ease-out forwards;
    `;
    floatingDiv.textContent = `${icon} ${milestoneName}`;

    document.body.appendChild(floatingDiv);

    this.floatingTexts.push({
      element: floatingDiv,
      createdAt: performance.now(),
    });

    if (this.onLevelUpCallback) {
      this.onLevelUpCallback(milestoneName);
    }
  }
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 4: Commit**

```bash
git add src/hud/HUD.ts
git commit -m "feat: show milestone icons and XP progress toward next tier in HUD"
```

---

### Task 3: Add tier-scaled audio chimes

**Files:**
- Modify: `src/audio/BlockAudio.ts`
- Modify: `src/hud/HUD.ts` (update callback signature)
- Modify: `src/main.ts` (update wiring)

**Context:** Currently `playLevelUp()` plays the same C5→E5 chime for all milestones. We want each tier to play a higher interval, and the final tier to get a special celebration. The milestone index (0-5) tells us which tier was just unlocked.

The `onLevelUp` callback currently passes `milestoneName: string`. We need to also pass the `milestoneIndex: number` so audio can scale.

**Step 1: Update `playLevelUp()` to accept a tier index**

Replace the `playLevelUp` method in `src/audio/BlockAudio.ts` (lines 60-90) with:

```typescript
  playLevelUp(tierIndex: number): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Base frequencies rise with each tier
    // Tier 1: C5→E5, Tier 2: D5→F#5, Tier 3: E5→G#5, Tier 4: F#5→A#5, Tier 5: G#5→C6
    const baseFreqs = [523, 587, 659, 740, 831];
    const thirdFreqs = [659, 740, 831, 932, 1047];
    const idx = Math.min(tierIndex - 1, baseFreqs.length - 1);
    const freq1 = baseFreqs[Math.max(0, idx)];
    const freq2 = thirdFreqs[Math.max(0, idx)];

    const isFinalTier = tierIndex >= 5;
    const duration = isFinalTier ? 1.5 : 0.8;
    const volume = isFinalTier ? 0.18 : 0.12;

    // Two-note rising chime
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    // Note 1
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq1, now);
    osc1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + duration * 0.4);

    // Note 2 (delayed)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq2, now + 0.15);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(volume, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + duration);

    // Final tier: add a third note (octave) for a triumphant chord
    if (isFinalTier) {
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq1 * 2, now + 0.3);
      const gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0, now);
      gain3.gain.setValueAtTime(volume * 0.8, now + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.3);
      osc3.stop(now + 1.5);
    }
  }
```

**Step 2: Update HUD `onLevelUp` callback to include milestone index**

In `src/hud/HUD.ts`, change the callback type on line 17:

From:
```typescript
  private onLevelUpCallback: ((milestoneName: string) => void) | null = null;
```

To:
```typescript
  private onLevelUpCallback: ((milestoneName: string, milestoneIndex: number) => void) | null = null;
```

Update the `onLevelUp` method (line 28-30):

From:
```typescript
  onLevelUp(callback: (milestoneName: string) => void): void {
```

To:
```typescript
  onLevelUp(callback: (milestoneName: string, milestoneIndex: number) => void): void {
```

Update the callback invocation inside `triggerLevelUp` — find the line:
```typescript
      this.onLevelUpCallback(milestoneName);
```

Replace with:
```typescript
      this.onLevelUpCallback(milestoneName, this.currentMilestoneIndex);
```

**Step 3: Update main.ts wiring**

In `src/main.ts`, change line 20:

From:
```typescript
hud.onLevelUp(() => audio.playLevelUp());
```

To:
```typescript
hud.onLevelUp((_name, index) => audio.playLevelUp(index));
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 5: Commit**

```bash
git add src/audio/BlockAudio.ts src/hud/HUD.ts src/main.ts
git commit -m "feat: scale level-up chime pitch by milestone tier"
```

---

### Task 4: Add persistent milestone history to server state

**Files:**
- Modify: `shared/types.ts` (add `MilestoneUnlock` interface, update `PyramidState`)
- Modify: `server/state.ts` (detect milestone unlocks, persist timestamps)
- Modify: `server/index.ts` (broadcast milestone_unlock events)

**Context:** The server already tracks `total_xp` and calls `processToolEvent()` on each hook. We need to:
1. Add a `milestone_unlocks` array to `PyramidState` with timestamps
2. Detect when a new milestone threshold is crossed server-side
3. Broadcast a new `milestone_unlock` WSMessage so clients can react
4. The unlock data persists in `~/.pyramid/state.json`

**Step 1: Add types to `shared/types.ts`**

After the `MILESTONES` array (after line 28 equivalent — after the closing `];`), add:

```typescript
export interface MilestoneUnlock {
  milestoneIndex: number;
  unlockedAt: string; // ISO 8601
}
```

Update the `PyramidState` interface — add `milestone_unlocks`:

```typescript
export interface PyramidState {
  total_xp: number;
  blocks_placed: number;
  pyramid_layer: number;
  sessions: Record<string, SessionState>;
  milestone_unlocks: MilestoneUnlock[];
}
```

Add a new message type to the `WSMessage` union:

```typescript
export interface MilestoneUnlockMessage {
  type: 'milestone_unlock';
  milestone_index: number;
  milestone_name: string;
  milestone_icon: string;
  unlocked_at: string;
  total_xp: number;
}

export type WSMessage =
  | ToolActivityMessage
  | SessionUpdateMessage
  | StateSnapshotMessage
  | MilestoneUnlockMessage;
```

**Step 2: Update server/state.ts to detect and persist milestone unlocks**

Add import for MILESTONES at the top of `server/state.ts` — update the import line:

From:
```typescript
import { PyramidState, XP_TABLE, XP_PER_BLOCK } from '../shared/types.js';
```

To:
```typescript
import { PyramidState, XP_TABLE, XP_PER_BLOCK, MILESTONES } from '../shared/types.js';
```

Update `DEFAULT_STATE` to include `milestone_unlocks`:

```typescript
const DEFAULT_STATE: PyramidState = {
  total_xp: 0,
  blocks_placed: 0,
  pyramid_layer: 0,
  sessions: {},
  milestone_unlocks: [],
};
```

Update `processToolEvent` return type and add milestone detection. Replace the function (lines 65-95) with:

```typescript
export function processToolEvent(
  sessionId: string,
  toolName: string,
  metadata: { file?: string; command?: string }
): { xp_earned: number; total_xp: number; blocks_placed: number; new_milestone_index: number | null } {
  const xp = XP_TABLE[toolName] ?? 1;
  const prevXp = state.total_xp;

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

  // Ensure milestone_unlocks array exists (backward compat with old state files)
  if (!state.milestone_unlocks) {
    state.milestone_unlocks = [];
  }

  // Check for new milestone unlock
  let new_milestone_index: number | null = null;
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (state.total_xp >= MILESTONES[i].xpThreshold && prevXp < MILESTONES[i].xpThreshold) {
      const alreadyUnlocked = state.milestone_unlocks.some(u => u.milestoneIndex === i);
      if (!alreadyUnlocked) {
        state.milestone_unlocks.push({
          milestoneIndex: i,
          unlockedAt: new Date().toISOString(),
        });
        new_milestone_index = i;
      }
      break;
    }
  }

  saveState();

  return {
    xp_earned: xp,
    total_xp: state.total_xp,
    blocks_placed: state.blocks_placed,
    new_milestone_index,
  };
}
```

**Step 3: Update server/index.ts to broadcast milestone_unlock events**

Add import for `MILESTONES` and `MilestoneUnlockMessage`:

```typescript
import type { HookEvent, WSMessage, ToolActivityMessage, SessionUpdateMessage, StateSnapshotMessage, MilestoneUnlockMessage } from '../shared/types.js';
import { MILESTONES } from '../shared/types.js';
```

Update the PostToolUse handler — after the `broadcast(msg)` line for `ToolActivityMessage`, add:

```typescript
    if (result.new_milestone_index !== null) {
      const m = MILESTONES[result.new_milestone_index];
      const milestoneMsg: MilestoneUnlockMessage = {
        type: 'milestone_unlock',
        milestone_index: result.new_milestone_index,
        milestone_name: m.name,
        milestone_icon: m.icon,
        unlocked_at: new Date().toISOString(),
        total_xp: result.total_xp,
      };
      broadcast(milestoneMsg);
    }
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Errors in `EventRouter.ts` about unhandled `milestone_unlock` case — expected, fixed in Task 5.

Actually, the `handle()` method uses a `switch` on `msg.type` and doesn't have a `default` case, so adding a new type to the union won't cause compile errors unless strict exhaustiveness checking is on. It should compile cleanly.

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 5: Commit**

```bash
git add shared/types.ts server/state.ts server/index.ts
git commit -m "feat: persist milestone unlock timestamps on server"
```

---

### Task 5: Display milestone achievement timeline in sidebar

**Files:**
- Modify: `src/ui/Sidebar.ts` (add achievements section)
- Modify: `src/events/EventRouter.ts` (handle `milestone_unlock` message, pass unlocks from snapshot)

**Context:** The Sidebar currently shows sessions with expandable task lists. We'll add an "Achievements" section above the sessions list that shows unlocked milestones with their icons and timestamps. The EventRouter needs to handle the new `milestone_unlock` message type and also extract `milestone_unlocks` from `state_snapshot` to initialize the sidebar on reconnect.

**Step 1: Add achievements section to Sidebar**

In `src/ui/Sidebar.ts`, add a new `import` at the top:

```typescript
import type { MilestoneUnlock } from '../../shared/types.js';
import { MILESTONES } from '../../shared/types.js';
```

Add a new field after `private listEl: HTMLElement;` (line 45):

```typescript
  private achievementsEl: HTMLElement;
  private unlockedIndices: Set<number> = new Set();
```

In the constructor, after creating `this.listEl` and before `document.body.appendChild(this.container)`, insert:

```typescript
    this.achievementsEl = document.createElement('div');
    this.achievementsEl.className = 'pyr-achievements';
    this.achievementsEl.style.display = 'none';
    this.container.insertBefore(this.achievementsEl, this.listEl);
```

Add a new public method:

```typescript
  addMilestoneUnlock(milestoneIndex: number, unlockedAt: string): void {
    if (this.unlockedIndices.has(milestoneIndex)) return;
    this.unlockedIndices.add(milestoneIndex);

    const milestone = MILESTONES[milestoneIndex];
    if (!milestone) return;

    this.achievementsEl.style.display = 'block';

    const entry = document.createElement('div');
    entry.className = 'pyr-achievement';

    const icon = document.createElement('span');
    icon.className = 'pyr-achievement-icon';
    icon.textContent = milestone.icon;
    entry.appendChild(icon);

    const info = document.createElement('div');
    info.className = 'pyr-achievement-info';

    const name = document.createElement('div');
    name.className = 'pyr-achievement-name';
    name.textContent = milestone.name;
    info.appendChild(name);

    const time = document.createElement('div');
    time.className = 'pyr-achievement-time';
    const date = new Date(unlockedAt);
    time.textContent = date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    info.appendChild(time);

    entry.appendChild(info);

    const xpBadge = document.createElement('span');
    xpBadge.className = 'pyr-achievement-xp';
    xpBadge.textContent = milestone.xpThreshold.toLocaleString() + ' XP';
    entry.appendChild(xpBadge);

    // Insert sorted by milestone index (highest at top)
    const existingEntries = this.achievementsEl.querySelectorAll('.pyr-achievement');
    let inserted = false;
    for (const existing of existingEntries) {
      const existingIdx = parseInt(existing.getAttribute('data-idx') || '0', 10);
      if (milestoneIndex > existingIdx) {
        this.achievementsEl.insertBefore(entry, existing);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.achievementsEl.appendChild(entry);
    }
    entry.setAttribute('data-idx', String(milestoneIndex));
  }
```

**Step 2: Add achievement CSS to `injectStyles()`**

In the `injectStyles()` method, add these rules before the closing backtick of `style.textContent`:

```css
      .pyr-achievements {
        padding: 8px 14px;
        border-bottom: 1px solid #c9a84c55;
      }
      .pyr-achievement {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid #ffffff08;
      }
      .pyr-achievement-icon {
        font-size: 20px;
        flex-shrink: 0;
        width: 28px;
        text-align: center;
      }
      .pyr-achievement-info {
        flex: 1;
        min-width: 0;
      }
      .pyr-achievement-name {
        font-weight: 600;
        color: #ffd700;
        font-size: 12px;
      }
      .pyr-achievement-time {
        color: #888;
        font-size: 10px;
      }
      .pyr-achievement-xp {
        font-size: 10px;
        color: #c9a84c;
        background: #c9a84c22;
        padding: 2px 6px;
        border-radius: 3px;
        flex-shrink: 0;
      }
```

**Step 3: Update EventRouter to handle milestone_unlock messages and snapshot unlocks**

In `src/events/EventRouter.ts`, add to the `handle()` method switch statement, after the `state_snapshot` case:

```typescript
      case 'milestone_unlock':
        this.sidebar.addMilestoneUnlock(msg.milestone_index, msg.unlocked_at);
        break;
```

Update `handleStateSnapshot` to also restore milestone unlocks:

```typescript
  private handleStateSnapshot(state: PyramidState): void {
    this.pyramid.restoreBlocks(state.blocks_placed);
    this.hud.updateXP(state.total_xp, state.blocks_placed, this.pyramid.totalSlots);

    for (const [sessionId, sessionState] of Object.entries(state.sessions)) {
      if (sessionState.status !== 'ended') {
        this.characters.getOrCreate(sessionId);
      }
    }

    // Restore milestone unlocks in sidebar
    if (state.milestone_unlocks) {
      for (const unlock of state.milestone_unlocks) {
        this.sidebar.addMilestoneUnlock(unlock.milestoneIndex, unlock.unlockedAt);
      }
    }
  }
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 5: Commit**

```bash
git add src/ui/Sidebar.ts src/events/EventRouter.ts
git commit -m "feat: display milestone achievement timeline in sidebar"
```
