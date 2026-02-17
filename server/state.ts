import fs from 'fs';
import path from 'path';
import { PyramidState, XP_TABLE, XP_PER_BLOCK, MILESTONES } from '../shared/types.js';

const PYRAMID_DIR = path.join(process.env.HOME || '~', '.pyramid');
const STATE_FILE = path.join(PYRAMID_DIR, 'state.json');

const DEFAULT_STATE: PyramidState = {
  total_xp: 0,
  blocks_placed: 0,
  pyramid_layer: 0,
  sessions: {},
  milestone_unlocks: [],
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

function calculateLayer(blocksPlaced: number): number {
  let remaining = blocksPlaced;
  let layer = 0;
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
): { xp_earned: number; total_xp: number; blocks_placed: number; new_milestone_index: number | null } {
  const xp = XP_TABLE[toolName] ?? 1;
  const prevXp = state.total_xp;

  // Backward compatibility
  if (!state.milestone_unlocks) {
    state.milestone_unlocks = [];
  }

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

  // Milestone detection
  let new_milestone_index: number | null = null;
  for (let i = 0; i < MILESTONES.length; i++) {
    const milestone = MILESTONES[i];
    const wasAlreadyUnlocked = prevXp >= milestone.xpThreshold;
    const isNowUnlocked = state.total_xp >= milestone.xpThreshold;
    const alreadyRecorded = state.milestone_unlocks.some(u => u.milestoneIndex === i);

    if (isNowUnlocked && !wasAlreadyUnlocked && !alreadyRecorded) {
      state.milestone_unlocks.push({
        milestoneIndex: i,
        unlockedAt: new Date().toISOString(),
      });
      new_milestone_index = i;
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

export function updateSessionStatus(sessionId: string, status: 'active' | 'idle' | 'ended'): void {
  if (state.sessions[sessionId]) {
    state.sessions[sessionId].status = status;
    state.sessions[sessionId].last_active = new Date().toISOString();
    saveState();
  }
}
