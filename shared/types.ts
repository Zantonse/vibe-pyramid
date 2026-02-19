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

export const XP_PER_BLOCK = 5;

export interface Milestone {
  name: string;
  xpThreshold: number;
  icon: string;
}

export const MILESTONES: Milestone[] = [
  { name: 'Surveying the Sands', xpThreshold: 0, icon: '\u{1F3DC}' },
  { name: 'Laying Foundations', xpThreshold: 50, icon: '\u{1F9F1}' },
  { name: 'Rising Walls', xpThreshold: 500, icon: '\u{1F3D7}' },
  { name: 'Inner Chambers', xpThreshold: 2000, icon: '\u{1F3FA}' },
  { name: 'Gilding the Facade', xpThreshold: 5000, icon: '\u{2728}' },
  { name: 'Placing the Capstone', xpThreshold: 7500, icon: '\u{1F3DB}' },
];

export interface EraVisual {
  hue: number;
  hueRange: number;
  saturation: number;
  saturationRange: number;
  lightness: number;
  lightnessRange: number;
  roughness: number;
  metalness: number;
  emissiveIntensity: number;
}

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

export interface MilestoneUnlock {
  milestoneIndex: number;
  unlockedAt: string; // ISO 8601
}

export interface MilestoneBlockRange {
  milestoneIndex: number;
  startBlock: number;
  endBlock: number;
}

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
  | StateSnapshotMessage
  | MilestoneUnlockMessage;

export interface ToolActivityMessage {
  type: 'tool_activity';
  session_id: string;
  tool: string;
  xp_earned: number;
  total_xp: number;
  blocks_placed: number;
  current_milestone_index: number;
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

export interface MilestoneUnlockMessage {
  type: 'milestone_unlock';
  milestone_index: number;
  milestone_name: string;
  milestone_icon: string;
  unlocked_at: string;
  total_xp: number;
}

// Persisted state
export interface PyramidState {
  total_xp: number;
  blocks_placed: number;
  pyramid_layer: number;
  sessions: Record<string, SessionState>;
  milestone_unlocks: MilestoneUnlock[];
  milestone_block_ranges: MilestoneBlockRange[];
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
