# Redcape Deluxe (Web App)

Web implementation of the Red Riding Hood logic game. Place path tiles on the grid to build valid routes from Red Riding Hood to the house (with optional Wolf rules).

## Documentation

- [GAMEPLAY.md](GAMEPLAY.md) – Rules, controls, and debug
- [ROADMAP.md](ROADMAP.md) – UI & experience roadmap
- [CHANGELOG.md](CHANGELOG.md) – Version history

## Start

1. Open the project folder.
2. Open `index.html` in a browser (desktop or mobile).

## Controls

### Mouse / Desktop

- **Drag & Drop:** Click a tile in the bottom bar to select it, then drag it onto the board. It snaps to the nearest valid placement.
- **Right-Click:** Rotate the currently selected or placed tile (with “fly to fit” if rotation would collide).
- **Drag-out:** Drag a placed tile off the board to remove it and return it to the inventory.
- **Rotate / Check:** Buttons on the board: Rotate the selected tile, or Check the solution.

### Touch / Mobile

- **Tile bar (inventory):** Single tap = select. **Double-tap** = rotate the tile by 90°. Drag (move finger > ~22px) = drag onto the board.
- **Board:** Single tap on a placed tile = select. **Double-tap** on a placed tile = rotate it 90° (like right-click). Drag = move the tile or drag off to remove.
- **Drop zone:** Releasing in the area between the board and the tile bar still counts as a valid drop so the tile is placed.
- **Rotate / Check:** Use the buttons on the board to rotate the selected tile or check the solution.

### Debug & Shortcuts

- **D:** Toggle debug view (path graph nodes/edges).
- **S:** (In debug mode) Auto-solve the current level.
- **N:** (In debug mode) Skip to the next challenge.

## Data & Code

- **Challenges:** `data/challenges.json` and `data/challenges.inline.js`
- **Rules & logic:** `scripts/logic-core.js`
- **Solver:** `scripts/solver-engine.js`
- **Main app:** `app.js`

## Current State

- **Logic core:** Centralized rules and validation in `scripts/logic-core.js`.
- **Solver:** DFS-based solver in `scripts/solver-engine.js` used for validation and hints.
- **UI & layout:**
  - Single-screen layout: fits in the viewport without scrolling (`overflow-hidden`).
  - **Header:** Logo, level picker (icon opens overlay list), reset / hint / music; button spacing for clear grouping.
  - **Main:** Game board (canvas) as a distinct panel (background, border, shadow) with Rotate and Check buttons overlay; calm background (reduced pattern opacity). Feedback messages appear as a small toast above the tile bar (green/red/grey by type, auto-hide).
  - **Footer:** Tile bar (inventory) with horizontal scroll; safe-area and extra bottom padding on mobile so the bar stays visible. Hover feedback on tile cards.
  - **Level selection:** Header icon opens overlay with all levels; current level highlighted. No dropdown.
  - **Hover:** Placed tiles on the board show a subtle outline on hover; tile bar cards highlight on hover.
- **Mobile:**
  - Touch: pointer capture, extended drop zone (board + gap to tile bar), double-tap to rotate (inventory and placed tiles).
  - Drag starts only after movement over threshold; double-tap uses a 400 ms window.
  - Larger touch targets (~44px) for header and board actions; level list readable on small screens.
  - Optional smaller tile cards and scrollable tile list on very small viewports.
  - Tiles at the board edge (e.g. vertical tiles) are grabbable: clicks in the letterbox around the canvas count as board-edge.
- **Audio:** Background music and SFX (win, fail, rotate).
- **Gameplay:** Smart rotation (“fly to fit”), hint system, drag-out to remove, confetti on success, auto-advance to next level.
- **Debug:** Graph visualization (D), auto-solve (S), skip (N).
- **Challenges:** 43 solvable levels.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Next Steps

- **Animation polish:** Smoother glide/rotate animations; optional animated feedback on Check.
- **Final level polish:** Consistency pass over all 43 levels.
- See [ROADMAP.md](ROADMAP.md) for the full UI & experience roadmap.

## Development

- Work in small, clear steps.
- Align on approach before larger refactors or data changes.
