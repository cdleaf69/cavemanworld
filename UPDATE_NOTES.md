# October 1, 2026 update

Implemented the requested shared currency, resource-sale economy, visible coin HUD, building separation, randomized safe spawns, removal of the prealpha camp, broader resource coverage with varied clearings, expanded geographically aligned caves, directional passage labels/colors, revised side animation, new enemies/drops, smith-only bow evolution, higher-tier melee variants, and creature-over-resource click priority.

The casinos now use inventory coins. Blackjack adds independent split hands, resplits to four hands, split-ace restrictions, double down, insurance before dealer peek, late surrender, and correct separate-hand payouts. Added single-player five-card draw poker and European single-zero roulette. The exact blackjack table rules appear in the menu and README.

Validation: 79 automated tests pass. All JavaScript syntax checks and the whitespace check pass. Town, cave, passage, species, and side-motion scenes were rendered using the actual game renderer and inspected. Live browser verification was unavailable because the browser environment timed out; rendered scenes do not replace a full interactive play-through.

Run `node server.js`, then visit http://localhost:3000. No install step is needed for the game itself. Existing limitations: local session only, no saved gameplay or connected multiplayer. Original files were edited locally; this upload does not push changes to GitHub.
