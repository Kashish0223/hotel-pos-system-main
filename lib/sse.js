// lib/sse.js
export function broadcast(eventName, data) {
  if (!globalThis.sseClients) return;
  const message = `event: ${eventName}\n` +
                  `data: ${JSON.stringify(data)}\n\n`;
  for (const client of globalThis.sseClients) {
    try { client.send(message); } catch {}
  }
}