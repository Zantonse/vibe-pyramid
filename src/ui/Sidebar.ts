import type { WorkerActivity } from '../../shared/types.js';
import type { MilestoneUnlock } from '../../shared/types.js';
import { MILESTONES } from '../../shared/types.js';

const ACTIVITY_COLORS: Record<WorkerActivity, string> = {
  survey: '#4fc3f7',
  carry: '#ffb74d',
  chisel: '#ce93d8',
  antenna: '#4dd0e1',
  portal: '#81c784',
  idle: '#90a4ae',
};

const ACTIVITY_ICONS: Record<WorkerActivity, string> = {
  survey: '\u{1F4DC}',  // scroll
  carry: '\u{1F9F1}',   // brick
  chisel: '\u{1F528}',  // hammer
  antenna: '\u{1F4E1}', // satellite antenna
  portal: '\u{1FA84}',  // magic wand
  idle: '\u{1F3DB}',    // classical building
};

interface TaskEntry {
  tool: string;
  activity: WorkerActivity;
  xp: number;
  label: string;
  time: string;
}

interface SessionEntry {
  name: string;
  status: string;
  xp: number;
  tasks: TaskEntry[];
  el: HTMLElement;
  listEl: HTMLElement;
  badgeEl: HTMLElement;
  statusEl: HTMLElement;
  nameEl: HTMLElement;
  expanded: boolean;
}

export class Sidebar {
  private container: HTMLElement;
  private sessionsMap: Map<string, SessionEntry> = new Map();
  private listEl: HTMLElement;
  private achievementsEl!: HTMLElement;
  private unlockedIndices: Set<number> = new Set();

  constructor() {
    this.injectStyles();
    this.container = document.createElement('div');
    this.container.className = 'pyr-sidebar';

    const header = document.createElement('div');
    header.className = 'pyr-sidebar-header';

    const title = document.createElement('span');
    title.className = 'pyr-sidebar-title';
    title.textContent = '\u{1F3FA} Sessions';
    header.appendChild(title);

    const toggle = document.createElement('button');
    toggle.className = 'pyr-sidebar-toggle';
    toggle.textContent = '\u{25C0}';
    toggle.addEventListener('click', () => {
      this.container.classList.toggle('pyr-sidebar--collapsed');
      toggle.textContent = this.container.classList.contains('pyr-sidebar--collapsed') ? '\u{25B6}' : '\u{25C0}';
    });
    header.appendChild(toggle);

    this.container.appendChild(header);

    this.listEl = document.createElement('div');
    this.listEl.className = 'pyr-sidebar-list';
    this.container.appendChild(this.listEl);

    this.achievementsEl = document.createElement('div');
    this.achievementsEl.className = 'pyr-achievements';
    this.achievementsEl.style.display = 'none';
    this.container.insertBefore(this.achievementsEl, this.listEl);

    document.body.appendChild(this.container);
  }

  addTask(
    sessionId: string,
    tool: string,
    activity: WorkerActivity,
    xp: number,
    metadata: { file?: string; command?: string }
  ): void {
    const session = this.ensureSession(sessionId);
    const label = metadata.file || metadata.command || tool;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const task: TaskEntry = { tool, activity, xp, label, time };
    session.tasks.unshift(task);
    if (session.tasks.length > 50) session.tasks.pop();

    session.xp += xp;
    session.badgeEl.textContent = String(session.xp) + ' XP';

    // Build the task DOM element
    const taskEl = document.createElement('div');
    taskEl.className = 'pyr-task';

    const badge = document.createElement('span');
    badge.className = 'pyr-task-badge';
    badge.style.backgroundColor = ACTIVITY_COLORS[activity];
    badge.textContent = ACTIVITY_ICONS[activity] + ' ' + activity;
    taskEl.appendChild(badge);

    const labelEl = document.createElement('span');
    labelEl.className = 'pyr-task-label';
    labelEl.textContent = label;
    taskEl.appendChild(labelEl);

    const xpEl = document.createElement('span');
    xpEl.className = 'pyr-task-xp';
    xpEl.textContent = '+' + xp;
    taskEl.appendChild(xpEl);

    const timeEl = document.createElement('span');
    timeEl.className = 'pyr-task-time';
    timeEl.textContent = time;
    taskEl.appendChild(timeEl);

    // Insert at top
    if (session.listEl.firstChild) {
      session.listEl.insertBefore(taskEl, session.listEl.firstChild);
    } else {
      session.listEl.appendChild(taskEl);
    }

    // Flash effect
    session.el.classList.remove('pyr-session--flash');
    void session.el.offsetWidth; // force reflow
    session.el.classList.add('pyr-session--flash');
  }

  updateSession(sessionId: string, name: string, status: string): void {
    const session = this.ensureSession(sessionId);
    session.name = name;
    session.status = status;
    session.nameEl.textContent = name || sessionId.slice(0, 8);
    session.statusEl.className = 'pyr-session-status pyr-status--' + status;
  }

  addMilestoneUnlock(milestoneIndex: number, unlockedAt: string): void {
    if (this.unlockedIndices.has(milestoneIndex)) return;
    this.unlockedIndices.add(milestoneIndex);

    const milestone = MILESTONES[milestoneIndex];
    if (!milestone) return;

    this.achievementsEl.style.display = 'block';

    const entry = document.createElement('div');
    entry.className = 'pyr-achievement';
    entry.setAttribute('data-idx', String(milestoneIndex));

    const icon = document.createElement('span');
    icon.className = 'pyr-achievement-icon';
    icon.textContent = milestone.icon;
    entry.appendChild(icon);

    const info = document.createElement('div');
    info.className = 'pyr-achievement-info';

    const name = document.createElement('div');
    name.className = 'pyr-achievement-name';
    name.textContent = milestone.name;
    info.appendChild(name);

    const time = document.createElement('div');
    time.className = 'pyr-achievement-time';
    const date = new Date(unlockedAt);
    time.textContent = date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    info.appendChild(time);

    entry.appendChild(info);

    const xpBadge = document.createElement('span');
    xpBadge.className = 'pyr-achievement-xp';
    xpBadge.textContent = milestone.xpThreshold.toLocaleString() + ' XP';
    entry.appendChild(xpBadge);

    // Insert sorted by milestone index (highest at top)
    const existingEntries = this.achievementsEl.querySelectorAll('.pyr-achievement');
    let inserted = false;
    for (const existing of existingEntries) {
      const existingIdx = parseInt(existing.getAttribute('data-idx') || '0', 10);
      if (milestoneIndex > existingIdx) {
        this.achievementsEl.insertBefore(entry, existing);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.achievementsEl.appendChild(entry);
    }
  }

  private ensureSession(sessionId: string): SessionEntry {
    if (this.sessionsMap.has(sessionId)) {
      return this.sessionsMap.get(sessionId)!;
    }

    const el = document.createElement('div');
    el.className = 'pyr-session';

    const headerRow = document.createElement('div');
    headerRow.className = 'pyr-session-header';

    const statusEl = document.createElement('span');
    statusEl.className = 'pyr-session-status pyr-status--active';
    headerRow.appendChild(statusEl);

    const nameEl = document.createElement('span');
    nameEl.className = 'pyr-session-name';
    nameEl.textContent = sessionId.slice(0, 8);
    headerRow.appendChild(nameEl);

    const badgeEl = document.createElement('span');
    badgeEl.className = 'pyr-session-xp';
    badgeEl.textContent = '0 XP';
    headerRow.appendChild(badgeEl);

    const arrow = document.createElement('span');
    arrow.className = 'pyr-session-arrow';
    arrow.textContent = '\u{25B8}';
    headerRow.appendChild(arrow);

    el.appendChild(headerRow);

    const listEl = document.createElement('div');
    listEl.className = 'pyr-task-list';
    listEl.style.display = 'none';
    el.appendChild(listEl);

    headerRow.addEventListener('click', () => {
      const entry = this.sessionsMap.get(sessionId)!;
      entry.expanded = !entry.expanded;
      listEl.style.display = entry.expanded ? 'block' : 'none';
      arrow.textContent = entry.expanded ? '\u{25BE}' : '\u{25B8}';
    });

    this.listEl.appendChild(el);

    const entry: SessionEntry = {
      name: sessionId.slice(0, 8),
      status: 'active',
      xp: 0,
      tasks: [],
      el,
      listEl,
      badgeEl,
      statusEl,
      nameEl,
      expanded: false,
    };

    this.sessionsMap.set(sessionId, entry);
    return entry;
  }

  private injectStyles(): void {
    if (document.getElementById('pyr-sidebar-styles')) return;
    const style = document.createElement('style');
    style.id = 'pyr-sidebar-styles';
    style.textContent = `
      .pyr-sidebar {
        position: fixed;
        top: 0;
        right: 0;
        width: 320px;
        height: 100vh;
        background: rgba(20, 15, 10, 0.92);
        border-left: 2px solid #c9a84c;
        color: #e8d5a3;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 13px;
        overflow-y: auto;
        z-index: 1000;
        transition: transform 0.3s ease;
        display: flex;
        flex-direction: column;
      }
      .pyr-sidebar--collapsed {
        transform: translateX(280px);
      }
      .pyr-sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        border-bottom: 1px solid #c9a84c55;
        flex-shrink: 0;
      }
      .pyr-sidebar-title {
        font-size: 16px;
        font-weight: 700;
        color: #c9a84c;
      }
      .pyr-sidebar-toggle {
        background: none;
        border: 1px solid #c9a84c55;
        color: #c9a84c;
        cursor: pointer;
        font-size: 14px;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .pyr-sidebar-toggle:hover {
        background: #c9a84c22;
      }
      .pyr-sidebar-list {
        flex: 1;
        overflow-y: auto;
        padding: 6px 0;
      }
      .pyr-session {
        border-bottom: 1px solid #c9a84c22;
      }
      .pyr-session--flash {
        animation: pyr-flash 0.6s ease;
      }
      @keyframes pyr-flash {
        0% { background: #c9a84c33; }
        100% { background: transparent; }
      }
      .pyr-session-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        cursor: pointer;
        user-select: none;
      }
      .pyr-session-header:hover {
        background: #c9a84c15;
      }
      .pyr-session-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .pyr-status--active { background: #66bb6a; }
      .pyr-status--idle { background: #ffa726; }
      .pyr-status--ended { background: #666; }
      .pyr-session-name {
        flex: 1;
        font-weight: 600;
        color: #e8d5a3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pyr-session-xp {
        font-size: 11px;
        background: #c9a84c33;
        color: #c9a84c;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 600;
        flex-shrink: 0;
      }
      .pyr-session-arrow {
        color: #c9a84c88;
        flex-shrink: 0;
        font-size: 12px;
        width: 12px;
        text-align: center;
      }
      .pyr-task-list {
        padding: 0 14px 8px 30px;
      }
      .pyr-task {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 0;
        border-bottom: 1px solid #ffffff08;
        flex-wrap: wrap;
      }
      .pyr-task-badge {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 3px;
        color: #000;
        font-weight: 700;
        flex-shrink: 0;
      }
      .pyr-task-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        color: #bbb;
        min-width: 60px;
      }
      .pyr-task-xp {
        color: #c9a84c;
        font-weight: 600;
        font-size: 11px;
        flex-shrink: 0;
      }
      .pyr-task-time {
        color: #666;
        font-size: 10px;
        flex-shrink: 0;
      }
      .pyr-achievements {
        padding: 8px 14px;
        border-bottom: 1px solid #c9a84c55;
      }
      .pyr-achievement {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid #ffffff08;
      }
      .pyr-achievement-icon {
        font-size: 20px;
        flex-shrink: 0;
        width: 28px;
        text-align: center;
      }
      .pyr-achievement-info {
        flex: 1;
        min-width: 0;
      }
      .pyr-achievement-name {
        font-weight: 600;
        color: #ffd700;
        font-size: 12px;
      }
      .pyr-achievement-time {
        color: #888;
        font-size: 10px;
      }
      .pyr-achievement-xp {
        font-size: 10px;
        color: #c9a84c;
        background: #c9a84c22;
        padding: 2px 6px;
        border-radius: 3px;
        flex-shrink: 0;
      }
      @media (max-width: 900px) {
        .pyr-sidebar {
          width: 240px;
        }
        .pyr-sidebar--collapsed {
          transform: translateX(200px);
        }
      }
      @media (max-width: 600px) {
        .pyr-sidebar {
          width: 200px;
        }
        .pyr-sidebar--collapsed {
          transform: translateX(160px);
        }
      }
    `;
    document.head.appendChild(style);
  }
}
