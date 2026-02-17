import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { loadState, getState, processToolEvent, updateSessionStatus } from './state.js';
import type { HookEvent, WSMessage, ToolActivityMessage, SessionUpdateMessage, StateSnapshotMessage, MilestoneUnlockMessage } from '../shared/types.js';
import { MILESTONES } from '../shared/types.js';

const PORT = parseInt(process.env.PYRAMID_PORT || '4200', 10);

const app = express();
app.use(express.json());

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  const snapshot: StateSnapshotMessage = { type: 'state_snapshot', state: getState() };
  ws.send(JSON.stringify(snapshot));
  ws.on('close', () => clients.delete(ws));
});

function broadcast(msg: WSMessage): void {
  const data = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

app.post('/event', (req, res) => {
  const event = req.body as HookEvent;

  if (!event.hook_event_name || !event.session_id) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (event.hook_event_name === 'PostToolUse' && event.tool_name) {
    const file = typeof event.tool_input?.file_path === 'string' ? event.tool_input.file_path : undefined;
    const command = typeof event.tool_input?.command === 'string' ? event.tool_input.command : undefined;

    const result = processToolEvent(event.session_id, event.tool_name, { file, command });

    const msg: ToolActivityMessage = {
      type: 'tool_activity',
      session_id: event.session_id,
      tool: event.tool_name,
      xp_earned: result.xp_earned,
      total_xp: result.total_xp,
      blocks_placed: result.blocks_placed,
      metadata: { file, command },
    };
    broadcast(msg);

    if (result.new_milestone_index !== null) {
      const milestone = MILESTONES[result.new_milestone_index];
      const milestoneMsg: MilestoneUnlockMessage = {
        type: 'milestone_unlock',
        milestone_index: result.new_milestone_index,
        milestone_name: milestone.name,
        milestone_icon: milestone.icon,
        unlocked_at: new Date().toISOString(),
        total_xp: result.total_xp,
      };
      broadcast(milestoneMsg);
    }
  }

  if (event.hook_event_name === 'SessionStart') {
    const msg: SessionUpdateMessage = {
      type: 'session_update',
      session_id: event.session_id,
      status: 'active',
      name: event.session_id.slice(0, 8),
    };
    broadcast(msg);
  }

  if (event.hook_event_name === 'SessionEnd') {
    updateSessionStatus(event.session_id, 'ended');
    const msg: SessionUpdateMessage = {
      type: 'session_update',
      session_id: event.session_id,
      status: 'ended',
      name: event.session_id.slice(0, 8),
    };
    broadcast(msg);
  }

  res.json({ ok: true });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', state: getState() });
});

loadState();
httpServer.listen(PORT, () => {
  console.log(`Pyramid server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});
