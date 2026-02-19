interface MinimapStructure {
  name: string;
  x: number;
  z: number;
  placed: number;
  total: number;
}

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private readonly CANVAS_SIZE = 150;
  private readonly WORLD_SCALE = 120; // world units mapped to canvas width

  constructor() {
    this.injectStyles();

    this.container = document.createElement('div');
    this.container.className = 'pyr-minimap';

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.CANVAS_SIZE;
    this.canvas.height = this.CANVAS_SIZE;
    this.canvas.className = 'pyr-minimap-canvas';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from minimap canvas');
    }
    this.ctx = ctx;

    this.container.appendChild(this.canvas);
    document.body.appendChild(this.container);
  }

  update(pyramidProgress: number, structures: MinimapStructure[]): void {
    this.clear();
    this.drawStructures(structures, pyramidProgress);
  }

  private clear(): void {
    // Dark background with slight transparency
    this.ctx.fillStyle = 'rgba(20, 12, 8, 0.95)';
    this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
  }

  private drawStructures(structures: MinimapStructure[], pyramidProgress: number): void {
    const centerX = this.CANVAS_SIZE / 2;
    const centerY = this.CANVAS_SIZE / 2;
    const scale = this.CANVAS_SIZE / this.WORLD_SCALE;

    // Draw grid or background
    this.drawBackground(centerX, centerY, scale);

    // Draw all structures
    for (const structure of structures) {
      const isMain = structure.name === 'Great Pyramid';
      const canvasX = centerX + structure.x * scale;
      const canvasY = centerY + structure.z * scale;

      if (isMain) {
        // Main pyramid: large diamond/square, opacity based on progress
        this.drawMainPyramid(canvasX, canvasY, pyramidProgress);
      } else {
        // Other structures: small rectangles
        this.drawStructure(canvasX, canvasY, structure);
      }
    }

    // Draw center marker
    this.drawCenterMarker(centerX, centerY);

    // Draw labels
    this.drawLabels(structures, centerX, centerY, scale, pyramidProgress);
  }

  private drawBackground(centerX: number, centerY: number, scale: number): void {
    // Draw subtle grid lines for reference
    this.ctx.strokeStyle = 'rgba(201, 168, 76, 0.1)';
    this.ctx.lineWidth = 0.5;

    // Vertical lines
    for (let i = -3; i <= 3; i++) {
      const x = centerX + i * 20 * scale;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.CANVAS_SIZE);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let i = -3; i <= 3; i++) {
      const y = centerY + i * 20 * scale;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.CANVAS_SIZE, y);
      this.ctx.stroke();
    }
  }

  private drawMainPyramid(x: number, y: number, progress: number): void {
    const size = 16;
    const opacity = Math.min(1, 0.3 + progress * 0.7); // ranges from 0.3 to 1.0

    // Draw diamond shape (rotated square)
    this.ctx.fillStyle = `rgba(201, 168, 76, ${opacity})`;
    this.ctx.strokeStyle = `rgba(201, 168, 76, ${opacity * 0.8})`;
    this.ctx.lineWidth = 1.5;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x + size, y);
    this.ctx.lineTo(x, y + size);
    this.ctx.lineTo(x - size, y);
    this.ctx.closePath();

    this.ctx.fill();
    this.ctx.stroke();

    // Add inner diamond for depth
    this.ctx.fillStyle = `rgba(201, 168, 76, ${opacity * 0.5})`;
    const innerSize = size * 0.6;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - innerSize);
    this.ctx.lineTo(x + innerSize, y);
    this.ctx.lineTo(x, y + innerSize);
    this.ctx.lineTo(x - innerSize, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawStructure(x: number, y: number, structure: MinimapStructure): void {
    const width = 6;
    const height = 6;
    const isStarted = structure.placed > 0;
    const isComplete = structure.placed >= structure.total;

    if (isStarted || isComplete) {
      // Gold filled rectangle
      this.ctx.fillStyle = '#c9a84c';
    } else {
      // Gray outline rectangle if not started
      this.ctx.fillStyle = '#666666';
    }

    this.ctx.globalAlpha = isStarted ? 0.8 : 0.5;
    this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
    this.ctx.globalAlpha = 1;

    // Draw border
    this.ctx.strokeStyle = isStarted ? '#c9a84c' : '#999999';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - width / 2, y - height / 2, width, height);

    // If in progress (not complete), add a progress indicator
    if (isStarted && !isComplete) {
      const progress = structure.placed / structure.total;
      this.ctx.fillStyle = `rgba(201, 168, 76, 0.6)`;
      this.ctx.fillRect(x - width / 2, y + height / 2 - 1, width * progress, 1);
    }
  }

  private drawCenterMarker(centerX: number, centerY: number): void {
    // Small crosshair at origin
    this.ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
    this.ctx.lineWidth = 0.5;

    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 3, centerY);
    this.ctx.lineTo(centerX + 3, centerY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - 3);
    this.ctx.lineTo(centerX, centerY + 3);
    this.ctx.stroke();

    // Small circle at center
    this.ctx.fillStyle = 'rgba(201, 168, 76, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawLabels(structures: MinimapStructure[], centerX: number, centerY: number, scale: number, pyramidProgress: number): void {
    this.ctx.fillStyle = '#c9a84c';
    this.ctx.font = '9px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Label main pyramid with progress percentage
    const pyramidStructure = structures.find(s => s.name === 'Great Pyramid');
    if (pyramidStructure) {
      const x = centerX + pyramidStructure.x * scale;
      const y = centerY + pyramidStructure.z * scale;
      const progressPercent = Math.round(pyramidProgress * 100);
      this.ctx.fillText(`Pyramid ${progressPercent}%`, x, y + 28);
    }

    // Label other key structures
    const labeledStructures = ['Sphinx', 'Obelisk'];
    for (const structure of structures) {
      if (labeledStructures.includes(structure.name)) {
        const x = centerX + structure.x * scale;
        const y = centerY + structure.z * scale;
        this.ctx.fillStyle = 'rgba(201, 168, 76, 0.6)';
        this.ctx.font = '7px monospace';
        this.ctx.fillText(structure.name.slice(0, 3), x, y - 12);
      }
    }
  }

  private injectStyles(): void {
    if (document.getElementById('pyr-minimap-styles')) return;

    const style = document.createElement('style');
    style.id = 'pyr-minimap-styles';
    style.textContent = `
      .pyr-minimap {
        position: fixed;
        top: 10px;
        right: 336px;
        z-index: 1000;
        background: rgba(20, 12, 8, 0.8);
        border: 1px solid #c9a84c;
        border-radius: 4px;
        padding: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }

      .pyr-minimap-canvas {
        display: block;
        width: 150px;
        height: 150px;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
      }

      @media (max-width: 900px) {
        .pyr-minimap {
          right: 256px;
        }
      }

      @media (max-width: 600px) {
        .pyr-minimap {
          right: 216px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
