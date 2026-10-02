# Embervale

A top-down caveman exploration and crafting game built with HTML, CSS, and modular JavaScript. The Node server uses only the standard library. Artwork is generated locally; no external assets or paid services are required. Multiplayer is not connected and gameplay state currently lasts for the page session.

## Run

Install Node.js 20.11 or newer, open a terminal in this folder, and run:

```sh
node server.js
```

Open http://localhost:3000. Use `PORT=3001 node server.js` on macOS/Linux or `$env:PORT=3001; node server.js` in PowerShell to change the port.

Run automated tests with `node --test` or `npm test`.

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
| Hotbar | 1–6 |
| Eat cooked food | H |
| Dive / surface in the ocean | V |
| Quest journal | J |
| Rotate walls and gates before placement | R |
| Pouch / HUD settings | P / O |
| Zoom | Mouse wheel or + / - |
| Beta item and level tools | 7 |
| Spawn zones / developer editor | F3 / add `?dev=1` to the URL |

## Current gameplay

The surface is 90,000 × 63,000 units with varied biomes, lakes, rivers, an eastern coastline, and four towns. Each fresh game starts at a randomized safe location near a town with nearby beginner resources. The prealpha camp, huts, fixed starter ring, and spawn clearing have been removed. Surface resources use seeded irregular density fields with open glades and grassland patches; buildings, water, roads, landmarks, and cave mouths have placement exclusions.

Gather pebbles and forage a bush, craft a Crude Stone Axe, then gather wood and build better tools. Trees require axes and boulders/ore require suitable pickaxes. Crafting creates inventory items; assign them to the six-slot hotbar. Armor provides protection and a specialty bonus. Matching axe/pickaxe/club sets improve armor bonuses. Levels unlock materials at 3/6/9/12 across four cave depths.

Coins are one shared currency, displayed beside health and XP. Begin with zero coins. Sell resources and creature drops at general shops to earn coins, then spend them on supplies, arrows, forging, and casino games. Defeats provide XP and loot instead of direct coins. House chests refill with saleable supplies every two minutes. Casino games share the inventory's coins and offer no free refill.

Fishing rods catch 14 increasingly large, valuable fish species from lake shores and the ocean. Fueled campfires cook meat and fish. Cooked meat heals 40 health; cooked fish heals 30. Enter water to swim automatically at 65% of land speed. Jumping requires dry land. A raft supports offshore fishing. Diving enables underwater combat.

Four cave layers use the same north-up coordinates and bounds as the surface. Every surface entrance emerges directly underneath its surface position, and passages between depths preserve their coordinates. Broad chambers connect through a network of walkable tunnels with alternate routes. Entrances explicitly show `(Descend)` or `(Ascend)`: descending rocks are warm ochre and ascending rocks are cool blue, while the opening remains dark.

Enemy pools vary by biome and depth. New species include Grey Wolves, Cave Spiders, Root Stalkers, Frost Serpents, Dune Burrowers, Bog Spitters, Obsidian Sentinels, Crystal Moths, Void Reapers, and Magma Brutes. Sinew, fangs, and essence are new saleable drops and bow upgrade materials. Cave enemies become stronger with depth, while shiny variants improve drops. Defeat returns the player to randomized safe town outskirts with inventory retained.

Craft only the starting Wood Bow. At a blacksmith, evolve that same owned item through Bound Bow, Reinforced Bow, Quartz Recurve, Moonstone Longbow, Cobalt Warbow, and Adamantite Greatbow. Evolution costs materials, has level requirements, and progressively improves damage, firing speed, and artwork. These upgrades do not require an equipped club. Existing forge quality upgrades for other tools still use the equipped club's material to determine odds.

Depth 2–4 ores also craft swords, spears, and warhammers. Swords deal more damage than matching clubs, swing faster, and cost more ore. Spears have longer reach. Warhammers have strong damage and knockback with slower swings. Clicking a creature takes priority over tree/ore harvesting; melee weapons can also attack through an overlapping resource click target.

## Ocean and mountain expeditions

The surface now has **three times the previous area**, nine additional biome regions, three inland mountain ranges, and six additional cave entrances. All four cave layers keep aligned coordinates and gain connected frontier chambers. The atlas marks Marlow and the mountain ranges. NPCs wander woodland and cave rooms with seven distinct skin, hair, clothing, and facial styles; every third errand is a larger expedition.

**Marlow the Fisherman** waits on the eastern beach near **87,219, 14,500** (the shoreline bends). Press E beside him, or J to review quest objectives and his location. Hand-ins require returning to the NPC. Supplies and fish are consumed; wreck proof counts distinct chests, not repeated claims. His ten trials progressively require higher-ranked fish, diving resources, creature defeats, and deep wreck surveys. Rewards include a starter rod, a Diver Wrap, a Reef Rod, a raft, an Abyss Rod, and finally **Tidekeeper Armor**. Equip armor in inventory; rewards and ordinary crafts never auto-equip. Tidekeeper Armor is a quest reward, not a free crafting recipe.

Enter ocean water and press **V** to dive. Swimming more than 750 units offshore for four seconds also dives automatically, except on a raft. The separate seafloor layer contains coral, pearls, kelp, wreck treasure, crabs, turtles, jellyfish, rays, sharks, eels, squid, and fish. Breath normally lasts 35 seconds; a Diver Wrap holds 70 seconds after refilling at the surface. No air causes eight damage per second, ignoring armor. V surfaces at the same position. Tidekeeper Armor allows unlimited breathing. Deep predators are stronger. Wreck chests can be claimed once per page session and hold pearls, sea essence, coins, and—in deep wrecks—sunken relics.

Fish sizes and raw sale prices rise from Sprat (10 cm, 2 coins) to Coelacanth (127 cm, 250 coins). Perch, trout and sturgeon inhabit freshwater; salmon occur in both water types. Higher-ranked fish need quest progression, better rods, and deeper casting water. Cook any caught species in a fueled campfire; it becomes cooked fish that heals 30. Valuable trophy fish are usually better sold or saved for quests.

Mountain trails climb toward flat, buildable summit plateaus. Terrain, actors, loot, the following camera, and mouse interactions share the elevation projection. Ordinary trees, buildings, and resource clutter are excluded from slopes. F3 also shows the separate summit-harvest and ocean-forage zones; developer mode can edit their boundaries and allowed resources. Cliffs and clouds provide height cues. Ranges: **Pinecrest (61,000, 24,000)**, **Cloudspine (73,000, 43,000)**, and **Frostpeak (34,000, 48,000)**.

Each range has two small marijuana clusters (six plants total), summit fiber, sky crystals, nests, and **one Bigfoot boss**. Plant harvests yield one unit 84% of the time, two 13%, and three 3%; plants and summit nodes return after five minutes. Bigfoot uses close melee, a telegraphed feces throw, and rolling logs. Bosses return after ten minutes and drop fur, feathers, crystals, and essence. Summit Ranger Armor uses these mountain materials and has a speed perk; crafting its matching technical tool set improves the multiplier.

## Building, processing, and transport

Craft a kit, drag it from inventory into the hotbar, select it, and click nearby ground. R rotates walls and gates. Foundations and wall pieces snap to a 128-unit grid. Buildings require dry, flat ground; summit plateaus are allowed, slopes are not. Built walls block movement and projectiles. Mining any placed structure with a pickaxe takes three clicks and returns the kit, queued input, stored output, and unused whole fuel units. Structures process while this page runs, including while menus are open; there is no offline production.

| Craft | Use |
| --- | --- |
| Drying Shack | Load fresh marijuana and wood. One wood fuels three cycles; each unit dries in 30 seconds. Collect it and use it from inventory or a selected hotbar slot. |
| Wood Foundation / Stone Wall / Wood Gate | Build a base. E opens or closes a gate; an open gate allows passage. |
| Storage Chest | Deposit up to ten selected resources per click and withdraw stored contents. |
| Baited Fish Trap | Place at a lake or shallow ocean shore. One leaf bait catches one common fish in 45 seconds. |
| Ore Extractor | Place in a cave within 400 units of ore. One wood fuels a 20-second attempt using your best crafted pickaxe on the actual deposit. Higher ores still require suitable tools. |
| Timber Rig | Place within 400 units of a tree. Wood fuels a 25-second attempt using your best crafted axe on the actual tree. |
| Restoration Totem | Essence fuels 30 seconds of healing at two health per second within 240 units on the same layer. |
| Woodland Scooter | Select for 1.8× land speed; it cannot climb mountain slopes. |
| Reed Raft | Select for 2.3× base speed on surface water. Cast with the best rod in your inventory; V dives beneath it. |
| Crystal Glider | Select for 3.2× land speed and an additional downhill boost. Collision remains active. |
| Climbing Grapple | Click within 450 units to pull along a clear route. Walls and blocked slopes stop the rope. |
| Crystal Drill | A motorized pickaxe with 22 mining power and 28 harvest yield. |

Dried marijuana temporarily multiplies maximum/current health and earned XP by **1.5 for 60 seconds**. Using another refreshes the duration without stacking. Health returns proportionally when the effect ends. Fish traps and mining machines store output; they do not award unattended XP or generate resources from nonexistent deposits.

For quick local beta visits, use `http://localhost:3000/?start=fisherman`, `?start=pinecrest`, `?start=pinecrest-summit`, `?start=whisper-cave`, or `?layer=ocean`. The normal URL still starts safely near a town. Key **7** provides existing beta item and level controls; Alt retains the travel boost.

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

HUD preferences and developer spawn edits persist in local storage. New cave coordinates use spawn-zone schema v5 (v4 edits migrate, while the meadow boundary and new habitats expand), avoiding incompatible pre-update cave edits. Inventory, coins, equipment, house timers, quests, placed buildings, and progression reset on refresh. Network hooks remain a future multiplayer integration point.
