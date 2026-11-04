// lib/events.js

export function emitEvent(type, payload = {}) {
  try {
    const clients = (globalThis.sseClients = globalThis.sseClients || new Set());
    const message = `event: ${type}\n` + `data: ${JSON.stringify(payload)}\n\n`;
    for (const c of clients) {
      try {
        c.send(message); // ← YES: c.send(), NOT c.write()
        // console.log("Update event sent:", message); // Debug
      } catch (e) {
        console.error("e----------", e);
      }
    }
  } catch (e) {
    console.error("emitEvent error", e);
  }
}

export function emitSoundEvent(payload = {}) {
  try {
    const clients = (globalThis.sseClients = globalThis.sseClients || new Set());
    const message = `event: orders:sound1\n` + `data: ${JSON.stringify(payload)}\n\n`;
    for (const c of clients) {
      try {
        c.send(message); // ← YES: c.send(), NOT c.write()
        // console.log("Sound event sent:", message); // Debug
      } catch (e) {
        console.error("e----------", e);
      }
    }
  } catch (e) {
    console.error("emitSoundEvent error", e);
  }
}