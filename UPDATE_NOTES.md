# October 4, 2026 · Sulfur and the Old Testament

Bigfoot has nine rotating attack lines. Steezus floats with a gentle vertical bob and still rides his floating skateboard during smoke attacks. Five sulfur outcrops spawn only around Steezus on Cloudspine and require an equipped pickaxe; sulfur has no crafting recipe yet. Rain uses individual staggered sulfur ore sprites matching the outcrops. Defeating Steezus drops exactly one Old Testament bible trophy with a book sprite, alongside his other rewards.

Validation: 19 focused checks passed, including sulfur spawn locality, saved/default zone visibility, mining requirements and the one-time-on-death bible drop. Browser checks exercised all three powers and inspected floating, individual sulfur rain and helpers without errors.

---

# October 4, 2026 · River current, bridges, quests and atlas

River current follows the nearest downstream segment, at 22–52 world units per second depending on distance from the center. Swimming keeps its water state below bridges. Deck contact is tracked separately: entry from shore or a Space jump near a bridge mounts its deck; stepping off drops back into water. Bridge art is redrawn above swimming actors and beneath deck actors, including remote players.

NPC conversations lock the quest menu to that NPC, including quest completion. The standalone journal still browses quest givers. The minimap again shows the whole region. The expanded atlas uses 1280-pixel sampling instead of 480 pixels sampled in two-pixel blocks, smooth display scaling, a separate generation worker, and automatic refresh once ready.

Validated: 26 focused checks passed. Browser checks verified current drift, swimming underneath, jumping onto the deck, stationary deck contact and shore entry. Separate browser checks verified the NPC menu lock, standalone journal, and stable full-world minimap when moving. No browser errors were reported.

---

# October 4, 2026 · Boss powers and readable nametags

Creature and player nametags measure their text instead of clipping names to a fixed width. Crowded creature tags stack to remain readable. Boss dialogue uses wrapped parchment speech bubbles.

Steezus cycles three powers: sulfur rain at the player's last known position (1.6-second marked warning, then a 3.6-second storm), summoned Adam and Eve (small melee and apple attacks, defeatable, limited to one pair, disappear after 40 seconds or when the encounter ends), and a five-second skateboard ride with animated joint puffs and smoke projectiles. Bigfoot retains melee, feces puddles and rolling logs, with funny attack dialogue.

Validated: 22 focused automated checks passed, including the three-power cycle, locked storm targeting, dodging, timing, helper cleanup, Bigfoot attacks and existing expedition features. Live browser checks rendered the warning circle, sulfur rain, humanoid helpers, skateboarding, smoke animation, and dialogue without browser errors.

---

# October 4, 2026 · Natural wilderness, PvP and pixel UI

Raft placement and sailing now share a full-hull water and map-boundary check. Rejected network moves roll back the local prediction. LAN players can fight with melee weapons, bows and slingshots; the server checks reach, cooldowns, wall obstruction, armor reduction and projectile collisions. Defeated players respawn with a short protection period. Other players can destroy wooden bases with axes and stone bases with pickaxes.

Biome silhouettes use seeded asymmetric coastlike contours, shared by terrain, the atlas and resource placement. Automatic saved habitat zones migrate to the new shapes while custom zones remain. Long wilderness roads are removed; town lanes and six short river crossings remain. Cave entrances are larger.

Cloudspine is guarded by Steezus, an original pixel boss with a leaf crown, golden halo, sunglasses, flowing robe, peace-sign pose and holy smoke puddles. Pinecrest and Frostpeak retain Bigfoot. The interface has original pixel lettering, timber frames, stone hotbar recesses, a stitched field pouch and parchment menus.

Validation: all 113 automated checks passed, followed by four focused combat/boundary checks after projectile collision refinement. Two independent browser sessions verified actual melee, bow and slingshot hits, plus destruction of another player's base. Inventory, creatures and quests remain local beta state; server structures remain in memory until restart.

---

# October 4, 2026 · Loading and creature art

Placement checks now use numeric spatial buckets and local distance searches. A byte-for-byte SHA-256 comparison of all generated nodes and decorations matches the previous layout: 114,709 nodes and 67,861 decorations, including positions, variants and quantities. Generation measured about 4.3 seconds compared with 12–13 seconds previously.

World generation runs in a worker; the untouched initial layout is stored in IndexedDB for repeat loads. Zone edits and geometry changes invalidate that cache. The cache never stores harvested/depleted nodes or player state. Storage/worker failures fall back to normal generation. Browser measurements: about 5.5 seconds fresh, 0.9–1.2 seconds on repeat, on this computer.

All 56 animal, cave monster, boss and ocean species now use original detailed pixel art with shaded surfaces, species-specific features, articulated legs, flapping wings, swaying tentacles or swimming fins. Sprite frames are generated lazily and cached in bounded six-frame cycles. Direction changes use a dead zone to avoid flickering around vertical headings. Nameplates allow for actual sprite headroom. Cave crystals, mushrooms, bones, treasure chests and sky crystals also received additional facets and detail.

All 109 automated checks passed, including a new exact-layout preservation check. Browser checks covered all 56 sprites and their animation frames, normal world rendering, cave monsters, Bigfoot, ocean creatures, stable facing and bounded sprite caches. A sampled cave scene measured 75 FPS / 1.7 ms per frame. Performance varies by hardware.

---

# Latest update: doubled world and LAN building beta

World expanded to 135,000 × 84,000 with a continuous wider river, Great Mirror Lake, broader mountains and offshore water. New biome crops provide both food and seeds. Foundations stay beneath actors, walls fade when they obscure the player, and roofs fade underneath. Wood walls and roofs are craftable.

Real LAN players, chat, placed structures, gate state and raft driver/movement state are shared by the free Node server. Axe/pickaxe building damage is checked by the server. Inventory, NPCs, creatures and quests remain per-client beta state. Server structures are in memory until restart.

Shift+number keys switch tools. The glider has four elevated, gently bobbing poses and faster flight. Rafts are water-only placed vehicles with driver seats, deck passengers and offshore fishing. The minimap is local; M opens the complete atlas. Four new valuable offshore fish have distinct spines, luminous markings or angler/crown features.

Validated: all 107 checks in the full suite passed, followed by passing focused tests and a new sprite-opacity regression check; two independent browser sessions shared and destroyed a placed base; Shift+2 worked; a raft sailed and caught fish; all four elevated glider poses rendered; no browser errors in that walkthrough. The sampled scene ran at 67 FPS / 2.9 ms per frame (hardware dependent).

---

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

## Mountain completion and chunk preloading — 2026-10-02

- Reworked the thin mountain divider strips into taller, irregular cliff faces with large rock facets, rubble, grass/snow caps, and altitude-dependent terrain shading.
- Added separate editable mountain habitat zones. Each range has up to 22 trees, 18 bushes, 34 rocks, and 40 summit decorations. Natural spacing keeps climb lanes, Bigfoot's clearing, and both sparse marijuana patches open. Nodes use normal harvesting and respawning rules.
- Corrected elevation and culling for ordinary resource nodes, decorations, and selection brackets so mountain scenery aligns with the raised terrain.
- Preserved six marijuana plants per range, 1–3 harvest yield, 30-second fueled drying, 60-second health/XP boosts, and one Bigfoot with melee and both projectile attacks per range.
- Added two chunks of off-screen terrain preloading, visible-first worker requests, a bounded larger tile cache, and the existing one-tile-per-frame fallback.
- All 96 automated tests pass. Browser checks confirm climb movement, summit crops, vegetation, active boss damage, and no JavaScript errors.

## Free mountain traversal and smoother ground — 2026-10-02

- Removed the trail-only foot movement restriction: all mountain slopes can be crossed freely. Buildings still require flat ground, and existing building/base collisions remain active.
- Mountain habitats now distribute up to 100 trees, 65 bushes, 105 rocks, and 100 small decorations across the entire range, with natural spacing and clear crop/boss areas. Most harvestable scenery is on the slopes rather than confined to the path and summit.
- Added thin, curved elevation contours along the climb. Cliff faces and contours are visual height cues, not movement barriers.
- Removed abrupt foothill lighting and summit color thresholds, blended them smoothly, and doubled terrain sampling detail in mountain chunks. The off-screen preload buffer remains active.
- All 97 automated tests pass. Browser checks verify free off-trail climbing, sideways traversal, summit vegetation, and no JavaScript errors; tested scenes ran around 75 FPS locally.


## Mountain lions, open mountain depth, puddles and gardening — 2026-10-04

- Added eight hostile mountain lions per range with original feline sprites, pursuit, uphill movement, mountain boundaries, respawns and useful loot.
- Removed mountain contour lines and cliff walls. Stronger shared elevation, smooth slope lighting, atmospheric color and low clouds provide depth while all slopes remain walkable. Resources, camera, clicks and culling follow the same projection.
- Bigfoot's feces lands at the aimed distance, splashes, and leaves a temporary damaging puddle. Puddles last 12 seconds, tick every 0.9 seconds without stacking, and clear with scene transitions.
- Added craftable plant boxes and waterskins. Five seeded crops grow through visual stages with water; harvest returns crops and two seeds. Normal bushes supply starter seeds; mountain plants supply marijuana seeds. Food crops heal, sell, or seed new gardens. Mining returns unfinished seeds and stored supplies.
- Browser checks exercised actual crafting, placement, water collection, planting, watering, the full 45-second growth cycle, collection and seed return without browser errors. Unit checks cover timed growth, resource conservation, recovery, puddle damage/expiry and lion slope movement.
- Added restrained uphill effort and downhill relief for foot movement. Flat-ground movement is unchanged. The browser verified visible Bigfoot puddles and recurring health damage; tested mountain scenes ran around 75 FPS locally. The previous foraging test was updated for its new crop and seed drops and passes.
