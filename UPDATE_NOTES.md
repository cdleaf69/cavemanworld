# October 1, 2026 update

Implemented the requested shared currency, resource-sale economy, visible coin HUD, building separation, randomized safe spawns, removal of the prealpha camp, broader resource coverage with varied clearings, expanded geographically aligned caves, directional passage labels/colors, revised side animation, new enemies/drops, smith-only bow evolution, higher-tier melee variants, and creature-over-resource click priority.

The casinos now use inventory coins. Blackjack adds independent split hands, resplits to four hands, split-ace restrictions, double down, insurance before dealer peek, late surrender, and correct separate-hand payouts. Added single-player five-card draw poker and European single-zero roulette. The exact blackjack table rules appear in the menu and README.

Validation: 79 automated tests pass. All JavaScript syntax checks and the whitespace check pass. Town, cave, passage, species, and side-motion scenes were rendered using the actual game renderer and inspected. Live browser verification was unavailable because the browser environment timed out; rendered scenes do not replace a full interactive play-through.

Run `node server.js`, then visit http://localhost:3000. No install step is needed for the game itself. Existing limitations: local session only, no saved gameplay or connected multiplayer. Original files were edited locally; this upload does not push changes to GitHub.


## Local path and animation polish after GitHub import

Based on GitHub main commit `3676658` from cdleaf69/cavemanworld. The previous local game was archived to `work/caveman-world-before-github-update.zip` in the workspace before importing the repository.

Surface trails now share precomputed rounded corners across terrain, the atlas, resource clearances, river bridges, and walkability. Main trails are 112 units wide; town lanes are 88. Smaller plazas and more restrained edge variation improve junctions. Spatial path buckets keep terrain generation and resource placement efficient after introducing curves.

Side walking uses a reduced shoulder swing and shorter forearms. The anatomically far arm changes with east/west facing and renders behind the torso; the near arm renders afterward. Held items use a steadier near-hand pose, and their projectile/fishing attachment calculations follow that hand. Front/back movement and the upright swimming mechanic are retained.

Validation: 80 automated tests pass, including clear path centerlines, bridges and portals, restrained arm motion, swapped rear-arm identity, and held attachments. Browser checks exercised town movement and zoom and rendered four-direction animation frames with no browser errors. The tested town scene ran around 75 FPS and 2.3 ms/frame. Start with `node server.js` in the game folder; visit http://localhost:3000/.


## Frontier expeditions update — 2026-10-01

- Surface expands from 54k × 35k to 90k × 63k (3× area), with blended new regions, three projected mountain ranges, and six additional connected cave entrances.
- Fourteen fish, marine creatures, an underwater layer, air/drowning, permanent water-breathing quest armor, and one-time ocean wreck treasure.
- Ten escalating fisherman quests plus roaming woodland/cave quest givers with varied humanoid appearances.
- Sparse mountain crops, 30-second fueled drying, a 60-second +50% health/XP effect, altitude materials, and one Bigfoot boss per range with melee, feces, and rolling logs.
- Foundations, walls, gates, storage, fish traps, extraction, logging, healing, three transport options, a grapple, and a crystal drill. Construction and projectile collision protect bases; machines use actual nodes and suitable crafted tools.
- J journal, V dive/surface, R building rotation, inventory-only armor, and distinct crafting groups. Local page-session gameplay; no online multiplayer or paid service.
- Browser checks cover quest hand-ins, ocean catches, diving/breath, treasure, armor, raft travel, cave transitions/NPCs, mountain climbing, actual timed drying, boost use, structure recovery, menus, and performance. Automated coverage includes the complete final quest chain and resource conservation.

Final validation: all 93 automated tests pass. Interactive Chrome checks reported no browser errors and approximately 75 FPS in the tested surface, mountain, cave, and underwater scenes. This is the observed result on the local test machine, not a guarantee for other hardware. The game remains available at http://localhost:3000/; gameplay progress resets when the page reloads.
