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
  milestone_block_ranges: [],
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
    } else if (fs.existsSync(STATE_FILE + '.tmp')) {
      // Recover from incomplete atomic write
      const raw = fs.readFileSync(STATE_FILE + '.tmp', 'utf-8');
      state = JSON.parse(raw);
      // Complete the rename
      fs.renameSync(STATE_FILE + '.tmp', STATE_FILE);
    }
  } catch {
    console.warn('Failed to load state, using defaults');
    state = { ...DEFAULT_STATE };
  }

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

  return state;
}

function saveState(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    try {
      const tmpFile = STATE_FILE + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2));
      fs.renameSync(tmpFile, STATE_FILE);
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
  metadata: { file?: string; command?: string },
  cwd?: string
): { xp_earned: number; total_xp: number; blocks_placed: number; new_milestone_index: number | null; current_milestone_index: number } {
  const xp = XP_TABLE[toolName] ?? 1;
  const prevXp = state.total_xp;

  // Backward compatibility
  if (!state.milestone_unlocks) {
    state.milestone_unlocks = [];
  }
  if (!state.milestone_block_ranges) {
    state.milestone_block_ranges = [];
  }

  state.total_xp += xp;
  state.blocks_placed = Math.floor(state.total_xp / XP_PER_BLOCK);
  state.pyramid_layer = calculateLayer(state.blocks_placed);

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

  if (!state.sessions[sessionId]) {
    const folderName = cwd
      ? cwd.split('/').filter(Boolean).pop() ?? sessionId.slice(0, 8)
      : sessionId.slice(0, 8);
    state.sessions[sessionId] = {
      name: folderName,
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
    current_milestone_index: currentMilestoneIndex,
  };
}

export function updateSessionStatus(sessionId: string, status: 'active' | 'idle' | 'ended'): void {
  if (state.sessions[sessionId]) {
    state.sessions[sessionId].status = status;
    state.sessions[sessionId].last_active = new Date().toISOString();
    saveState();
  }
}
