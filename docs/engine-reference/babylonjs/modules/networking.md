# Babylon.js Networking — Quick Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

## ⚠️ No Built-in Networking

**Babylon.js does NOT provide a networking layer.** Unlike Unreal (replication), Unity (Mirror/Netcode for GameObjects), or even Godot (high-level multiplayer API), Babylon.js is a pure rendering library — multiplayer is your responsibility to wire up.

This is by design (Babylon is "library, not engine"), but it means networked games require a separate library and meaningful architectural work.

## Recommended Approaches

### Option 1: Colyseus (most common for indie multiplayer)

[Colyseus](https://colyseus.io) is an authoritative server framework for Node.js with first-class browser client support.

- **Server-authoritative**: room state lives on the server, clients receive updates
- **Schema-based serialization**: efficient delta encoding, automatic state sync
- **Browser client**: WebSocket-based, works with Babylon.js out of the box
- **Free + open source** (BSD-3)
- **Best for**: 2-32 player rooms, MMO-lite, real-time co-op, party games

```typescript
import { Client } from "colyseus.js";
const client = new Client("ws://localhost:2567");
const room = await client.joinOrCreate("my_room");
room.state.players.onAdd = (player, sessionId) => { /* spawn mesh */ };
room.state.players.onChange = (player, sessionId) => { /* update transform */ };
```

### Option 2: WebSocket (manual)

For simple real-time with full control:

```typescript
const ws = new WebSocket("wss://server.example.com");
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // dispatch to game logic
};
ws.send(JSON.stringify({ type: "move", x: player.position.x, z: player.position.z }));
```

You design the protocol, message types, and reconciliation. **Significant work** but no library lock-in.

### Option 3: WebRTC (peer-to-peer)

For low-latency P2P (fighting games, racing, small lobbies):

- Use [PeerJS](https://peerjs.com) or [simple-peer](https://github.com/feross/simple-peer) for the WebRTC handshake
- Requires a signaling server (any WebSocket server works)
- Latency: as low as 30-50ms for nearby peers
- **Caveats**: NAT traversal can fail (~10% of users); fall back to relay (TURN) server

### Option 4: HTTP Polling / Server-Sent Events

For turn-based or low-frequency updates:

- Simple `fetch()` polling every N seconds
- Server-Sent Events for one-way streams (leaderboards, chat)
- **Best for**: turn-based games, chat, social features, async multiplayer

## State Synchronization Patterns

Regardless of transport, key patterns to know:

- **Authoritative server**: clients send inputs, server simulates and broadcasts state. Canonical for competitive games.
- **Lockstep**: clients exchange inputs and run identical simulations. RTS-style; requires deterministic Babylon.js code (rare).
- **Client-side prediction + reconciliation**: client predicts locally for responsiveness, corrects when server state differs
- **Interpolation / extrapolation**: smooth remote player movement between received positions

For typical indie games: **authoritative server + interpolation** is the right starting point.

## XR Multiplayer

Multiplayer in WebXR is rare but possible. Considerations:

- Latency budget is tight (XR motion sickness threshold ~150ms)
- Voice chat: WebRTC audio track separate from game state
- Spatial audio of remote players: attach Sound to remote avatar mesh

## Performance

- Rate-limit your sends: 10-30 Hz for position updates, on-event for actions
- Compress state: integer quantization for positions, delta encoding for full state
- Browser WebSocket has no Nagle algorithm by default; small frequent messages are OK

## Common Pitfalls

- Trusting client-reported state on server (cheating vector)
- Not handling disconnect/reconnect cleanly (orphan player meshes)
- Sending state every frame at 60Hz (bandwidth wasteful; 10-20Hz is plenty for non-competitive)
- Forgetting to dispose of Babylon.js meshes when remote players leave
- WebRTC without TURN server fallback (~10% of users behind strict NATs cannot connect)
- Mixing message formats (JSON for some messages, binary for others) without versioning

## Source Documents

- Colyseus docs: https://docs.colyseus.io/
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- Server-Sent Events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

## Project Default Decision

This project does not pick a networking stack by default. If multiplayer is required, file an ADR (`/architecture-decision`) selecting one of the approaches above. The decision affects backend hosting, server costs, and gameplay design.
