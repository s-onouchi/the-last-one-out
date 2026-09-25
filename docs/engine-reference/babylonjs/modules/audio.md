# Babylon.js Audio — Quick Reference

Last verified: 2026-09-25 | Engine: Babylon.js 9.28

## ⚠️ AudioEngine v2 (8.0 Breaking Change)

In Babylon.js 7.x and earlier, the audio engine auto-created when `Engine` was constructed. In 8.0+, **AudioEngine must be opted into explicitly**.

```typescript
// Old (legacy, still works):
const engine = new Engine(canvas, true, { audioEngine: true });

// New (recommended for 8.0+):
import { CreateAudioEngineAsync } from "@babylonjs/core/AudioV2";
const audioEngine = await CreateAudioEngineAsync();
```

Calling `Engine.audioEngine` without setting `audioEngine: true` returns `null` — code must handle this. Source: https://forum.babylonjs.com/t/audio-engine-breaking-change-for-babylon-js-8-0/56012

## Sound Loading

```typescript
const sound = new Sound("sfx", "/audio/click.mp3", scene, () => {
  sound.play();
});

// Async pattern:
const music = new Sound("bgm", "/audio/theme.ogg", scene, null, {
  loop: true,
  autoplay: true,
  volume: 0.5,
});
```

Supported formats: MP3, OGG, WAV. **Browser auto-play policies** require user interaction before audio plays — design UX so first sound plays after a click/tap.

## Spatial Audio (3D Positioning)

```typescript
const sound = new Sound("3d-sfx", "/audio/explosion.mp3", scene, null, {
  spatialSound: true,
  maxDistance: 50,
  rolloffFactor: 1.5,
});
sound.attachToMesh(explosionMesh);
```

Babylon.js routes spatial audio through Web Audio API panner nodes. Listener position auto-updates from the active camera.

## Spatial Audio Models

| Model | Behavior |
|---|---|
| `linear` | Linear falloff between `refDistance` and `maxDistance` |
| `inverse` | Inverse-distance attenuation (default; physically realistic) |
| `exponential` | Exponential falloff (more dramatic dropoff) |

Set via `sound.distanceModel = "linear"`.

## AudioEngine v2: 9.6–9.28 Changes

The examples above use the legacy `Sound` class (not tagged `@deprecated` in
9.28). For AudioV2 (`CreateAudioEngineAsync`, `CreateSoundAsync`,
`CreateStreamingSoundAsync` from `@babylonjs/core/AudioV2`), these landed after 9.5:

- **Distance-only spatial mode (9.8):** `spatialPanningEnabled: false` at
  creation, or `sound.spatial.panningEnabled = false` at runtime — keeps
  `linear` / `inverse` / `exponential` distance attenuation but no L/R panning.
  Sound cones are **not** applied while panning is disabled.
  Source: https://github.com/BabylonJS/Babylon.js/pull/18462
- **Waveform data (9.11):** analyzer gains `getByteTimeDomainData()` /
  `getFloatTimeDomainData()` alongside the frequency-data getters.
- **iOS ringer switch (9.26):** `CreateAudioEngineAsync({ disableIOSRingerSwitchWorkaround: true })`
  disables the silent HTML audio element Babylon uses so WebAudio plays with the
  ringer off. Default `false`. Upstream: disabling "can avoid rendering
  performance degradation on affected iOS and iPadOS devices, but WebAudio may be
  muted when the ringer switch is off" — a product decision, record it in an ADR.
- **Fixes worth knowing (9.14–9.18.2):** play options now applied when resuming
  a paused sound; live `loopStart` / `loopEnd` changes propagate to playing
  static sounds; seek-after-resume offset fixed; MediaStream/WebRTC sources are
  spatialized out of the box (relevant to voice chat).
- Inspector v2 gained AudioV2 support (9.9.2).

Sources: CHANGELOG (https://github.com/BabylonJS/Babylon.js/blob/master/CHANGELOG.md),
`@babylonjs/core` 9.28.0 `AudioV2/webAudio/webAudioEngine.d.ts`,
`AudioV2/abstractAudio/subProperties/abstractAudioAnalyzer.d.ts`.

## Audio Buses and Mixing

AudioEngine v2 supports bus-based mixing:

```typescript
const sfxBus = audioEngine.createMainBus({ name: "SFX" });
sfxBus.volume = 0.7;
sound.outputBus = sfxBus;
```

Buses allow muting/ducking categories (music, SFX, voice, ambient) independently — essential for accessibility settings (separate volume sliders).

## Streaming vs Decoded

- **Decoded** (default for short SFX): full file in memory, instant playback, repeatable
- **Streaming** (for long files like music): pass `streaming: true` option, lower memory but seek latency

```typescript
const music = new Sound("bgm", "/audio/long-theme.ogg", scene, null, {
  loop: true,
  streaming: true,
});
```

## WebXR Audio

In immersive XR sessions, spatial audio listener follows the XR camera (head pose) automatically. No special setup required beyond `spatialSound: true` on relevant sounds.

For room-scale audio reverb (Quest, Vision Pro), use the WebAudio `ConvolverNode` via Babylon's audio bus chain.

## Performance

- Limit simultaneous spatial sounds to < 32 on mobile/XR (Web Audio overhead grows non-linearly)
- For UI clicks and frequent SFX: pre-load and cache, never re-construct `Sound` per click
- `sound.dispose()` is mandatory — orphan sounds leak audio buffers

## Common Pitfalls

- Browser auto-play block: first audio call without user gesture is silently rejected; subscribe to a click/tap to unlock
- Forgetting `await CreateAudioEngineAsync()` in 8.0+ (sound plays but bus routing absent)
- Mixing legacy `audioEngine: true` and v2 patterns in same project (state confusion)
- Using `streaming: true` for short SFX (slower seek; only beneficial for files > 30 seconds)
- Not disposing sounds on scene change (memory leak)

## Source Documents

- Audio system: https://doc.babylonjs.com/features/featuresDeepDive/audio
- AudioEngine v2 (8.0+): https://doc.babylonjs.com/features/featuresDeepDive/audio/audioEngineV2
- 8.0 breaking change forum: https://forum.babylonjs.com/t/audio-engine-breaking-change-for-babylon-js-8-0/56012
