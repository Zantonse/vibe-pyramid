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
  { name: 'Sheathing in Limestone', xpThreshold: 10000, icon: '\u{1F3E6}' },
  { name: 'Inscribing the Ages', xpThreshold: 15000, icon: '\u{1F4DC}' },
  { name: 'Crown of Gold', xpThreshold: 20000, icon: '\u{1F451}' },
  { name: 'Raising the Obelisk', xpThreshold: 27500, icon: '\u{1F5FC}' },
  { name: 'Guardian of the Sands', xpThreshold: 37500, icon: '\u{1F981}' },
  { name: 'Path of the Gods', xpThreshold: 50000, icon: '\u{1F6E4}' },
  { name: 'Pyramid of the Queen', xpThreshold: 65000, icon: '\u{1F53A}' },
  { name: 'Solar Barque', xpThreshold: 85000, icon: '\u{26F5}' },
  { name: 'Step Pyramid of Djoser', xpThreshold: 110000, icon: '\u{1F3DB}' },
  { name: 'Mortuary Temple', xpThreshold: 140000, icon: '\u{26E9}' },
  { name: 'Mastaba Tomb', xpThreshold: 175000, icon: '\u{1F3DA}' },
  { name: 'Pylon Gate', xpThreshold: 215000, icon: '\u{1F3EF}' },
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
  // Level 6: Sheathing in Limestone — smooth white limestone
  { hue: 0.12, hueRange: 0.02, saturation: 0.15, saturationRange: 0.08, lightness: 0.85, lightnessRange: 0.05, roughness: 0.5, metalness: 0.1, emissiveIntensity: 0 },
  // Level 7: Inscribing the Ages — decorated warm stone
  { hue: 0.11, hueRange: 0.02, saturation: 0.25, saturationRange: 0.08, lightness: 0.75, lightnessRange: 0.06, roughness: 0.45, metalness: 0.15, emissiveIntensity: 0.05 },
  // Level 8: Crown of Gold — pure gold
  { hue: 0.13, hueRange: 0.015, saturation: 0.8, saturationRange: 0.08, lightness: 0.7, lightnessRange: 0.06, roughness: 0.2, metalness: 0.6, emissiveIntensity: 0.2 },
  // Level 9: Raising the Obelisk — red granite
  { hue: 0.02, hueRange: 0.02, saturation: 0.45, saturationRange: 0.1, lightness: 0.45, lightnessRange: 0.08, roughness: 0.35, metalness: 0.2, emissiveIntensity: 0.05 },
  // Level 10: Guardian of the Sands — desert amber
  { hue: 0.09, hueRange: 0.02, saturation: 0.55, saturationRange: 0.1, lightness: 0.6, lightnessRange: 0.08, roughness: 0.4, metalness: 0.1, emissiveIntensity: 0.08 },
  // Level 11: Path of the Gods — lapis lazuli blue
  { hue: 0.62, hueRange: 0.03, saturation: 0.6, saturationRange: 0.1, lightness: 0.4, lightnessRange: 0.08, roughness: 0.3, metalness: 0.25, emissiveIntensity: 0.1 },
  // Level 12: Pyramid of the Queen — rose quartz
  { hue: 0.95, hueRange: 0.02, saturation: 0.35, saturationRange: 0.08, lightness: 0.7, lightnessRange: 0.06, roughness: 0.3, metalness: 0.15, emissiveIntensity: 0.08 },
  // Level 13: Solar Barque — cedar wood brown
  { hue: 0.06, hueRange: 0.02, saturation: 0.5, saturationRange: 0.1, lightness: 0.4, lightnessRange: 0.08, roughness: 0.6, metalness: 0.05, emissiveIntensity: 0 },
  // Level 14: Step Pyramid of Djoser — ancient weathered stone
  { hue: 0.08, hueRange: 0.03, saturation: 0.2, saturationRange: 0.08, lightness: 0.6, lightnessRange: 0.1, roughness: 0.8, metalness: 0.05, emissiveIntensity: 0 },
  // Level 15: Mortuary Temple — polished basalt
  { hue: 0.55, hueRange: 0.04, saturation: 0.1, saturationRange: 0.05, lightness: 0.3, lightnessRange: 0.06, roughness: 0.25, metalness: 0.35, emissiveIntensity: 0.05 },
  // Level 16: Mastaba Tomb — warm adobe clay
  { hue: 0.05, hueRange: 0.02, saturation: 0.5, saturationRange: 0.1, lightness: 0.5, lightnessRange: 0.08, roughness: 0.7, metalness: 0, emissiveIntensity: 0 },
  // Level 17: Pylon Gate — turquoise faience
  { hue: 0.48, hueRange: 0.03, saturation: 0.7, saturationRange: 0.1, lightness: 0.55, lightnessRange: 0.08, roughness: 0.3, metalness: 0.2, emissiveIntensity: 0.12 },
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
