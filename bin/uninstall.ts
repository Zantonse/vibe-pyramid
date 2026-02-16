import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.env.HOME || '~', '.claude', 'settings.json');
const HOOK_SCRIPT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'hooks', 'pyramid-hook.sh');

function uninstall(): void {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      console.log('No Claude settings file found. Nothing to uninstall.');
      return;
    }

    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    const hooks = settings.hooks as Record<string, unknown[]> | undefined;
    if (!hooks) {
      console.log('No hooks found in settings. Nothing to uninstall.');
      return;
    }

    for (const event of Object.keys(hooks)) {
      hooks[event] = (hooks[event] as Array<{ hooks?: Array<{ command?: string }> }>).filter(
        (entry) => !entry.hooks?.some((h) => h.command === HOOK_SCRIPT)
      );
      if ((hooks[event] as unknown[]).length === 0) {
        delete hooks[event];
      }
    }

    if (Object.keys(hooks).length === 0) {
      delete settings.hooks;
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('Pyramid hooks removed successfully.');
    console.log('Note: ~/.pyramid/ data preserved. Delete manually if desired.');
  } catch {
    console.error('Failed to uninstall hooks.');
  }
}

uninstall();
