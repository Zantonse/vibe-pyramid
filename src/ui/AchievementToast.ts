/**
 * AchievementToast
 *
 * Displays popup notifications in the top-right corner when milestones are unlocked.
 * Features a queue system to display multiple toasts sequentially.
 */

interface ToastItem {
  icon: string;
  name: string;
}

export class AchievementToast {
  private container: HTMLElement;
  private queue: ToastItem[] = [];
  private isDisplaying = false;

  constructor() {
    this.injectStyles();
    this.container = document.createElement('div');
    this.container.className = 'pyr-toast-container';
    document.body.appendChild(this.container);
  }

  /**
   * Display a toast notification, queuing if one is currently showing.
   * @param icon Emoji or character to display
   * @param name Milestone name
   */
  show(icon: string, name: string): void {
    this.queue.push({ icon, name });
    this.processQueue();
  }

  private processQueue(): void {
    if (this.isDisplaying || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift()!;
    this.isDisplaying = true;
    this.displayToast(item.icon, item.name);
  }

  private displayToast(icon: string, name: string): void {
    const toast = document.createElement('div');
    toast.className = 'pyr-toast pyr-toast--slide-in';

    // Header with "UNLOCKED" label
    const header = document.createElement('div');
    header.className = 'pyr-toast-header';

    const unlockedLabel = document.createElement('span');
    unlockedLabel.className = 'pyr-toast-label';
    unlockedLabel.textContent = 'UNLOCKED';
    header.appendChild(unlockedLabel);

    toast.appendChild(header);

    // Content: icon + name
    const content = document.createElement('div');
    content.className = 'pyr-toast-content';

    const iconEl = document.createElement('span');
    iconEl.className = 'pyr-toast-icon';
    iconEl.textContent = icon;
    content.appendChild(iconEl);

    const nameEl = document.createElement('span');
    nameEl.className = 'pyr-toast-name';
    nameEl.textContent = name;
    content.appendChild(nameEl);

    toast.appendChild(content);

    this.container.appendChild(toast);

    // Trigger slide-in animation
    void toast.offsetWidth; // force reflow
    toast.classList.remove('pyr-toast--slide-in');

    // Auto-dismiss after 5 seconds
    const dismissTimeout = setTimeout(() => {
      this.dismissToast(toast);
    }, 5000);

    // Store timeout reference for manual cleanup if needed
    (toast as any)._dismissTimeout = dismissTimeout;
  }

  private dismissToast(toast: HTMLElement): void {
    // Add fade-out class and remove after animation
    toast.classList.add('pyr-toast--fade-out');

    const animationEndHandler = () => {
      toast.removeEventListener('animationend', animationEndHandler);
      if (toast.parentElement === this.container) {
        this.container.removeChild(toast);
      }
      this.isDisplaying = false;
      this.processQueue();
    };

    toast.addEventListener('animationend', animationEndHandler);

    // Fallback: if animation doesn't fire, clean up anyway
    const fallbackTimeout = setTimeout(() => {
      if (toast.parentElement === this.container) {
        this.container.removeChild(toast);
      }
      this.isDisplaying = false;
      this.processQueue();
    }, 500);

    (toast as any)._fallbackTimeout = fallbackTimeout;
  }

  private injectStyles(): void {
    if (document.getElementById('pyr-toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'pyr-toast-styles';
    style.textContent = `
      .pyr-toast-container {
        position: fixed;
        top: 20px;
        right: 340px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }

      .pyr-toast {
        background: rgba(62, 39, 35, 0.9);
        border: 1px solid #c9a84c;
        border-radius: 4px;
        padding: 12px 14px;
        color: #e8d5a3;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        pointer-events: auto;
        transform: translateX(100px);
        opacity: 1;
        transition: transform 0.3s ease, opacity 0.3s ease;
      }

      .pyr-toast--slide-in {
        transform: translateX(100px);
        opacity: 0;
      }

      .pyr-toast--fade-out {
        transform: translateX(0);
        opacity: 0;
      }

      .pyr-toast-header {
        display: flex;
        justify-content: center;
        margin-bottom: 8px;
        border-bottom: 1px solid #c9a84c66;
        padding-bottom: 6px;
      }

      .pyr-toast-label {
        font-size: 11px;
        font-weight: 700;
        color: #c9a84c;
        letter-spacing: 1px;
      }

      .pyr-toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
      }

      .pyr-toast-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .pyr-toast-name {
        color: #ffd700;
        font-weight: 600;
        font-size: 14px;
      }

      @keyframes pyr-toast-slide-in {
        from {
          transform: translateX(100px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes pyr-toast-fade-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(0);
          opacity: 0;
        }
      }

      /* Responsive: adjust right position for smaller screens */
      @media (max-width: 1200px) {
        .pyr-toast-container {
          right: 280px;
        }
      }

      @media (max-width: 900px) {
        .pyr-toast-container {
          right: 260px;
        }
      }

      @media (max-width: 600px) {
        .pyr-toast-container {
          right: 20px;
          left: 20px;
          top: 60px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
