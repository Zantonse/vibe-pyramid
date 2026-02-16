# Pyramid Era Milestones — Design

**Goal:** Add a leveling system where XP thresholds unlock named construction-phase milestones, displayed inline in the HUD with a subtle level-up effect.

**Architecture:** Pure client-side. The server already sends `total_xp` on every event and in `state_snapshot`. The HUD computes the current milestone from a threshold lookup table. No server changes needed.

---

## Milestone Definitions

| # | Milestone | XP Threshold | ~Blocks | Meaning |
|---|-----------|-------------|---------|---------|
| 1 | Surveying the Sands | 0 | 0 | Just started |
| 2 | Laying Foundations | 50 | 10 | First real progress |
| 3 | Rising Walls | 500 | 100 | Visible structure forming |
| 4 | Inner Chambers | 2,000 | 400 | ~1st layer complete |
| 5 | Gilding the Facade | 5,000 | 1,000 | Pyramid taking shape |
| 6 | Placing the Capstone | 7,500 | 1,500 | Near completion |

Thresholds scale roughly exponentially so early milestones feel fast and later ones are earned.

## HUD Changes

Stats bar text changes from:
```
Blocks: 255 / 1,540 | XP: 1,278
```
to:
```
🏛 Rising Walls | Blocks: 255 / 1,540 | XP: 1,278
```

Existing progress bar stays as pyramid completion %. No new UI elements.

## Level-Up Effect

When a new milestone is reached:
- Stats bar gets a brief gold shimmer (CSS animation, ~1.5s)
- Floating text appears with milestone name (same style as "+XP" floaters but larger, gold, slower fade)
- A chime sound plays via `BlockAudio` (new method — higher pitched, slightly longer than block thunk)

## Files Affected

- `shared/types.ts` — Add `MILESTONES` constant array
- `src/hud/HUD.ts` — Compute milestone from `total_xp`, update stats text, shimmer animation, floating milestone text
- `src/audio/BlockAudio.ts` — Add `playLevelUp()` chime method
- `src/main.ts` — Wire level-up detection to trigger audio
- `src/events/EventRouter.ts` — Pass level-up info when calling HUD
