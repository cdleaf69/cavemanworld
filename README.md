# Embervale

A top-down caveman exploration and crafting game built with HTML, CSS, and modular JavaScript. The Node server uses only the standard library. Artwork is generated locally; no external assets or paid services are required. Players, chat, PvP combat, rafts and placed structures are shared through the local Node server. Inventory, creatures and quests are still local beta state.

## Run

Install Node.js 20.11 or newer, open a terminal in this folder, and run:

```sh
node server.js
```

Open http://localhost:3000. On the same LAN/Wi-Fi, friends open the LAN address printed by the server (currently http://192.168.1.154:3000). If Windows asks for network access, allow the private network. No account or paid service is needed. Use `PORT=3001 node server.js` on macOS/Linux or `$env:PORT=3001; node server.js` in PowerShell to change the port.

Run automated tests with `node --test` or `npm test`.

## Loading and artwork

The complete wilderness is generated off the main thread and cached locally for faster repeat loads. Scenery is deterministic for the current terrain and spawn zones. A temporary loading screen appears on a fresh visit; private browsing works even when caching is unavailable. Spawn-zone or world-geometry changes rebuild the layout automatically. All 57 creature types have original detailed pixel art with cached animation frames; no external artwork is downloaded.

## Multiplayer combat and world style

Friends on the same network can fight with melee weapons, bows and slingshots. Armor reduces damage; walls block attacks and newly spawned players have brief protection. Wooden bases can be broken with axes and stone bases with pickaxes, including bases built by another player. Rafts keep their entire hull inside the water and map bounds.

Biomes have asymmetric natural contours. Paths mostly serve towns, with six short river crossings. The timber, stone, stitched pouch and parchment interface uses original pixel lettering. Steezus guards Cloudspine with telegraphed sulfur rain, summoned Adam and Eve, and skateboard smoke blasts; Bigfoot guards the other two ranges.

## Controls

| Action | Control |
| --- | --- |
| Move and face | WASD |
| Sprint | Shift |
| Beta travel boost | Alt |
| Jump on dry land | Space |
| Attack, shoot, gather, place campfire | Left click |
| Pick up loot, forage, enter/leave buildings and caves | E |
| Craft / inventory / atlas | C / I / M |
| Hotbar (works while sprinting) | 1–6 / Shift+1–6 |
| Eat cooked food | H |
| Dive / surface in the ocean | V |
| Quest journal | J |
| Rotate walls and gates before placement | R |
| Pouch / HUD settings | P / O |
| Zoom | Mouse wheel or + / - |
| Beta item and level tools | 7 |
| Spawn zones / developer editor | F3 / add `?dev=1` to the URL |

## Current gameplay

The surface is 135,000 × 84,000 units with varied biomes, lakes, rivers, an eastern coastline, and four towns. Each fresh game starts at a randomized safe location near a town with nearby beginner resources. The prealpha camp, huts, fixed starter ring, and spawn clearing have been removed. Surface resources use seeded irregular density fields with open glades and grassland patches; buildings, water, roads, landmarks, and cave mouths have placement exclusions.

Gather pebbles and forage a bush, craft a Crude Stone Axe, then gather wood and build better tools. Trees require axes and boulders/ore require suitable pickaxes. Crafting creates inventory items; assign them to the six-slot hotbar. Armor provides protection and a specialty bonus. Matching axe/pickaxe/club sets improve armor bonuses. Levels unlock materials at 3/6/9/12 across four cave depths.

Coins are one shared currency, displayed beside health and XP. Begin with zero coins. Sell resources and creature drops at general shops to earn coins, then spend them on supplies, arrows, forging, and casino games. Defeats provide XP and loot instead of direct coins. House chests refill with saleable supplies every two minutes. Casino games share the inventory's coins and offer no free refill.

Fishing rods catch 18 increasingly large, valuable fish species from lake shores and the ocean. Fueled campfires cook meat and fish. Cooked meat heals 40 health; cooked fish heals 30. Enter water to swim automatically at 65% of land speed. Jumping requires dry land. A raft supports offshore fishing. Diving enables underwater combat.

Four cave layers use the same north-up coordinates and bounds as the surface. Every surface entrance emerges directly underneath its surface position, and passages between depths preserve their coordinates. Broad chambers connect through a network of walkable tunnels with alternate routes. Entrances explicitly show `(Descend)` or `(Ascend)`: descending rocks are warm ochre and ascending rocks are cool blue, while the opening remains dark.

Enemy pools vary by biome and depth. New species include Grey Wolves, Cave Spiders, Root Stalkers, Frost Serpents, Dune Burrowers, Bog Spitters, Obsidian Sentinels, Crystal Moths, Void Reapers, and Magma Brutes. Sinew, fangs, and essence are new saleable drops and bow upgrade materials. Cave enemies become stronger with depth, while shiny variants improve drops. Defeat returns the player to randomized safe town outskirts with inventory retained.

Craft only the starting Wood Bow. At a blacksmith, evolve that same owned item through Bound Bow, Reinforced Bow, Quartz Recurve, Moonstone Longbow, Cobalt Warbow, and Adamantite Greatbow. Evolution costs materials, has level requirements, and progressively improves damage, firing speed, and artwork. These upgrades do not require an equipped club. Existing forge quality upgrades for other tools still use the equipped club's material to determine odds.

Depth 2–4 ores also craft swords, spears, and warhammers. Swords deal more damage than matching clubs, swing faster, and cost more ore. Spears have longer reach. Warhammers have strong damage and knockback with slower swings. Clicking a creature takes priority over tree/ore harvesting; melee weapons can also attack through an overlapping resource click target.

## Ocean and mountain expeditions

The surface now has **twice the previous 90,000 × 63,000 area**, fifteen frontier biome regions, three inland mountain ranges, and six additional cave entrances. All four cave layers keep aligned coordinates and gain connected frontier chambers. The atlas marks Marlow and the mountain ranges. NPCs wander woodland and cave rooms with seven distinct skin, hair, clothing, and facial styles; every third errand is a larger expedition.

**Marlow the Fisherman** waits on the eastern beach near **118,019, 14,500** (the shoreline bends). Press E beside him, or J to review quest objectives and his location. Hand-ins require returning to the NPC. Supplies and fish are consumed; wreck proof counts distinct chests, not repeated claims. His ten trials progressively require higher-ranked fish, diving resources, creature defeats, and deep wreck surveys. Rewards include a starter rod, a Diver Wrap, a Reef Rod, a raft, an Abyss Rod, and finally **Tidekeeper Armor**. Equip armor in inventory; rewards and ordinary crafts never auto-equip. Tidekeeper Armor is a quest reward, not a free crafting recipe.

Enter ocean water and press **V** to dive. Swimming more than 750 units offshore for four seconds also dives automatically, except on a raft or while gliding. The separate seafloor layer contains coral, pearls, kelp, wreck treasure, crabs, turtles, jellyfish, rays, sharks, eels, squid, and fish. Breath normally lasts 35 seconds; a Diver Wrap holds 70 seconds after refilling at the surface. No air causes eight damage per second, ignoring armor. V surfaces at the same position. Tidekeeper Armor allows unlimited breathing. Deep predators are stronger. Wreck chests can be claimed once per page session and hold pearls, sea essence, coins, and—in deep wrecks—sunken relics.

Fish sizes and raw sale prices rise from Sprat (10 cm, 2 coins) to Crown Leviathan (465 cm, 1,250 coins). Four strange offshore species—Lantern Eel, Prism Sailfin, Abyssal Angler and Crown Leviathan—require increasingly deep casting water and advanced fishing progress. Perch, trout and sturgeon inhabit freshwater; salmon occur in both water types. Higher-ranked fish need quest progression, better rods, and deeper casting water. Deep-water fishing also excludes progressively smaller species, so distant ocean casts consistently produce larger catches. Cook any caught species in a fueled campfire; it becomes cooked fish that heals 30. Valuable trophy fish are usually better sold or saved for quests.

Mountain trails climb toward flat, buildable summit plateaus. Terrain, actors, loot, the following camera, and mouse interactions share the elevation projection. Players can walk across the entire mountain, including every slope away from the trail. Dedicated mountain habitats add naturally spaced harvestable trees, bushes, rocks, and tufts across all sides of the slopes and on flat tops. Placement keeps the trail lane, boss clearing, and marijuana patches open; lowland clutter and buildings remain excluded from slopes. F3 shows the mountain habitats, summit-harvest and ocean-forage zones; developer mode can edit their boundaries and allowed resources. Soft slope lighting, stronger continuous elevation projection, high-altitude haze, snow on Frostpeak, and clouds provide height cues. The former contour lines and cliff walls have been removed. Eight hostile mountain lions patrol each range, climb the slopes, and drop meat, hide, fangs, and sinew. Mountain terrain is sampled at finer detail to avoid oversized stepped color boundaries. Ranges: **Pinecrest (61,000, 24,000)**, **Cloudspine (73,000, 43,000)**, and **Frostpeak (34,000, 48,000)**.

Each range has two small marijuana clusters (six plants total), summit fiber, sky crystals, nests, and **one Bigfoot boss**. Plant harvests yield one unit 84% of the time, two 13%, and three 3%; plants and summit nodes return after five minutes. Bigfoot uses close melee, a telegraphed feces throw, and rolling logs. Feces splashes where it lands, leaving a visible 72-unit puddle for 12 seconds. Standing in it deals 12 raw damage every 0.9 seconds (armor applies); overlapping puddles share a damage cooldown. Step away to avoid further damage. Bosses return after ten minutes and drop fur, feathers, crystals, and essence. Summit Ranger Armor uses these mountain materials and has a speed perk; crafting its matching technical tool set improves the multiplier.

## Building, processing, and transport

Craft a kit, drag it from inventory into the hotbar, select it, and click nearby ground. R rotates walls and gates. Foundations and wall pieces snap to a 128-unit grid. Buildings require dry, flat ground; summit plateaus are allowed, slopes are not. Built walls block movement and projectiles. Mining wood pieces with an axe or stone/machines with a pickaxe takes three clicks and returns the kit, queued input, stored output, and unused whole fuel units. Structures process while this page runs, including while menus are open; there is no offline production.

| Craft | Use |
| --- | --- |
| Plant Box | Plant a seed, add one fresh water, and harvest when ripe. Twelve crops have growing sprites, including berries (45 sec), carrots (55), alpine herb (65), moonflower (80), and marijuana (90). Each harvest returns two seeds. |
| Waterskin | Craft from two hide and four leaves; select it and click nearby surface water to collect up to 12 water units. |
| Drying Shack | Load fresh marijuana and wood. One wood fuels three cycles; each unit dries in 30 seconds. Collect it and use it from inventory or a selected hotbar slot. |
| Wood Foundation / Wood Wall / Stone Wall / Wood Gate / Wood Roof | Build a base. E opens or closes a gate; an open gate allows passage. |
| Storage Chest | Deposit up to ten selected resources per click and withdraw stored contents. |
| Baited Fish Trap | Place at a lake or shallow ocean shore. One leaf bait catches one common fish in 45 seconds. |
| Ore Extractor | Place in a cave within 400 units of ore. One wood fuels a 20-second attempt using your best crafted pickaxe on the actual deposit. Higher ores still require suitable tools. |
| Timber Rig | Place within 400 units of a tree. Wood fuels a 25-second attempt using your best crafted axe on the actual tree. |
| Restoration Totem | Essence fuels 30 seconds of healing at two health per second within 240 units on the same layer. |
| Woodland Scooter | Select for 1.8× land speed; it cannot climb mountain slopes. |
| Reed Raft | Place in open water, stand by the marked driver seat, and press E. Steer with WASD at 3.5× base speed; E stops steering so you can fish from the deck. |
| Crystal Glider | Select for 5× flight speed, four directional wing poses and a gentle vertical bob, plus a downhill boost. Collision remains active. |
| Climbing Grapple | Click within 450 units to pull along a clear route. Walls and blocked slopes stop the rope. |
| Crystal Drill | A motorized pickaxe with 22 mining power and 28 harvest yield. |

Surface bushes provide seeds and a sample crop. Mountain marijuana provides marijuana seeds. Plant boxes pause without water, hold harvested crops until collected, and return unfinished seeds, stored crops, and unused water when mined. Berries, carrots, alpine herbs, and moonflowers restore 12, 18, 25, and 30 health respectively; use them from inventory or the hotbar. Marijuana still requires a drying shack before use. Boxes require flat, dry ground and work in caves as well as on the surface.

Dried marijuana temporarily multiplies maximum/current health and earned XP by **1.5 for 60 seconds**. Using another refreshes the duration without stacking. Health returns proportionally when the effect ends. Fish traps and mining machines store output; they do not award unattended XP or generate resources from nonexistent deposits.

For quick local beta visits, use `http://localhost:3000/?start=fisherman`, `?start=pinecrest`, `?start=pinecrest-summit`, `?start=whisper-cave`, or `?layer=ocean`. The normal URL still starts safely near a town. Key **7** provides existing beta item and level controls; Alt retains the travel boost.

Terrain workers preload a 1,024-unit (two-chunk) buffer beyond the viewport. Visible tiles receive priority; up to 12 requests run in the queue and a bounded 512-tile cache retains nearby terrain. Only visible tiles are drawn, and the fallback renderer still generates at most one tile per frame. On foot, climbing a slope slightly reduces speed and descending gives a small speed increase; flat terrain and summit plateaus retain normal speed.

## Casino games

All payouts below include the original wager; all currency is fictional gameplay currency.

- Slots: triples pay each symbol's displayed multiplier, pairs return the wager, other spins lose.
- Blackjack: six-deck shoe; dealer stands on all 17s, including soft 17; natural blackjack pays 3:2. Hit, stand, double on the first two cards (including after split), split equal-value pairs up to four hands, and late surrender on the unsplit initial hand. Split aces receive one card each and cannot be resplit. Split-hand 21 pays 1:1, not natural-blackjack odds. Insurance is offered against an ace before the dealer peek and pays 2:1; pushes return the wager. Every split hand has its own cards, wager, result, and active indicator.
- Five-card draw poker: hold any cards, then draw replacements once. Jacks or better ×1, two pair ×2, trips ×3, straight ×4, flush ×6, full house ×9, quads ×25, straight flush ×50, royal flush ×800. This is single-player draw poker with a pay table, not Texas Hold'em against opponents.
- European roulette: 0–36, single zero. Red/black/even/odd pay ×2; straight-up zero pays ×36. Zero loses outside bets.

Blackjack varies between casinos. This implementation uses the explicit table rules shown above rather than mixing incompatible variations. Reference: Massachusetts Gaming Commission, [Blackjack rules](https://massgaming.com/wp-content/uploads/RULES-Blackjack-2-11-19.pdf).

## Project structure

- `src/main.js`: browser input, game loop, inventory/crafting/HUD wiring, combat and interactions.
- `src/world.js`, `src/town-data.js`, `src/bridges.js`: geography, collision, building data, cave connectivity.
- `src/spawn-zones.js`, `src/spawner.js`, `src/spawnables.js`: independent resource zones and runtime nodes.
- `src/creatures.js`, `src/combat.js`, `src/combat-objects.js`: enemy behavior, combat, loot, projectiles.
- `src/crafting.js`, `src/perks.js`, `src/bow-upgrades.js`: recipes, equipment, progression, bow evolution.
- `src/town-services.js`, `src/town-ui.js`: trading, forging, supply chests.
- `src/casino.js`, `src/casino-ui.js`: shared-wallet game rules and menus.
- `src/pixel-renderer.js`, `src/adventure-art.js`, `src/player-animation.js`, and other art modules: cached procedural rendering, animation, and worker-generated terrain.
- `src/frontier-world.js`, `src/expeditions.js`, `src/frontier-ui.js`: mountain/ocean geography, breath, quests, NPCs, timed effects, treasure and menus.
- `src/fish-species.js`, `src/frontier-creatures.js`: catch progression, marine species, and Bigfoot.
- `src/frontier-items.js`, `src/frontier-structures.js`, `src/frontier-art.js`, `src/frontier-item-art.js`: new recipes, machines, transport and cached original artwork.
- `test/`: automated gameplay and rule checks.
- `reviews/`: scenes and sprite sheet rendered directly from the updated game code.

HUD preferences and developer spawn edits persist in local storage. Spawn-zone schema v6 expands the default wilderness, mountain and ocean habitats, while retaining other saved zone edits. Inventory, coins, equipment, house timers, quests and progression reset on refresh. Shared buildings last until the Node server stops; builder-operated machines pause when their builder leaves. The LAN prototype trusts clients for inventories and movement: it is not a public competitive server. Shared combat, resource depletion and quest state are future integration points.

## October 4 expansion and LAN beta

- World area doubled to 135,000 × 84,000. Great Mirror Lake is at 98,600, 62,500. The wider river crosses the entire map north to south. The eastern ocean has about 17,000 units of offshore space.
- Pinecrest, Cloudspine and Frostpeak now rise to 2,200 / 3,000 / 3,400 m, with wider fully walkable slopes, about 310 trees, 170 bushes and 260 rocks per range, and flat summit plateaus. Bush density is limited across overlapping spawn zones.
- Twelve growable crops: heartland berries/carrots; woodland mushrooms/moonflowers; tundra frost berries/herbs; marsh rice/lotus; badland melons/cactus fruit; volcanic peppers; mountain marijuana. Forage their plants for food and seeds, then grow them in watered plant boxes. Every crop can be traded.
- Wood foundations render beneath actors. Wood/stone walls fade while obscuring the player; roofs fade underneath. Craft Wood Wall and Wood Roof kits alongside existing Stone Walls and gates. An axe recovers wood pieces; a pickaxe recovers stone and machines.
- Craft a Reed Raft kit, assign it from inventory, and click open water to place. The entire hull must fit in water. Stand near its marked driver seat and press E to steer with WASD; press E again to stop. Stand on the deck, equip a rod, and fish offshore. One driver per raft; other LAN players can ride on deck. Walking off the deck returns you to swimming.
- Crystal Glider raises both pilot and wing roughly 92 units above terrain, with four directional poses and gentle bobbing. Flight travels at 5× walking speed and gains a downhill boost.
- The minimap displays the surrounding 5,200 units; M displays the full world atlas.
- Server uses built-in HTTP + server-sent events. It assigns player IDs, broadcasts real player positions and chat, and owns the shared structure registry. Placement, distance, material-specific damage, hit cooldowns and driver-seat occupancy are checked on the server. No simulated online players are created. Chat and display name are in O → Local network.

Server modules: `src/lan-server.js`; browser transport: `src/lan-client.js`; interaction integration hooks: `src/network-hooks.js`. No dependencies need installing: **node server.js** is the exact startup command from this folder.

## River bridges and quest menus

River swimming has a gentle downstream current that follows its bends. Swimmers pass underneath footbridges. Walk onto a bridge from shore, or press Space near its deck to jump onto it. Falling off the side returns you to the water. Lakes and oceans do not inherit the river current.

Talking to an NPC opens that person's quest menu with no quest-giver picker. J opens the standalone journal for browsing other quests. The minimap shows the complete region, while M opens a smoother, higher-resolution atlas. Atlas generation uses a separate worker so it does not delay nearby terrain tiles.


## October 5 performance pass

- Terrain preloads up to four 512-unit chunks (2,048 units) beyond the screen, twice the previous margin. A pool of up to two workers keeps only one job per worker in flight, so new visible chunks take priority over obsolete queued scenery. Preload plans are limited to 448 tiles within the existing 512-tile cache; evicted bitmaps are closed.
- Terrain biome sampling uses a spatial influence index with the exact same blend order and cutoff. Town shading avoids a temporary array per sample. Graphics, sprite detail, terrain resolution, world layout and map resolution are unchanged.
- Resource respawn checks visit only inactive nodes rather than the roughly 130,000-node world. Direct activity changes, replacements, imported inactive nodes and removal remain supported.
- Unchanged player positions use a 1.5-second heartbeat; moving players retain 150-ms updates. Equipment changes, attacks and interaction synchronization still send immediately. Machine state is transmitted only when it changes, with retries after failed requests.
- Static assets use bounded server caching, gzip and ETags; live multiplayer events are serialized once per broadcast. Collision and projectile checks avoid repeated registry copies.

Local Chrome checks: representative terrain tiles and the complete 1,280-pixel atlas retained identical pixel checksums. In one before/after run, grass generation was 25.6 → 18.2 ms, mountain 115.1 → 98.2 ms, and atlas 2,203 → 1,866 ms; cave generation was essentially unchanged. These are local measurements, not guaranteed frame-rate or hosting-capacity gains. Main JavaScript transfer fell from 69,792 to 19,903 bytes with gzip; idle traffic measured four position updates in six seconds, while movement kept eight updates in 1.2 seconds. A real worker check loaded 121 chunks, including terrain over 1,500 units beyond the view, without browser errors.


## Six cave levels and crafting-table progression

The surface now leads through six underground levels: Upper Caves (1), Deep Caves (2), Abyss (3), World Core (4), Molten Mantle (5), and Primordial Vault (6). Each passage has a safe return route. Caves have asymmetric chambers, winding passages of varying width, branch grottoes, and rock pillars that leave the main routes clear. Terrain, collision, resource habitats and the high-resolution cave atlas share the same geometry; the atlas is generated in a background worker. Surface scenery stays in its previous positions.

Ores are grouped and labeled **Ore Level 1–6** in the item index, carried-resource displays and mining prompts. Ore level means underground depth; **Player Level** is the separate crafting requirement. Added level-five ores: Viridium, Glacium, Tideglass, Orichalcum and Hellstone. Level-six ores: Worldroot, Starfrost, Levianite, Solarium and Voidsteel. Each has biome equipment, mining requirements, sale prices and matching armor perks. Deeper creatures scale up with the new equipment.

The C menu begins with 29 basic recipes. Crafting a table unlocks its recipe tier permanently for the current inventory session, and reveals the next table upgrade. You can assign a table kit to the hotbar, place it in a base or cave, and press E to open your workshop. Crafting tables do not automatically equip anything. Table unlocks, inventory and progression follow the existing session reset rules.

| Table | Required player level | Unlocks |
| --- | ---: | --- |
| Bark Workbench | 3 | Ore level 1 equipment |
| Stone Forge | 6 | Ore level 2 equipment |
| Crystal Workbench | 9 | Ore level 3 equipment |
| Runic Forge | 12 | Ore level 4 equipment |
| Mantle Anvil | 15 | Ore level 5 equipment |
| Astral Workbench | 18 | Ore level 6 equipment |

The first table needs wood, stone and iron. Later upgrades use wood, stone and any mix of biome ores from the preceding cave level. Leveling up alone does not unlock advanced recipes; you must craft the table. Tables can be rebuilt and shared as placed structures. An axe recovers a Bark Workbench, while a pickaxe recovers the stronger tables. The item index remains an encyclopedia for browsing all items.

### Equipment and character art

Equipment changes construction across all six ore levels, with different blade silhouettes, club heads, spear tips, hammer heads, guards, grips and armor plates. Biome motifs distinguish materials at the same depth. Bow evolutions, fishing rods and crafting workshops also have separate designs; inventory and held tool art share the same source. NPC hairstyles include curls, braids, ponytails, swept hair, shaved heads and mohawks, with distinct shopkeepers and a silver-haired casino dealer.

River shore colors are sampled at the terrain canvas's full resolution along the banks, matching the finer bridge rendering. This refinement is baked into cached terrain tiles; river geometry, currents and bridge entry rules stay consistent with the water beneath them.

The expanded atlas supports scroll-wheel zoom toward the pointer (1×–8×) and drag-to-pan. FULL MAP resets the view, and reopening the atlas shows the whole map. Labels and markers stay readable while zooming. Player movement follows the tangent of cave walls and obstacles on glancing contact, while head-on impacts and enclosed corners still block movement.

New visitors see a brief, six-step quick start covering gathering, equipment, XP and crafting tables, cooking and healing, base building, and exploration. Dismissing it with X, LET’S PLAY, or Escape is remembered in browser storage across visits. The expanded atlas fits its header, map, controls and notes within the viewport, with no scrolling frame around the map.


### Rod upgrades, bait and reeling

Bring any fishing rod to a town blacksmith for five permanent upgrades on that rod. Each upgrade adds 80 cast range, 0.20 luck and 0.35 strength; later upgrades require rarer materials and more coins. No club is needed. Higher luck favors larger fish within the species available to your quest progress and casting depth. Strength increases reel progress per click and reduces the fish's pullback. Rods gain visible bindings with upgrades.

Talk to Marlow at the beach to collect a free starter pack of ten worms and buy bait. Choose bait there or in the inventory's Fishing Tackle section. One bait is consumed per valid cast; invalid casts consume none.

| Bait | Bundle price | Luck | Reel strength | Bite speed |
| --- | --- | --- | --- | --- |
| Worms | 10 for 1 coin | 1× | 1× | 1× |
| Fat Grubs | 5 for 10 coins | 1.35× | 1.10× | 1.15× |
| Glow Larvae | 5 for 25 coins | 1.75× | 1.20× | 1.30× |
| Royal Chum | 5 for 60 coins | 2.30× | 1.40× | 1.50× |
| Abyss Lure Bait | 3 for 90 coins | 3× | 1.65× | 1.65× |

Fish shadows, ripples and bubbles appear around the bait before a bite. Once it bites, repeatedly left-click the game world or tap E to fill the reel meter. Larger fish take more clicks and pull the meter back while you pause. Holding E does not automatically reel. Take too long or walk too far away and the fish escapes. A completed reel awards exactly one fish and its XP. Bait bonuses multiply rod stats; they do not bypass species habitat, quest or depth requirements.


### Sound effects

Locally bundled licensed effects cover alternating footsteps (faster cadence and slightly faster playback while sprinting), bridge/cave footsteps, swimming and entry splashes, quiet underwater ambience, nearby wildlife and cave creatures, and short gibberish greetings/goodbyes at actual NPC conversations. The standalone quest journal does not play NPC chatter. Nearby creatures call periodically with distance attenuation and stereo positioning; voices and ambience are limited to avoid constant overlapping noise. Sound effects load and decode on demand after a player gesture, with decoded buffers reused. Settings includes a sound-effects volume slider that remembers the setting; zero mutes effects. Source credits and the adapted NPC voice's CC BY 4.0 attribution are available through the Sound credits link and `assets/audio/sfx/CREDITS.html`.

Land animal art uses angular shoulder, flank, jaw and shell planes with leaner quadruped bodies and articulated narrow legs. Texture, species details, six-frame animation and the existing sprite cache remain in place.


Crafting is organized into Tools, Weapons, Armor, Fishing, Building, Workshops, Machines and Travel tabs. Category and page selections survive reopening the menu. Search and ore-tier filters narrow the current category; recipes use short pages (four on desktop, two on phones) with category controls and page navigation kept in view. Workshop unlock requirements still control which recipes are revealed. The separate Item Index remains available.


### Underground 7-Eleven and relic crafting

Descend from the Primordial Vault (cave layer 6) into the seventh underground layer, a convenience store with checkout, stocked aisles, refrigerators and a lottery counter. Darren sleeps on cardboard in a patched coat. Talk to him for a repeatable trade: any mix of 7 fresh/dried marijuana pays 500 coins and 75 XP. His trade counter also buys marijuana, seeds, Bigfoot Fur, Sulfur, Old Testaments and Steezus’s Books. General shops cannot buy or sell those items.

At player level 5 with a Bark Workbench unlocked, craft Steezus’s Book from 1 Old Testament and 7 Sulfur in the Weapons tab. It is a collectible relic, can be crafted repeatedly and is carried as a resource. The Item Index includes guides for player levels 1–20, required workshops, materials and special quest rewards. Inventory resources and equipment use labeled picture tiles.

Tickets cost 25 coins at the store’s lottery machine. Rub the silver panel with a mouse or finger to reveal the result: 3% Steezus’s Book, 15% 1–3 dried marijuana, 42% 20/40/75/150 coins, 40% no prize. Only one unclaimed ticket is allowed; reopening the machine preserves its scratch progress during the current game session. A prize can only be claimed once.
