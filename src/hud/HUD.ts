import { MILESTONES } from '../../shared/types.js';

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
  private totalSlots = 0;
  private currentMilestoneIndex = 0;
  private onLevelUpCallback: ((milestoneName: string) => void) | null = null;

  constructor() {
    this.createHUDContainer();
    this.statsBar = this.createStatsBar();
    this.progressBar = this.createProgressBar();
    this.container.appendChild(this.statsBar);
    this.container.appendChild(this.progressBar);
    this.ensureAnimationStyles();
  }

  onLevelUp(callback: (milestoneName: string) => void): void {
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
      `;
      document.head.appendChild(style);
    }
  }

  updateXP(totalXp: number, blocksPlaced: number, totalSlots: number): void {
    this.totalXp = totalXp;
    this.blocksPlaced = blocksPlaced;
    this.totalSlots = totalSlots;

    const newIndex = this.getMilestoneIndex(totalXp);
    const milestone = MILESTONES[newIndex];

    this.statsBar.textContent = `\u{1F3DB} ${milestone.name}  |  Blocks: ${blocksPlaced.toLocaleString()} / ${totalSlots.toLocaleString()}  |  XP: ${totalXp.toLocaleString()}`;

    const progress = totalSlots > 0 ? (blocksPlaced / totalSlots) * 100 : 0;
    const fillElement = this.progressBar.querySelector('div') as HTMLElement;
    if (fillElement) {
      fillElement.style.width = `${progress}%`;
    }

    if (newIndex > this.currentMilestoneIndex) {
      this.currentMilestoneIndex = newIndex;
      this.triggerLevelUp(milestone.name);
    } else if (newIndex > 0 && this.currentMilestoneIndex === 0) {
      this.currentMilestoneIndex = newIndex;
    }
  }

  private triggerLevelUp(milestoneName: string): void {
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
    floatingDiv.textContent = `\u{1F3DB} ${milestoneName}`;

    document.body.appendChild(floatingDiv);

    this.floatingTexts.push({
      element: floatingDiv,
      createdAt: performance.now(),
    });

    if (this.onLevelUpCallback) {
      this.onLevelUpCallback(milestoneName);
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

  update(delta: number): void {
    const now = performance.now();
    const maxAge = 2500;

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      const age = now - ft.createdAt;

      if (age >= maxAge) {
        if (ft.element.parentNode) {
          ft.element.parentNode.removeChild(ft.element);
        }
        this.floatingTexts.splice(i, 1);
      }
    }
  }
}
