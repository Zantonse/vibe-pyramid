# Milestone Levels Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add pyramid era milestones that unlock at XP thresholds, displayed inline in the HUD with shimmer + floating text + chime on level-up.

**Architecture:** Pure client-side milestone computation. A shared `MILESTONES` constant defines thresholds. The HUD tracks the current milestone index and detects transitions in `updateXP()`. `BlockAudio` gets a new `playLevelUp()` chime. The HUD calls an `onLevelUp` callback wired in `main.ts` to trigger audio. No server changes.

**Tech Stack:** TypeScript, Web Audio API, CSS animations

---

### Task 1: Add MILESTONES constant to shared types

**Files:**
- Modify: `shared/types.ts`

**Context:** This file already exports `XP_TABLE`, `XP_PER_BLOCK`, and all the message/state interfaces. The milestones constant goes here so both server and client can reference it if needed later.

**Step 1: Add the Milestone type and MILESTONES array**

Append this after line 14 (`export const XP_PER_BLOCK = 5;`) in `shared/types.ts`:

```typescript
export interface Milestone {
  name: string;
  xpThreshold: number;
}

export const MILESTONES: Milestone[] = [
  { name: 'Surveying the Sands', xpThreshold: 0 },
  { name: 'Laying Foundations', xpThreshold: 50 },
  { name: 'Rising Walls', xpThreshold: 500 },
  { name: 'Inner Chambers', xpThreshold: 2000 },
  { name: 'Gilding the Facade', xpThreshold: 5000 },
  { name: 'Placing the Capstone', xpThreshold: 7500 },
];
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add MILESTONES constant to shared types"
```

---

### Task 2: Add playLevelUp chime to BlockAudio

**Files:**
- Modify: `src/audio/BlockAudio.ts`

**Context:** `BlockAudio` already has `playBlockLand()` which creates a low-frequency triangle oscillator (120→40 Hz) with a noise burst. The level-up chime should be a higher-pitched, slightly longer tone that feels like an achievement — a rising two-note chime.

**Step 1: Add `playLevelUp()` method**

Add this method after `playBlockLand()` (after line 58, before the closing `}` of the class):

```typescript
  playLevelUp(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Two-note rising chime
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    masterGain.connect(ctx.destination);

    // Note 1: C5
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523, now);
    osc1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Note 2: E5 (delayed)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659, now + 0.15);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.12, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.8);
  }
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/audio/BlockAudio.ts
git commit -m "feat: add playLevelUp chime to BlockAudio"
```

---

### Task 3: Add milestone tracking and level-up effects to HUD

**Files:**
- Modify: `src/hud/HUD.ts`

**Context:** `HUD.updateXP()` is called by EventRouter on every `tool_activity` and `state_snapshot`. It receives `totalXp`, `blocksPlaced`, and `totalSlots`. The HUD needs to: (1) compute the current milestone from `totalXp`, (2) detect when the milestone changes, (3) update the stats bar text to include the milestone name, (4) trigger a shimmer CSS animation and floating milestone text on level-up.

The HUD also needs an `onLevelUp` callback so `main.ts` can wire the audio chime.

**Step 1: Add imports and fields**

At the top of `src/hud/HUD.ts`, add the import:

```typescript
import { MILESTONES } from '../../shared/types.js';
```

Add these fields to the class (after `private totalSlots = 0;` on line 13):

```typescript
  private currentMilestoneIndex = 0;
  private onLevelUpCallback: ((milestoneName: string) => void) | null = null;
```

**Step 2: Add `onLevelUp` registration method**

Add after the constructor (after line 22):

```typescript
  onLevelUp(callback: (milestoneName: string) => void): void {
    this.onLevelUpCallback = callback;
  }
```

**Step 3: Add `getMilestoneIndex` helper**

Add as a private method:

```typescript
  private getMilestoneIndex(xp: number): number {
    let index = 0;
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (xp >= MILESTONES[i].xpThreshold) {
        index = i;
        break;
      }
    }
    return index;
  }
```

**Step 4: Update `updateXP()` to include milestone and detect level-up**

Replace the current `updateXP` method (lines 107-119) with:

```typescript
  updateXP(totalXp: number, blocksPlaced: number, totalSlots: number): void {
    this.totalXp = totalXp;
    this.blocksPlaced = blocksPlaced;
    this.totalSlots = totalSlots;

    const newIndex = this.getMilestoneIndex(totalXp);
    const milestone = MILESTONES[newIndex];

    this.statsBar.textContent = `\u{1F3DB} ${milestone.name}  |  Blocks: ${blocksPlaced.toLocaleString()} / ${totalSlots.toLocaleString()}  |  XP: ${totalXp.toLocaleString()}`;

    const progress = totalSlots > 0 ? (blocksPlaced / totalSlots) * 100 : 0;
    const fillElement = this.progressBar.querySelector('div') as HTMLElement;
    if (fillElement) {
      fillElement.style.width = `${progress}%`;
    }

    if (newIndex > this.currentMilestoneIndex) {
      this.currentMilestoneIndex = newIndex;
      this.triggerLevelUp(milestone.name);
    } else if (newIndex > 0 && this.currentMilestoneIndex === 0) {
      // Handle restore from snapshot where we start at 0
      this.currentMilestoneIndex = newIndex;
    }
  }
```

**Step 5: Add `triggerLevelUp()` method**

```typescript
  private triggerLevelUp(milestoneName: string): void {
    // Shimmer on stats bar
    this.statsBar.classList.remove('pyr-hud-shimmer');
    void this.statsBar.offsetWidth;
    this.statsBar.classList.add('pyr-hud-shimmer');

    // Floating milestone text (larger, slower than activity text)
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
    floatingDiv.textContent = `\u{1F3DB} ${milestoneName}`;

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

**Step 6: Add shimmer keyframes to `ensureAnimationStyles()`**

In the `ensureAnimationStyles()` method, add this CSS after the `hudFloatUp` keyframes (before the closing backtick on line 102):

```css
        @keyframes pyrHudShimmer {
          0% { border-color: rgba(255, 215, 0, 0.8); box-shadow: 0 0 12px rgba(255, 215, 0, 0.4); }
          100% { border-color: rgba(201, 168, 76, 0.3); box-shadow: none; }
        }
        .pyr-hud-shimmer {
          animation: pyrHudShimmer 1.5s ease-out forwards;
        }
```

**Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 8: Commit**

```bash
git add src/hud/HUD.ts
git commit -m "feat: add milestone tracking with level-up effects to HUD"
```

---

### Task 4: Wire level-up audio in main.ts

**Files:**
- Modify: `src/main.ts`

**Context:** `main.ts` already has `const audio = new BlockAudio()` and `const hud = new HUD()`. We just need to wire the HUD's `onLevelUp` callback to play the chime.

**Step 1: Add the wiring**

After line 19 (`pyramid.onBlockLand(() => audio.playBlockLand());`), add:

```typescript
hud.onLevelUp(() => audio.playLevelUp());
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire level-up audio chime in main"
```
