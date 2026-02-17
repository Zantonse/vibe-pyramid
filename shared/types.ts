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

export interface MilestoneUnlock {
  milestoneIndex: number;
  unlockedAt: string; // ISO 8601
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
