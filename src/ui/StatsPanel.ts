export interface StructureProgress {
  placed: number;
  total: number;
}

export class StatsPanel {
  private panel: HTMLElement;
  private isVisible: boolean = false;
  private sessionStartTime: number;

  // Cached DOM elements for efficient updates
  private xpValueEl: HTMLElement;
  private uptimeValueEl: HTMLElement;
  private blocksValueEl: HTMLElement;
  private structureNameEl: HTMLElement;
  private progressValueEl: HTMLElement;
  private progressFillEl: HTMLElement;
  private progressSection: HTMLElement;
  private footerEl: HTMLElement;

  constructor() {
    this.sessionStartTime = Date.now();
    this.injectStyles();

    this.panel = document.createElement('div');
    this.panel.className = 'pyr-stats-panel';
    this.panel.style.display = 'none';

    const contentEl = document.createElement('div');
    contentEl.className = 'pyr-stats-content';

    // Build static structure once
    contentEl.appendChild(this.createHeader());
    const { section: xpSection, valueEl: xpVal } = this.createSection('Total XP');
    this.xpValueEl = xpVal;
    contentEl.appendChild(xpSection);

    const { section: uptimeSection, valueEl: uptimeVal } = this.createSection('Uptime');
    this.uptimeValueEl = uptimeVal;
    contentEl.appendChild(uptimeSection);

    const { section: blocksSection, valueEl: blocksVal } = this.createSection('Blocks Placed');
    this.blocksValueEl = blocksVal;
    contentEl.appendChild(blocksSection);

    const { section: structSection, valueEl: structVal } = this.createSection('Current Structure');
    this.structureNameEl = structVal;
    contentEl.appendChild(structSection);

    // Progress section with bar
    this.progressSection = document.createElement('div');
    this.progressSection.className = 'pyr-stats-section';
    const progressLabel = document.createElement('div');
    progressLabel.className = 'pyr-stats-label';
    progressLabel.textContent = 'Structure Progress';
    this.progressSection.appendChild(progressLabel);
    this.progressValueEl = document.createElement('div');
    this.progressValueEl.className = 'pyr-stats-value';
    this.progressSection.appendChild(this.progressValueEl);
    const progressBar = document.createElement('div');
    progressBar.className = 'pyr-stats-progress-bar';
    this.progressFillEl = document.createElement('div');
    this.progressFillEl.className = 'pyr-stats-progress-fill';
    progressBar.appendChild(this.progressFillEl);
    this.progressSection.appendChild(progressBar);
    contentEl.appendChild(this.progressSection);

    this.footerEl = document.createElement('div');
    this.footerEl.className = 'pyr-stats-footer';
    this.footerEl.textContent = 'Press Tab to toggle';
    contentEl.appendChild(this.footerEl);

    this.panel.appendChild(contentEl);
    document.body.appendChild(this.panel);
    this.attachKeyListener();
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'pyr-stats-header';
    const title = document.createElement('span');
    title.textContent = '\u2699 Session Stats';
    header.appendChild(title);
    return header;
  }

  private createSection(label: string): { section: HTMLElement; valueEl: HTMLElement } {
    const section = document.createElement('div');
    section.className = 'pyr-stats-section';
    const labelEl = document.createElement('div');
    labelEl.className = 'pyr-stats-label';
    labelEl.textContent = label;
    section.appendChild(labelEl);
    const valueEl = document.createElement('div');
    valueEl.className = 'pyr-stats-value';
    section.appendChild(valueEl);
    return { section, valueEl };
  }

  private attachKeyListener(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  private toggle(): void {
    this.isVisible = !this.isVisible;
    this.panel.style.display = this.isVisible ? 'block' : 'none';
  }

  update(
    totalXp: number,
    blocksPlaced: number,
    totalSlots: number,
    activeStructureName: string,
    activeStructureProgress: StructureProgress
  ): void {
    if (!this.isVisible) return;

    const uptimeSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const structurePercentage = activeStructureProgress.total > 0
      ? Math.round((activeStructureProgress.placed / activeStructureProgress.total) * 100)
      : 0;

    // Update text content only — no DOM creation
    this.xpValueEl.textContent = totalXp.toLocaleString();
    this.uptimeValueEl.textContent = this.formatTime(uptimeSeconds);
    this.blocksValueEl.textContent = `${blocksPlaced} / ${totalSlots}`;
    this.structureNameEl.textContent = activeStructureName || 'None';

    if (activeStructureProgress.total > 0) {
      this.progressSection.style.display = '';
      this.progressValueEl.textContent = `${activeStructureProgress.placed} / ${activeStructureProgress.total} (${structurePercentage}%)`;
      this.progressFillEl.style.width = `${structurePercentage}%`;
    } else {
      this.progressSection.style.display = 'none';
    }
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  private injectStyles(): void {
    if (document.getElementById('pyr-stats-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'pyr-stats-panel-styles';
    style.textContent = `
      .pyr-stats-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 12, 8, 0.92);
        border: 1px solid #c9a84c;
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        font-family: 'Courier New', monospace;
        color: #f5deb3;
        z-index: 2000;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      }

      .pyr-stats-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .pyr-stats-header {
        font-size: 18px;
        font-weight: bold;
        color: #ffd700;
        text-align: center;
        padding-bottom: 8px;
        border-bottom: 1px solid #c9a84c55;
        margin-bottom: 8px;
      }

      .pyr-stats-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .pyr-stats-label {
        font-size: 12px;
        color: #ffd700;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .pyr-stats-value {
        font-size: 16px;
        color: #f5deb3;
        font-weight: normal;
        word-break: break-word;
      }

      .pyr-stats-progress-bar {
        height: 8px;
        background: rgba(201, 168, 76, 0.15);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid #c9a84c33;
        margin-top: 4px;
      }

      .pyr-stats-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #c9a84c, #ffd700);
        transition: width 0.3s ease;
      }

      .pyr-stats-footer {
        font-size: 11px;
        color: #c9a84c88;
        text-align: center;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #c9a84c33;
      }
    `;
    document.head.appendChild(style);
  }
}
