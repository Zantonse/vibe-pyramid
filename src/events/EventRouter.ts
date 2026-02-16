import { CharacterFactory } from '../characters/CharacterFactory.js';
import { PyramidBuilder } from '../pyramid/PyramidBuilder.js';
import { HUD } from '../hud/HUD.js';
import { TOOL_ACTIVITY_MAP, type WorkerActivity } from '../../shared/types.js';
import type { WSMessage, PyramidState } from '../../shared/types.js';

export class EventRouter {
  private characters: CharacterFactory;
  private pyramid: PyramidBuilder;
  private hud: HUD;

  constructor(characters: CharacterFactory, pyramid: PyramidBuilder, hud: HUD) {
    this.characters = characters;
    this.pyramid = pyramid;
    this.hud = hud;
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

    const activity: WorkerActivity = TOOL_ACTIVITY_MAP[tool] || 'idle';
    chars.worker.playAnimation(activity === 'carry' ? 'carry' : activity === 'chisel' ? 'chisel' : activity === 'survey' ? 'survey' : activity === 'antenna' ? 'antenna' : activity === 'portal' ? 'portal' : 'idle');

    chars.pharaoh.playAnimation('whip');

    this.pyramid.queueBlocks(blocksPlaced);

    this.hud.updateXP(totalXp, blocksPlaced, this.pyramid.totalSlots);
    const label = metadata.file || metadata.command || tool;
    this.hud.showActivityText(label, xpEarned);
  }

  private handleSessionUpdate(sessionId: string, status: string, name: string): void {
    if (status === 'ended') {
      const chars = this.characters.getOrCreate(sessionId);
      chars.worker.playAnimation('idle');
      chars.pharaoh.playAnimation('idle');
    } else {
      this.characters.getOrCreate(sessionId);
    }
    this.hud.updateSessionLabel(sessionId, name, status);
  }

  private handleStateSnapshot(state: PyramidState): void {
    this.pyramid.restoreBlocks(state.blocks_placed);
    this.hud.updateXP(state.total_xp, state.blocks_placed, this.pyramid.totalSlots);

    for (const [sessionId, sessionState] of Object.entries(state.sessions)) {
      if (sessionState.status !== 'ended') {
        this.characters.getOrCreate(sessionId);
      }
    }
  }
}
