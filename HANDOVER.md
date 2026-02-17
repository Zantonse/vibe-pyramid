# HANDOVER.md — Pyramid Claude Code Visualization

**Session Date:** 2026-02-16
**Last Commit:** `cab41b0` (docs: add milestone levels design document)
**Branch:** master (1 commit ahead of origin/master)

---

## Session Summary

Completed comprehensive app review with Playwright, implemented 9 major improvements via subagent-driven development, committed and pushed changes, then began designing and implementing a new **milestone levels system** to add a construction-phase progression with named tiers. Designed the milestone system, wrote the implementation plan, and completed Tasks 1–2 of the 4-task plan (MILESTONES constant and playLevelUp chime). Tasks 3–4 (HUD milestone tracking and wiring) remain pending.

---

## What Got Done

### Phase 1: Visual & UX Improvements (9 Tasks)
Implemented via 3 parallel subagent batches and committed as single mega-commit (`935b0fd`):

**Batch 1 — HUD & Polish:**
- ✅ Migrated HUD from 3D world-space sprites to fixed HTML overlay with progress bar
- ✅ Enhanced sand particles: 1500 particles, varied sizes, soft circular shapes, dust clumps
- ✅ Added pyramid emoji favicon (eliminated 404)
- ✅ Spread character session positions into distinct construction lanes

**Batch 2 — Pyramid & Sky:**
- ✅ Converted PyramidBuilder to `THREE.InstancedMesh` (single draw call, massive perf gain)
- ✅ Added idle filter to EventRouter (removed TaskUpdate noise from sidebar)
- ✅ Implemented 3-stop sky gradient with warm gold transition band
- ✅ Added slow day/night cycle with animated sun and dynamic lighting

**Batch 3 — Audio & Camera:**
- ✅ Created BlockAudio system with procedural stone thunk sound (Web Audio API)
- ✅ Wired block landing audio + camera nudge in EventRouter/main.ts

### Phase 2: Milestone Levels Design & Planning
- ✅ Brainstormed milestone system with user: 6 named tiers (Surveying the Sands → Placing the Capstone)
- ✅ Designed level-up effects: gold shimmer on stats bar + floating milestone text + two-note chime
- ✅ Wrote comprehensive design document (saved to `/docs/plans/2026-02-16-milestone-levels-design.md`)
- ✅ Wrote 4-task implementation plan (saved to `/docs/plans/2026-02-16-milestone-levels-plan.md`)

### Phase 3: Milestone Levels Implementation (Partial)
**Task 1: Add MILESTONES constant** ✅
→ Added `Milestone` interface and `MILESTONES` array to `/shared/types.ts` (6 tiers with exponential XP thresholds: 0, 50, 500, 2000, 5000, 7500)

**Task 2: Add playLevelUp chime** ✅
→ Implemented `playLevelUp()` method in `/src/audio/BlockAudio.ts` (two-note rising chime: C5→E5, 0.8s total duration)

**Task 3: Milestone tracking in HUD** ⏳ PENDING
→ Needs: currentMilestoneIndex field, onLevelUp callback, getMilestoneIndex() helper, updated updateXP() with milestone detection, triggerLevelUp() method with shimmer + floating text, CSS keyframes for pyr-hud-shimmer

**Task 4: Wire level-up audio in main.ts** ⏳ PENDING
→ Needs: Single line in main.ts after pyramid.onBlockLand wiring → `hud.onLevelUp(() => audio.playLevelUp());`

---

## What Didn't Work / Bugs Encountered

### Session Bugs (All Fixed)

1. **HUD TypeScript Strict Mode Errors (TS2564)**
   **Symptom:** Errors on `!: HTMLElement` field assignments in first HUD implementation batch
   **Fix:** Added definite assignment assertions (`!:`) to fields initialized in methods
   **File:** `/src/hud/HUD.ts`

2. **Plan Task Consolidation Error**
   **Symptom:** Initial plan had `QUARRY_CENTER.y` instead of `.z` for character lane spreading
   **Fix:** Corrected to use `.z` axis (Y is vertical in Three.js, Z is horizontal depth)
   **File:** `/docs/plans/2026-02-16-pyramid-improvements.md`

3. **Playwright Chrome Session Conflict**
   **Symptom:** Browser launch failed due to existing Chrome process from previous session
   **Fix:** Cleared browser cache and restarted environment
   **Result:** Playwright screenshots captured successfully

4. **Overlapping Plan Tasks**
   **Symptom:** Original 14-item improvement list consolidated into 9 tasks to avoid merge conflicts:
   - Tasks 2 + 5 both modified PyramidBuilder (pyramid fill order + InstancedMesh conversion)
   - Tasks 3 + 10 + 11 all modified SceneManager (sky gradient + day/night + camera nudge)
   - Tasks 1 + 9 both involved HUD (HTML migration + character lane spacing consolidation)

   **Resolution:** Grouped into 3 parallel subagent batches for efficient execution

---

## Key Decisions Made

### Architectural

1. **Pure Client-Side Milestones**
   Server already sends `total_xp` with every event. No server-side changes needed. HUD computes milestone index from threshold lookup table on each frame.

2. **Exponential XP Thresholds**
   Milestones at 0, 50, 500, 2000, 5000, 7500 XP. Early milestones feel fast (50 XP = ~10 blocks), later ones are earned (5000 XP = ~1000 blocks).

3. **InstancedMesh for Pyramid**
   Replaced ~1500 individual meshes with single InstancedMesh. Per-instance colors via `setColorAt()`. Animating blocks still tracked, updates applied in-place.

4. **Idle Filtering**
   TaskUpdate/TaskCreate events mapped to 'idle' activity. Filtered from sidebar visual log and floating XP text, but XP still counts toward total and blocks.

### UX & Visuals

1. **Milestone Naming**
   Chose pyramid construction phases (Surveying → Placing the Capstone) instead of generic level names. Immersive and domain-appropriate.

2. **Level-Up Effects (Subtle)**
   - Gold shimmer animation on stats bar (1.5s)
   - Floating milestone name in gold text (3s fade, larger than XP text)
   - Two-note chime (C5→E5, high-pitched achievement sound)

   Intentionally understated—no screen-shake or pop-ups, fits the aesthetic.

3. **HUD Inline Display**
   Stats bar text changes from `Blocks: 255 / 1,540 | XP: 1,278` to `🏛 Rising Walls | Blocks: 255 / 1,540 | XP: 1,278`. No new UI elements, compact.

---

## Lessons Learned / Gotchas

1. **Subagent Batching Efficiency**
   Grouping parallel tasks by dependency (HUD first, then pyramid fill order, then sky effects) reduces git conflicts and makes review cleaner than one-off commits.

2. **Three.js Coordinate System**
   Y = vertical, Z = depth-into-scene, X = left-right. Character lane spreading uses Z-axis variation, not Y.

3. **InstancedMesh Color Updates**
   Must check `this.instancedMesh.instanceColor` before updating. If undefined, per-instance colors aren't supported (rare but happens with certain material types).

4. **Milestone Detection Edge Case**
   When restoring from state_snapshot with existing XP, milestone index must be set on first update (can't rely on detecting transition from 0 → N if starting mid-session).

5. **CSS Animation Reflow Trick**
   To retrigger a CSS animation on the same element: remove class, force reflow with `offsetWidth`, add class back.

6. **Web Audio API Suspend/Resume**
   AudioContext starts in 'suspended' state on user gesture. Must call `ctx.resume()` on first play attempt. Wrap in try/catch to handle environments without audio support.

---

## Current State

### Repository Status
```
Branch: master
Ahead of origin/master: 1 commit
Untracked files:
  - docs/plans/2026-02-16-pyramid-improvements.md (14-item design brief)
  - docs/plans/2026-02-16-pyramid-implementation-plan.md (8-task structure)
  - docs/plans/2026-02-16-pyramid-visualization-design.md (Playwright review summary)
  - docs/plans/2026-02-16-milestone-levels-design.md (6-tier milestone spec)
  - docs/plans/2026-02-16-milestone-levels-plan.md (4-task implementation plan)
  - pyramid-*.png (4 Playwright screenshots from initial review)
```

### Code Status
- All 9 visual improvements committed and pushed to remote (`935b0fd`)
- MILESTONES constant added to `shared/types.ts` (committed as `cab41b0`)
- playLevelUp chime method added to `src/audio/BlockAudio.ts` (committed as `cab41b0`)
- HUD milestone tracking NOT YET implemented
- Level-up audio wiring NOT YET implemented in main.ts

### Working Build Status
- TypeScript compiles cleanly: `npx tsc --noEmit` ✅
- No uncommitted changes to source files
- Browser app loads and runs (last tested with 9 improvements + MILESTONES constant)

### Critical Files Map

#### Scene & Rendering
- `/src/scene/SceneManager.ts` — Three.js scene, sky shader, day/night cycle, camera nudge logic
- `/src/pyramid/PyramidBuilder.ts` — InstancedMesh pyramid with interleaved fill order, block animations
- `/src/effects/SandParticles.ts` — 1500 wind-blown sand particles with soft circles

#### UI & HUD
- `/src/hud/HUD.ts` — Fixed HTML overlay HUD (need to add milestone tracking here)
- `/src/ui/Sidebar.ts` — Session activity log, task list
- `index.html` — Main entry point with pyramid emoji favicon

#### Audio & Events
- `/src/audio/BlockAudio.ts` — Web Audio API: block thunk + playLevelUp chime
- `/src/events/EventRouter.ts` — WebSocket message handler, idle filter, activity routing
- `/src/main.ts` — App initialization and render loop (need to wire hud.onLevelUp() here)

#### Characters & Networking
- `/src/characters/CharacterFactory.ts` — Pharaoh + Worker character creation
- `/src/characters/SessionController.ts` — Character activity targeting, lane spreading
- `/src/network/WSClient.ts` — WebSocket connection to Node.js backend

#### Shared & Constants
- `/shared/types.ts` — MILESTONES constant ✅, XP_TABLE, message interfaces, TOOL_ACTIVITY_MAP

---

## Clear Next Steps

### Immediate (Continue Milestone Levels Plan)

**Step 1: Complete Task 3 — Milestone tracking in HUD**
Location: `/src/hud/HUD.ts`
Required changes:
1. Import MILESTONES from shared/types.ts
2. Add fields: `private currentMilestoneIndex = 0;` and `private onLevelUpCallback`
3. Add `onLevelUp(callback)` registration method
4. Add `getMilestoneIndex(xp)` helper to find milestone from threshold
5. Replace `updateXP()` to compute milestone and detect transitions
6. Add `triggerLevelUp(milestoneName)` method with shimmer animation + floating text
7. Add CSS keyframes for `pyrHudShimmer` animation

Verification:
```bash
npx tsc --noEmit  # Should compile cleanly
```

**Step 2: Complete Task 4 — Wire audio in main.ts**
Location: `/src/main.ts`
Required change: Add one line after pyramid.onBlockLand wiring:
```typescript
hud.onLevelUp(() => audio.playLevelUp());
```

**Step 3: Visual Verification with Playwright**
- Navigate to app
- Simulate high XP or mock state_snapshot to reach milestone threshold
- Verify: shimmer animation on stats bar, floating milestone text appears, chime plays
- Capture screenshots

**Step 4: Commit & Push**
```bash
git add src/hud/HUD.ts src/main.ts
git commit -m "feat: add milestone tracking with level-up effects to HUD"
git push origin master
```

### Follow-Up Work (Post-Milestone)

1. **Enhance Milestone Display**
   - Add milestone progress bar (XP until next milestone)
   - Show milestone icons/emojis different from pyramid (scarab, sphinx, etc.)

2. **Persistent Milestone History**
   - Save milestone unlock timestamps to state
   - Display achievement timeline in sidebar

3. **Audio Enhancements**
   - Different chime sounds for each milestone tier (ascending pitch)
   - Celebration sound effects on reaching final tier

4. **Game Balance**
   - Adjust XP thresholds based on real session data
   - Rebalance XP_TABLE for tools if milestones feel too slow/fast

---

## Implementation Checklist for Next Session

- [ ] Read `/docs/plans/2026-02-16-milestone-levels-plan.md` Tasks 3–4
- [ ] Implement Task 3 (HUD milestone tracking)
- [ ] Implement Task 4 (main.ts wiring)
- [ ] Run `npx tsc --noEmit` to verify compilation
- [ ] Test in browser (navigate to app, verify shimmer + floating text + chime)
- [ ] Commit and push changes
- [ ] Verify remote received commit: `git log --oneline origin/master -3`
- [ ] Mark session complete

---

**Generated:** 2026-02-16 | **Prepared for:** Next Claude session
