# Embervale — local playable world

Embervale is a top-down caveman social-world **local gameplay prototype** built with HTML, CSS, JavaScript, and the Node.js standard library. It has no paid service, install step, external asset request, or runtime dependency. Multiplayer is **not connected**.

## Start on localhost

From the `build-a-playable-top-down-web` workspace in PowerShell:

```powershell
cd .\outputs\caveman-world
node server.js
```

Open **http://localhost:3000**. Press `Ctrl+C` in the terminal to stop the server. Node.js 20+ is recommended. If port 3000 is busy, run `$env:PORT=3001; node server.js` and open `http://localhost:3001`.

## Controls

| Action | Control |
| --- | --- |
| Move | `W` north, `A` west, `S` south, `D` east |
| Face | WASD; four fixed directions, most recently pressed held key wins |
| Camera framing | Move the mouse; does not change facing |
| Jump | Tap Space (can move while airborne; walls and water still block) |
| Stop moving | Release movement keys |
| Sprint | Hold Shift while moving |
| Beta travel boost | Hold Alt while moving for 10× current speed (stacks with Shift) |
| Zoom | Mouse wheel, `+`, or `-` |
| Pick up dropped loot, forage loose items, open a campfire, or use a cave entrance | `E` |
| Gather or mine a resource node, place a selected campfire, or attack | Left click on the object or ground |
| Attack an animal or cave mob | Left click toward it |
| Beta levels and item grants | `7` |
| Select a hotbar slot | `1`–`6` or click its slot |
| Eat cooked meat to recover 40 health | `H`, click its selected hotbar slot, or use Inventory |
| Cast and reel in fish | Equip a Fishing Rod, click lake water from shore, then click the bobber or press `E` when it bites |
| Open crafting for weapons, armor, and structures | `C` |
| Inventory: resources, equipment, and structures | `I` |
| Show or hide the on-screen pouch | `P` |
| HUD settings: minimize and restore panels | `O` or the gear button |
| Open atlas | `M` |
| Show spawn zones | `F3` |
| Show field guide | `?` button |

The 36,000 × 21,000 unit surface takes about **3 minutes 49 seconds** to cross a full horizontal span at 157.5 units/second before route detours. Shift increases movement speed to exactly **2.5×** (393.75 units/second). Alt provides the temporary 10× beta travel boost and stacks with sprint. W/A/S/D move along the world axes; holding two perpendicular keys, such as W and D, moves diagonally. Diagonal input is normalized to the same overall speed. The mouse independently turns the player's gaze and pans the top-down camera at normal zoom. Zooming in smoothly reduces that pan and centers the camera on the player by the first full zoom-in step (about 0.76× zoom). The map stays north-up and fully visible. This camera motion remains local; future multiplayer position events use world coordinates and facing, with no camera state. The Central Village connects to Elderwood, Frostfall, Mirefen, Redstone Reach, and Ashen Crown by continuous footpaths without dashed divider markings. Eight surface entrances lead to connected upper caves, and six distinct descents lead to an 17,600 × 9,000 unit lower cave map. Huts, placed campfires, water, world bounds, and cave walls have collision. Trees, ores, rocks, bushes, and scenery can be walked through.

## First steps and equipment

The hearth starts with glowing **pebbles, loose sticks, and fallen leaves**. Click them or press `E` nearby to pick them up by hand. **Bushes give 2 sticks and 2 leaves**. Trees cannot be gathered by hand; boulders need a pickaxe. Nodes respawn and do not block movement.

1. Gather **2 sticks + 2 stones**, open crafting with `C`, and craft a **Crude Stone Axe**.
2. Approach a tree and click it for each swing. Trees take several hits, with a 0.6-second cooldown. A crude axe gives **3 wood** per tree.
3. Gather **4 wood + 3 stones + 2 leaves** to craft a **Reinforced Stone Axe**. It deals twice the chopping damage and gives **5 wood** per tree. Your original axe stays in your bag.
4. Craft a **Stone Pickaxe** with **2 wood + 4 stones** to mine boulders and iron. An **Iron Axe** requires the reinforced axe, **2 wood + 5 iron**, deals 3 damage per swing, and gives **8 wood** per tree.

Press `I` or **BAG** to see resources, weapons and tools, armor, and structures in separate sections. Only items you currently carry appear in the inventory and pouch; resources and structure kits disappear at zero. Depleted consumables and kits also clear from the hotbar. Drag tools, campfire kits, or cooked food from Inventory into its six visible hotbar slots; click an item and then a slot when dragging is unavailable. Drag between slots to move or swap, and use × to clear. Select a slot with `1`–`6`. Equip and unequip armor in Inventory; armor cannot enter the hotbar. Crafted items remain in the inventory until assigned. The crafting menu shows a vector illustration for every recipe. Its **Item Index** tab is a searchable glossary of every resource, tool, armor piece, and structure, including items you have not found or have used up. The index shows sources, uses, recipes, and current counts. Inventory lasts for the current play session; refreshing starts a fresh game.

### Campfire and food

Craft a campfire with **4 wood + 4 stone**. Select its hotbar slot and click nearby open ground to place it. Click the placed fire or press `E` nearby to open its panel. Add wood as fuel and raw meat or fish. Each wood provides four cooking cycles, and each piece cooks in four seconds. Collect cooked meat or fish from the panel. Meat heals 40 health; fish heals 30. Press `H` to eat cooked meat, or cooked fish when you have no meat. Both foods can be eaten from Inventory or an assigned hotbar slot. Equip a pickaxe and click the campfire three times to recover its kit and contents.

### Lakes and fishing

The original Moonpool now has two companions: **Hearthmere**, south of the village, and **Willowmere Tarn**, in the southern marsh. All three have solid water and walkable shores. Craft a **Fishing Rod** from **3 sticks + 2 wood + 2 leaves**, then put it on your hotbar and select it. From shore, click lake water within casting range. After the bobber signals a bite, click it or press `E` before the fish escapes. Each catch gives one raw fish and 10 XP. Cook raw fish in a fueled campfire. For a quick local fishing test, open `http://localhost:3000/?start=hearthmere`.

### New ores and recipes

Ore veins have weighted rarity. **Copper** is common in Redstone Reach and its cave; **quartz** occurs in Frostfall and the Frost Vault; **amber** is found around the Mire Hollow; **obsidian** is rare in Ashen Crown and the Ash Vault. Lower caves hold all of these plus very rare **moonstone** in the Prism Gallery, Frost Root, Black Heart, Ember Deep, and Moon Vault. Rare regions guarantee at least one of their special veins. A Stone Pickaxe mines copper, quartz, amber, and iron; obsidian and moonstone require an **Iron Pickaxe**. Every biome material now has a matching axe, pickaxe, club, and armor recipe.

### Armor perks and matching tools

Every armor grants one multiplier while equipped. **Health** raises maximum health, **power** raises combat and gathering strength, **defense** raises blocked damage, and **speed** raises walking and sprinting speed. The inventory shows the active perk and matching tools crafted. Craft every tool listed for that armor and hold one of those tools to raise its perk by 50% of its normal bonus. For example, a +18% health perk becomes +27%.

| Armor | Origin | Perk |
| --- | --- | --- |
| Leaf Wrap, Wood Vest, Hide Wrap, Stone Hide | Surface starter materials | Health +8%, speed +8%, power +10%, defense +12%, respectively |
| Iron Armor, Wing Cloak, Crawler Shell | Upper-cave materials | Defense +15%, speed +14%, health +15%, respectively |
| Copper Armor, Quartz Armor, Amber Wrap | Redstone Reach, Frostfall, Mirefen | Power +15%, health +18%, speed +15%, respectively |
| Obsidian Armor, Moonstone Armor | Ashen Crown, Moon Vault | Power +22%, defense +22%, respectively |

Copper, quartz, and amber form one **upper-cave strength tier**: their armor blocks 5 damage, axes and pickaxes deal 9, and clubs deal 11 before perks. Obsidian and moonstone form one **deep-cave strength tier**: their armor blocks 8, axes and pickaxes deal 15, and clubs deal 17 before perks. The biome perk is the main distinction within each tier. Existing starter and creature-drop armor keeps its own progression and gets a perk too.

## Animals, cave combat, and health

Rabbits, deer, foxes, boars, and tortoises wander the surface. Snow Hares live in tundra, Marsh Cranes in marshes, and Sand Lizards in badlands and volcanic areas. They are neutral and flee when approached or hit. Left click the game world to attack within melee range. Bare hands deal 1 damage; crafted rocks, axes, and clubs deal more. Defeated animals scatter resources onto the ground with a short bounce animation. Move close and press `E` for each drop.

Cave Bats, Cave Crawlers, Rock Scorpions, Stone Rams, Cave Slimes, Crystal Beetles, and Ember Golems are hostile underground. Frost Wisps inhabit frozen cave rooms, Mire Leeches inhabit marsh cave rooms, and Ash Mites inhabit volcanic rooms. Scorpions throw visible rocks toward your position; step out of the rock's path to dodge. Stone Rams pause with a warning ring, then charge along the direction they faced. Cave walls stop projectiles and charges. Armor reduces each hit; the health display shows your current health and protection. **Shiny** variants have more health, speed, and loot and drop **glimmer**. Their spawn chance rises with cave depth. Approach each drop and press `E` to collect it. Cave entrances and descents have a safe area so players can enter and leave before engaging. If health reaches zero, you return to the Central Village at full health and keep your inventory. Creatures respawn after 60 seconds. Combat is local prototype behavior; a future multiplayer server must validate it.

The gear button or `O` opens HUD settings, where Location, Health, Minimap, Your Pouch, Hotbar, and the bottom toolbar can each be hidden or restored. **Show all panels** restores everything. Your Pouch also toggles quickly with `P`. Display preferences remain in this browser on refresh.

For a quick cave test, open `http://localhost:3000/?start=elder-mouth` and press `E`. Other surface start IDs are `frost-crack`, `redstone-hollow`, `mire-sink`, and `ash-gate`; add `&layer=cave` to start at the matching underground exit. Lower cave entrances are `echo-descent`, `frost-descent`, `ash-descent`, and `glow-descent`; `http://localhost:3000/?start=echo-descent&layer=cave` starts by one, and `&layer=deep` starts below it. This query option is for local testing.

## Spawn zones and runtime objects

Spawn zones are data in `src/spawn-zones.js`. Each has a layer, biome, polygon boundary, allowed spawn types, and resource list. The Village Grove, Elder Canopy, and Mire Thicket tree zones are larger, and a new East Village Grove fills more of the heartlands. Tree and decoration counts rise with the larger zones; trees still stay clear of trail centerlines and cave entrances. Press `F3` to inspect zones. **Players cannot move zones.** To edit them during local development, open `http://localhost:3000/?dev=1`, press `F3`, select a zone, then edit its fields or drag a corner handle. Changes persist in browser local storage and regenerate nodes. Existing saved zones migrate to the expanded tree boundaries. **Export JSON** downloads the current data; **Reset zones** restores defaults. Zones are invisible in normal play.

`src/spawner.js` places resource nodes and small decorations deterministically inside allowed zones, plus a curated starter group at the hearth. `src/spawnables.js` defines separate `ResourceNode`, `Decoration`, `Tool`, and `Gear` classes; `src/creatures.js` defines runtime wildlife and cave mobs; `src/fishing.js` handles local casting, bites, and catches; `src/combat.js` defines damage and health; `src/combat-objects.js` defines animated loot and projectiles; `src/crafting.js` defines the inventory and recipes; `src/perks.js` defines armor multipliers and matching tool sets; and `src/item-art.js` creates local vector item illustrations. Leaf, wood, stone, iron, copper, quartz, amber, obsidian, and moonstone equipment tiers are present. Nodes, creatures, loot, and projectiles are runtime objects and are never baked into vector terrain. Landmark art and village structures are permanent terrain features.

## Multiplayer integration seam

`src/network-hooks.js` exports `worldBridge`. The game emits `local-position` (about 10 times per second while moving) and `local-interaction` (gathering, cave transitions, combat, eating, respawn). It also defines `local-chat` and corresponding `remote-position`, `remote-chat`, and `remote-interaction` delivery methods for future work. A real multiplayer implementation needs a server transport, authoritative collision, combat, creature AI and interactions, player identity, chat UI, synchronization, and persistence. No remote players or chat are simulated in this prototype.

## Test

```powershell
node --test
```

The tests verify diagonal movement, mouse camera panning, player-centered zoom, sprint speed, connected paths across all four cave depths, zone persistence, biome ores and their mining requirements, runtime spawning, gathering, crafting, collision, combat damage, cave-tier equipment parity, armor set multipliers, creature drops, shiny creatures, charge attacks, healing, and respawn.

## Pixel wilderness expansion

The surface and original two cave layers have three times their former area. Abyss and World Core add two further cave layers. Connected trails reach Emerald Wilds, Silverpine Highlands, Willowmere, Sunscar Mesa, and Cinderfall, with additional upper and deep cave chambers. The upper cave bounds are 16,000 × 8,100 units.

Terrain uses cached procedural pixel textures with blended biome borders, irregular dirt paths, textured water, and wooden crossings. Shaded pixel sprites include varied trees, undergrowth, stone and ore, thatched huts, people, and wildlife. Depth ordering and fading tree canopies keep the player visible. Deterministic vegetation scattering uses uneven density and variable spacing; spawn zones remain editable and separate from terrain. Art is generated locally without external assets or paid services.


### Rendering performance

Terrain textures are generated by a local module Web Worker using OffscreenCanvas, then transferred as cached bitmaps. Browsers without those APIs use a limited synchronous fallback. Terrain cache size and queued jobs are bounded. Static sprites and contact shadows are cached; pixel art renders at one backing pixel per CSS pixel to avoid unnecessary high-DPI fill cost. Resource and decoration lookups use 512-unit spatial cells instead of scanning the entire world each frame. F3 shows FPS, average main-thread game work per frame, and whether the terrain worker is active.

The art uses outline-free sprites and compact contact shadows, and a simplified, consistent player palette. Earlier performance baseline: the village showed about 2.1 ms/frame and a dense forest at 0.35× zoom about 4.8 ms/frame. These are measurements on the test machine, not a frame-rate guarantee. Texture generation can briefly trail very fast beta travel while background tiles arrive.

## Toy pixel art and creature labels

The world now uses a bright, chunky pixel palette with broad color blocks without silhouette outlines. Surface and cave terrain, biome trees, shrubs, rocks, ore, huts, campfires, the player, and creatures share this playful style. Tree variants and biome colors remain distinct. The on-screen HUD uses flat navy panels and warm borders. Every visible neutral animal and hostile cave creature has an always-visible nameplate and health bar; shiny variants keep their special names. Health bars update when creatures take damage. F3 still shows the developer overlay and frame statistics.

### Creature motion and forest spacing

Creature art keeps a stable silhouette while the creature moves, and its left/right turn uses a small threshold to prevent rapid flipping. The player has larger, more readable eyes. Wilderness spawns have fewer trees and bushes, wider tree spacing, and more open clearings; village starter resources remain available. Woodland habitat placement now uses a lower target density and rejects an additional 55% of bush candidates before placement. Existing gameplay and movement remain covered by the test suite.


## Adventure art and four-depth progression

The active art renderer is `AdventureArt`: layered pixel foliage, bark details, pine boughs, timber-and-thatch huts, a compact adventurer, mineral facets, and rounded creature silhouettes. All art is generated locally and cached; no downloaded Terraria assets are used. Woodland vegetation density is reduced, with a further reduction in the share of bushes. Resource placement is still independent of terrain.

Gathering awards 6 XP (ore: 14), first-time equipment crafts award 20 XP, and defeating creatures awards 25 / 45 / 65 / 90 XP at successive cave depths (surface also 25). Levels cap at 20. Each level requires `60 + level × 35` XP; overflow carries forward. Progress and inventory currently last for the current page session.

| Cave depth | Equipment unlock | Biome minerals |
| --- | --- | --- |
| 1: Upper Caves | Level 3 | Copper, quartz, amber, verdite, basalt |
| 2: Deep Caves | Level 6 | Obsidian, moonstone, jade, bog iron, sunstone |
| 3: Abyss | Level 9 | Sylvite, cryolite, malachite, cobalt, pyrite |
| 4: World Core | Level 12 | Liferoot crystal, frostgem, aetherite, adamantite, infernite |

Each depth has five material sets, each containing an axe, pickaxe, club, and armor. Corresponding equipment shares base damage, harvesting strength, and defense at that depth. Armor specialties multiply health, power, defense, or speed. Own all three matching tools and equip one to increase that armor's perk bonus by 50%. A previous-depth pickaxe is required to mine the next depth (stone for depth 1). Deeper enemies have increased health and damage, drop their chamber's mineral, and have increasing shiny chances: 6.5%, 28%, 35%, 42%.

The Abyss entrance is in the deep cave at (4,850, 3,400). The World Core entrance is in the Abyss at (4,400, 4,600). Each new layer has five connected chambers and a working return entrance. Local transition checks can start at `/?layer=abyss&start=abyss-descent` or `/?layer=core&start=core-descent`.

Press **7** to open/close beta tools: add 1 or 5 levels, give a selected resource/structure quantity, grant equipment, or add 50 of every resource. Grants bypass crafting requirements for local testing; normal crafting still checks levels and materials. Hotbar keys 1–6 remain unchanged.

Validation: 37 automated tests cover the new XP and level gates, every material set and perk boost, ore mining requirements, biome spawn zones, connected new cave tunnels, bidirectional portal destinations, and beta grants, alongside existing gameplay tests.

Browser verification for this update: level and item grants, level-12 crafting locks, Abyss/Deep and Core/Abyss return passages, and forest/cave art loaded without console errors. Forest overlay measured about 69 FPS and 0.7 ms of main-thread game work per frame at 0.68× zoom on this machine; terrain worker active.

## Edge polish

Sprites now use thin dark-green/charcoal silhouette outlines baked into the sprite cache. Loose sticks use a higher-resolution drawing with smooth scaling. Bridges are drawn from exact path and river geometry in the terrain worker, with straight edges and perpendicular plank seams instead of the old coarse sampled staircase. Movement and collision boundaries are unchanged. Browser verification showed no console errors and about 1.2 ms/frame of game work at normal zoom on the test machine.


## Pixel interface

The HUD and menus use solid green panels, square timber-colored frames, compact monospace labels, and hard-edged buttons. The small corner title leaves more of the world visible. Side panels stack automatically, and the pouch scrolls within the available height. Hotbar, prompts, and toolbar have dedicated spacing. Crafting, inventory, index, settings, campfire, and beta menus share the same style. Layout checked at 1280x720 and 800x600, including a full resource pouch. Existing HUD visibility settings and shortcuts remain available.


## Creature awareness

Hostile cave creatures now start chasing as soon as the player enters their expanded detection range: 850–1,000 world units depending on species. The protected area at a cave entrance is 135 units around the player; creatures still remain at least 210 units from the entrance itself. This lets them react sooner as the player walks out without attacking someone standing on the entrance. 
pm test covers immediate pursuit at 750 units and entrance protection.


## Wildlife and habitat variety

Foxes, boars, and moss tortoises join rabbits and deer in biome-specific habitats. Cave Slimes appear in upper caves; charging Crystal Beetles appear deeper; Ember Golems inhabit the abyss and core. All underground species scale with depth: health is 1x / 1.8x / 2.8x / 4x, damage is 1x / 1.3x / 1.65x / 2.1x, and pursuit speed rises modestly. Shiny bonuses stack with depth and persist after respawn. Cave loose-stone targets are reduced from 20 to 13 per zone. Trees, shrubs, and boulders have multiple cached silhouettes and biome palettes. Open /variety-preview.html for the local art reference sheet.


Equipped hand rocks, axes, pickaxes, and clubs now use the same recipe artwork as their inventory cards, without the card background. They render over the character's front hand in all four facing directions, including during a swing.


Surface bush spawning now uses scaled spacing and a local crowd limit across overlapping zones. This prevents dense bush walls while retaining forageable patches and the curated starter bushes near the village.

