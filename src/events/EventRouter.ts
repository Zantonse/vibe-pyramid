import { CharacterFactory } from '../characters/CharacterFactory.js';
import { PyramidBuilder } from '../pyramid/PyramidBuilder.js';
import { HUD } from '../hud/HUD.js';
import { Sidebar } from '../ui/Sidebar.js';
import { SceneManager } from '../scene/SceneManager.js';
import { TOOL_ACTIVITY_MAP, type WorkerActivity } from '../../shared/types.js';
import type { WSMessage, PyramidState } from '../../shared/types.js';

export class EventRouter {
  private characters: CharacterFactory;
  private pyramid: PyramidBuilder;
  private hud: HUD;
  private sidebar: Sidebar;
  private sceneManager: SceneManager;

  constructor(characters: CharacterFactory, pyramid: PyramidBuilder, hud: HUD, sidebar: Sidebar, sceneManager: SceneManager) {
    this.characters = characters;
    this.pyramid = pyramid;
    this.hud = hud;
    this.sidebar = sidebar;
    this.sceneManager = sceneManager;
  }

  handle(msg: WSMessage): void {
    switch (msg.type) {
      case 'tool_activity':
        this.handleToolActivity(msg.session_id, msg.tool, msg.xp_earned, msg.total_xp, msg.blocks_placed, msg.metadata);
        break;
      case 'session_update':
        this.handleSessionUpdate(msg.session_id, msg.status, msg.name);
        break;
      case 'state_snapshot':
        this.handleStateSnapshot(msg.state);
        break;
      case 'milestone_unlock':
        this.sidebar.addMilestoneUnlock(msg.milestone_index, msg.unlocked_at);
        break;
    }
  }

  private handleToolActivity(
    sessionId: string,
    tool: string,
    xpEarned: number,
    totalXp: number,
    blocksPlaced: number,
    metadata: { file?: string; command?: string }
  ): void {
    const chars = this.characters.getOrCreate(sessionId);

    // Determine activity from tool and drive movement
    const activity: WorkerActivity = TOOL_ACTIVITY_MAP[tool] || 'idle';

    if (activity !== 'idle') {
      chars.controller.setActivity(activity);
      this.sidebar.addTask(sessionId, tool, activity, xpEarned, metadata);
      // Nudge camera toward active worker
      const workerPos = chars.worker.mesh.position;
      this.sceneManager.nudgeTo(workerPos);
    }

    // Queue blocks on the pyramid
    this.pyramid.queueBlocks(blocksPlaced);

    // Update HUD
    this.hud.updateXP(totalXp, blocksPlaced, this.pyramid.totalSlots);

    if (activity !== 'idle') {
      const label = metadata.file || metadata.command || tool;
      this.hud.showActivityText(label, xpEarned);
    }
  }

  private handleSessionUpdate(sessionId: string, status: string, name: string): void {
    if (status === 'ended') {
      const chars = this.characters.getOrCreate(sessionId);
      chars.controller.setActivity('idle');
    } else {
      this.characters.getOrCreate(sessionId);
    }
    this.hud.updateSessionLabel(sessionId, name, status);
    this.sidebar.updateSession(sessionId, name, status);
  }

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
}
