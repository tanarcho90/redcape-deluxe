# Gameplay Notes

## Core Loop

1. Choose a challenge: tap the list icon in the header to open the level overlay; pick a level from the list.
2. Place and rotate path tiles from the inventory (bottom bar).
3. Press Check to validate; confetti and auto-advance on success.

## Rules

- **Grid:** 4×4 (or as per challenge).
- **Tiles:** 1×2 and 1×1 (e.g. White) pieces; cannot overlap or cover trees/starts.
- **House:** One cell; accessible from all four sides (N, E, S, W).
- **WithoutWolf:** Red Riding Hood must reach any side of the house. No gaps, crossings, or extra tiles.
- **WithWolf:** Two separate paths; both must reach the house. Wolf’s path must be strictly shorter (by path length).
- **Path length:** By tile segments (e.g. 1 for 1-cell, 2 for 2-cell tiles).

## Tools & Controls

- **Hint:** Solver places one correct/missing tile.
- **Check:** Validates board (connectivity, Wolf rule). Confetti and next level on success.
- **Drag & drop:** Snaps to nearest valid cell. Drag a placed tile off the board to remove it.
- **Smart rotation (right-click / double-tap):** Rotate tile; if it would collide, it “flies” to the nearest valid placement.
- **Inventory:** Bottom tile bar shows only tiles not on the board; horizontal scroll when needed. Tile cards and placed tiles show hover feedback (highlight/outline).

### Mouse

- Click tile in bar → select. Drag onto board to place. Right-click to rotate (selected or placed tile). Drag placed tile off board to remove.

### Touch

- **Tile bar:** Single tap = select. **Double-tap** = rotate that inventory tile 90°. Drag (move > ~22px) = drag onto board.
- **Board:** Single tap on placed tile = select. **Double-tap** on placed tile = rotate 90°. Drag to move or drag off to remove.
- Releasing in the gap between board and tile bar still counts as a valid drop.
- Tiles at the board edge (e.g. vertical tiles) can be grabbed even when tapping in the margin around the canvas; the game treats edge-of-canvas taps as board clicks.

## Debug

- **D:** Toggle path graph visualization (nodes/edges).
- **S:** Auto-solve current level (in debug mode).
- **N:** Skip to next challenge (in debug mode).
