import fs from 'fs';
import path from 'path';

const CLAUDE_SETTINGS_DIR = path.join(process.env.HOME || '~', '.claude');
const SETTINGS_FILE = path.join(CLAUDE_SETTINGS_DIR, 'settings.json');
const PYRAMID_DIR = path.join(process.env.HOME || '~', '.pyramid');

const HOOK_SCRIPT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'hooks', 'pyramid-hook.sh');

const HOOK_EVENTS = [
  'PostToolUse',
  'SessionStart',
  'SessionEnd',
  'SubagentStart',
  'SubagentStop',
];

function setup(): void {
  if (!fs.existsSync(PYRAMID_DIR)) {
    fs.mkdirSync(PYRAMID_DIR, { recursive: true });
  }

  fs.chmodSync(HOOK_SCRIPT, 0o755);

  let settings: Record<string, unknown> = {};
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {
    settings = {};
  }

  const hooks: Record<string, unknown[]> = (settings.hooks as Record<string, unknown[]>) || {};

  for (const event of HOOK_EVENTS) {
    const hookEntry = {
      matcher: event === 'SessionStart' || event === 'SessionEnd' ? undefined : '*',
      hooks: [
        {
          type: 'command',
          command: HOOK_SCRIPT,
          timeout: 5,
        },
      ],
    };

    if (!hooks[event]) {
      hooks[event] = [];
    }

    const existing = hooks[event] as Array<{ hooks?: Array<{ command?: string }> }>;
    const alreadyInstalled = existing.some(
      (entry) => entry.hooks?.some((h) => h.command === HOOK_SCRIPT)
    );
    if (!alreadyInstalled) {
      hooks[event].push(hookEntry);
    }
  }

  settings.hooks = hooks;

  if (!fs.existsSync(CLAUDE_SETTINGS_DIR)) {
    fs.mkdirSync(CLAUDE_SETTINGS_DIR, { recursive: true });
  }

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

  console.log('Pyramid hooks installed successfully.');
  console.log(`Hook script: ${HOOK_SCRIPT}`);
  console.log(`Settings updated: ${SETTINGS_FILE}`);
  console.log(`Data directory: ${PYRAMID_DIR}`);
}

setup();
