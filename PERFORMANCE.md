# Performance update — October 6, 2026

The game retains its original terrain resolution, scenery density, animal frames, lighting, audio, and map detail.

## Changes

- World generation uses nearby portal and tunnel buckets instead of scanning every passage for each proposed scenery location. Deterministic positions, quantities and variants remain unchanged.
- The world worker transfers a packed buffer. Cached pristine layouts reuse that buffer; existing saved layouts remain readable. Hydration yields in short time-budgeted batches.
- Terrain plans are reused until a view crosses a chunk boundary. Cave loading respects actual layer dimensions.
- The next descent's visible terrain and cave atlas load in advance, starting immediately after arrival. Visible terrain wins queue priority, followed by the destination and nearby background chunks.
- Destination tiles are protected during loading. The 512-tile cache bounds background work to avoid endless eviction and regeneration at wide zoom. The normal four-chunk preload margin remains.
- Water ripple geometry is reused between grid crossings; the original four animation frames still draw. Mountain elevation is calculated once per object per frame before sorting.
- Boss music checks its boss list rather than every creature. Structure picking no longer sorts the entire base registry; remote position interpolation allocates less and resets on layer changes.
- Unchanged web assets return 304 before file reads or compression. Compressed audio/image formats skip redundant gzip; MP3 range requests reuse cached bytes.

## Measurements

Same 1365 × 900 local Chrome route, fresh browser context, surface river scene, six consecutive cave descents:

| Measurement | Before | After |
| --- | ---: | ---: |
| Startup to initialized game | 9.89 s | 6.92 s |
| World generation | 5.72 s | 4.44 s |
| World preparation total | 6.96 s | 5.57 s |
| Average render work | 3.28 ms | 2.01 ms |
| 95th percentile render work | 4.5 ms | 3.0 ms |
| First cave terrain ready after teleport | 661 ms | 89 ms |
| Subsequent cave teleports | 222–465 ms | 50–110 ms |

A same-session cached reload prepared the world in 763 ms. Timings depend on hardware, browser caches and other running work; these are measured local runs, not a server player-capacity estimate.

## Verification

- Terrain and full-map SHA-256 pixel hashes match the earlier version for grass, mountains, caves and the atlas.
- 77,535 water draw calls match the original across multiple locations and animation phases.
- All 138,560 scenery nodes and 83,825 decorations remain present.
- Repeated descents and returns, cached reloads, gameplay checks, LAN updates, bounded chunk loading, and audio byte ranges were checked.
- An older descent test was updated to recognize the seventh layer's separate store interior coordinates; natural cave passages still have aligned endpoints.

## October 8 scenery and runtime pass

Restored rounded foliage with whole-pixel scenery contours. Environment outlines use integer offsets rather than blended fractional offsets. The powered drill again uses its dedicated illustration instead of the generic material pickaxe renderer.

Runtime changes: skip redundant hover hit tests, update tooltip text/layout only when needed, replace repeated complex modal selectors with the live modal collection, cache static scenery elevation, conservatively skip fully offscreen sprites, and avoid distant creature AI dispatch and per-frame creature-array filtering. Respawns still update for sleeping creatures. Reused node property descriptors reduce allocation during generation/hydration.

Local Chrome, 1365 x 900, same scene and cursor position, seven-second profile:
- Render mean: 2.096 ms before / 1.742 ms after (16.9% lower).
- Render p95: 2.6 ms / 2.3 ms.
- Sampled HUD frame work: 3.2 ms / 2.5 ms; both runs capped at 75 FPS.
- Cold startup: 6.85 s / 6.72 s, not a material startup improvement.

These are local client measurements, not a server player-capacity estimate. Optimized rendering was compared against uncropped reference rendering at 0.32, 0.68 and 1.7 zoom: zero changed pixel channels. World-generation experiment retained all 138,560 nodes and 83,825 decorations with the same serialized SHA-256, but did not improve timing and was reverted. Three UI-driven cave transitions completed in 183, 209 and 145 ms (includes automation overhead; not a terrain-ready metric). Targeted regression tests pass, including respawns, worker queues, inventory, bosses and tool geometry. Existing armor-hotbar test expectations were updated to the approved Put behavior.
