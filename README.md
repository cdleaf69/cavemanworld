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
| Pouch / HUD settings | P / O |
| Zoom | Mouse wheel or + / - |
| Beta item and level tools | 7 |
| Spawn zones / developer editor | F3 / add `?dev=1` to the URL |

## Current gameplay

The surface is 54,000 × 35,000 units with varied biomes, lakes, rivers, an eastern coastline, and four towns. Each fresh game starts at a randomized safe location near a town with nearby beginner resources. The prealpha camp, huts, fixed starter ring, and spawn clearing have been removed. Surface resources use seeded irregular density fields with open glades and grassland patches; buildings, water, roads, landmarks, and cave mouths have placement exclusions.

Gather pebbles and forage a bush, craft a Crude Stone Axe, then gather wood and build better tools. Trees require axes and boulders/ore require suitable pickaxes. Crafting creates inventory items; assign them to the six-slot hotbar. Armor provides protection and a specialty bonus. Matching axe/pickaxe/club sets improve armor bonuses. Levels unlock materials at 3/6/9/12 across four cave depths.

Coins are one shared currency, displayed beside health and XP. Begin with zero coins. Sell resources and creature drops at general shops to earn coins, then spend them on supplies, arrows, forging, and casino games. Defeats provide XP and loot instead of direct coins. House chests refill with saleable supplies every two minutes. Casino games share the inventory's coins and offer no free refill.

Fishing rods catch fish from lake shores. Fueled campfires cook meat and fish. Cooked meat heals 40 health; cooked fish heals 30. Enter water to swim automatically at 65% of land speed. Jumping, fishing, and ranged firing require dry land.

Four cave layers use the same north-up coordinates and bounds as the surface. Every surface entrance emerges directly underneath its surface position, and passages between depths preserve their coordinates. Broad chambers connect through a network of walkable tunnels with alternate routes. Entrances explicitly show `(Descend)` or `(Ascend)`: descending rocks are warm ochre and ascending rocks are cool blue, while the opening remains dark.

Enemy pools vary by biome and depth. New species include Grey Wolves, Cave Spiders, Root Stalkers, Frost Serpents, Dune Burrowers, Bog Spitters, Obsidian Sentinels, Crystal Moths, Void Reapers, and Magma Brutes. Sinew, fangs, and essence are new saleable drops and bow upgrade materials. Cave enemies become stronger with depth, while shiny variants improve drops. Defeat returns the player to randomized safe town outskirts with inventory retained.

Craft only the starting Wood Bow. At a blacksmith, evolve that same owned item through Bound Bow, Reinforced Bow, Quartz Recurve, Moonstone Longbow, Cobalt Warbow, and Adamantite Greatbow. Evolution costs materials, has level requirements, and progressively improves damage, firing speed, and artwork. These upgrades do not require an equipped club. Existing forge quality upgrades for other tools still use the equipped club's material to determine odds.

Depth 2–4 ores also craft swords, spears, and warhammers. Swords deal more damage than matching clubs, swing faster, and cost more ore. Spears have longer reach. Warhammers have strong damage and knockback with slower swings. Clicking a creature takes priority over tree/ore harvesting; melee weapons can also attack through an overlapping resource click target.

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
- `test/`: automated gameplay and rule checks.
- `reviews/`: scenes and sprite sheet rendered directly from the updated game code.

HUD preferences and developer spawn edits persist in local storage. New cave coordinates use spawn-zone schema v4, avoiding incompatible pre-update cave edits. Inventory, coins, equipment, house timers, and progression reset on refresh. Network hooks remain a future multiplayer integration point.
