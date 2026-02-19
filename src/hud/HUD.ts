import { MILESTONES } from '../../shared/types.js';
import type { BuildManager } from '../structures/BuildManager.js';

interface FloatingTextElement {
  element: HTMLElement;
  createdAt: number;
}

export class HUD {
  private container!: HTMLElement;
  private statsBar!: HTMLElement;
  private progressBar!: HTMLElement;
  private floatingTexts: FloatingTextElement[] = [];
  private totalXp = 0;
  private blocksPlaced = 0;
  private currentMilestoneIndex = 0;
  private onLevelUpCallback: ((milestoneName: string, milestoneIndex: number) => void) | null = null;

  constructor() {
    this.createHUDContainer();
    this.statsBar = this.createStatsBar();
    this.progressBar = this.createProgressBar();
    this.container.appendChild(this.statsBar);
    this.container.appendChild(this.progressBar);
    this.ensureAnimationStyles();
  }

  onLevelUp(callback: (milestoneName: string, milestoneIndex: number) => void): void {
    this.onLevelUpCallback = callback;
  }

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

  private createHUDContainer(): void {
    const existing = document.getElementById('pyr-hud');
    if (existing) {
      existing.remove();
    }

    this.container = document.createElement('div');
    this.container.id = 'pyr-hud';
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 320px;
      transition: right 0.3s ease;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;
      gap: 8px;
      font-family: monospace;
    `;
    document.body.appendChild(this.container);
  }

  private createStatsBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.style.cssText = `
      background: rgba(62, 39, 35, 0.85);
      backdrop-filter: blur(8px);
      padding: 12px 16px;
      border-radius: 6px;
      color: #f5deb3;
      font-size: 14px;
      font-weight: bold;
      border: 1px solid rgba(201, 168, 76, 0.3);
      min-width: 300px;
    `;
    bar.textContent = 'Blocks: 0 / 0  |  XP: 0';
    return bar;
  }

  private createProgressBar(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      height: 6px;
      background: rgba(62, 39, 35, 0.6);
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid rgba(201, 168, 76, 0.3);
    `;

    const fill = document.createElement('div');
    fill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #c9a84c, #ffd700, #c9a84c);
      width: 0%;
      transition: width 0.3s ease;
    `;
    container.appendChild(fill);
    return container;
  }

  private ensureAnimationStyles(): void {
    if (!document.getElementById('hud-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'hud-animation-styles';
      style.textContent = `
        @keyframes hudFloatUp {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-60px);
          }
        }
        @keyframes pyrHudShimmer {
          0% { border-color: rgba(255, 215, 0, 0.8); box-shadow: 0 0 12px rgba(255, 215, 0, 0.4); }
          100% { border-color: rgba(201, 168, 76, 0.3); box-shadow: none; }
        }
        .pyr-hud-shimmer {
          animation: pyrHudShimmer 1.5s ease-out forwards;
        }
        @media (max-width: 900px) {
          #pyr-hud { right: 240px; }
        }
        @media (max-width: 600px) {
          #pyr-hud { right: 200px; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  updateXP(totalXp: number, blocksPlaced: number, buildManager: BuildManager): void {
    this.totalXp = totalXp;
    this.blocksPlaced = blocksPlaced;

    const newIndex = this.getMilestoneIndex(totalXp);
    const milestone = MILESTONES[newIndex];
    const nextMilestone = MILESTONES[newIndex + 1];

    let xpText: string;
    if (nextMilestone) {
      xpText = `XP: ${totalXp.toLocaleString()} / ${nextMilestone.xpThreshold.toLocaleString()} → ${nextMilestone.icon} ${nextMilestone.name}`;
    } else {
      xpText = `XP: ${totalXp.toLocaleString()} (MAX)`;
    }

    const progressInfo = buildManager.activeStructureProgress;
    const structureName = buildManager.activeStructureName;
    const structureIcon = buildManager.activeStructureIcon;
    const structureText = progressInfo.placed >= progressInfo.total
      ? `${structureIcon} ${structureName} \u2713`
      : `${structureIcon} ${structureName}: ${progressInfo.placed.toLocaleString()} / ${progressInfo.total.toLocaleString()}`;
    this.statsBar.textContent = `${milestone.icon} ${milestone.name}  |  ${structureText}  |  ${xpText}`;

    let progress = 0;
    if (nextMilestone) {
      const currentThreshold = milestone.xpThreshold;
      const nextThreshold = nextMilestone.xpThreshold;
      const xpIntoLevel = totalXp - currentThreshold;
      const xpNeeded = nextThreshold - currentThreshold;
      progress = xpIntoLevel > 0 && xpNeeded > 0
        ? (xpIntoLevel / xpNeeded) * 100
        : 0;
    } else {
      progress = 100;
    }

    const fillElement = this.progressBar.querySelector('div') as HTMLElement;
    if (fillElement) {
      fillElement.style.width = `${Math.min(progress, 100)}%`;
    }

    if (newIndex > this.currentMilestoneIndex) {
      this.currentMilestoneIndex = newIndex;
      this.triggerLevelUp(milestone.name, milestone.icon);
    } else if (newIndex > 0 && this.currentMilestoneIndex === 0) {
      this.currentMilestoneIndex = newIndex;
    }
  }

  private triggerLevelUp(milestoneName: string, icon: string): void {
    this.statsBar.classList.remove('pyr-hud-shimmer');
    void this.statsBar.offsetWidth;
    this.statsBar.classList.add('pyr-hud-shimmer');

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
    floatingDiv.textContent = `${icon} ${milestoneName}`;

    document.body.appendChild(floatingDiv);

    this.floatingTexts.push({
      element: floatingDiv,
      createdAt: performance.now(),
    });

    if (this.onLevelUpCallback) {
      this.onLevelUpCallback(milestoneName, this.currentMilestoneIndex);
    }
  }

  showActivityText(label: string, xpEarned: number): void {
    const text = `+${xpEarned} XP  ${label}`;

    const floatingDiv = document.createElement('div');
    floatingDiv.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffd700;
      font-size: 18px;
      font-weight: bold;
      font-family: monospace;
      white-space: nowrap;
      pointer-events: none;
      text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
      animation: hudFloatUp 2s ease-out forwards;
    `;
    floatingDiv.textContent = text;

    document.body.appendChild(floatingDiv);

    const now = performance.now();
    this.floatingTexts.push({
      element: floatingDiv,
      createdAt: now,
    });
  }

  updateSessionLabel(sessionId: string, name: string, status: string): void {
    console.log(`Session ${name} (${sessionId.slice(0, 8)}): ${status}`);
  }

  update(_delta: number): void {
    const now = performance.now();
    const maxAge = 2500;

    let writeIdx = 0;
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (now - ft.createdAt >= maxAge) {
        ft.element.remove();
      } else {
        this.floatingTexts[writeIdx++] = ft;
      }
    }
    this.floatingTexts.length = writeIdx;
  }
}
