// Interaction hooks for future shared combat and inventory. LAN presence and
// shared structures are handled by lan-client.js and the local Node server.
export class WorldBridge extends EventTarget {
  publishPosition({ x, y, layer, facing }) { this.dispatchEvent(new CustomEvent('local-position', { detail: { x, y, layer, facing } })); }
  publishInteraction(detail) { this.dispatchEvent(new CustomEvent('local-interaction', { detail: {...detail} })); }
  publishChat(text) { this.dispatchEvent(new CustomEvent('local-chat', { detail: { text } })); }
  // A transport can call these after validating server messages.
  receivePlayerPosition(detail) { this.dispatchEvent(new CustomEvent('remote-position', { detail })); }
  receiveChat(detail) { this.dispatchEvent(new CustomEvent('remote-chat', { detail })); }
  receiveInteraction(detail) { this.dispatchEvent(new CustomEvent('remote-interaction', { detail })); }
}

export const worldBridge = new WorldBridge();
