# Gameplay Notes

## Core Loop

1. Choose a challenge (Starter to Master).
2. Place and rotate path tiles.
3. Check if the path rules are satisfied.

## Rules

- Grid: 4x4
- Tiles: 1x2 and 1x1 (Weiss) pieces, cannot overlap or cover trees/starts
- House: Occupies 1 grid cell but is accessible from all 4 sides (N, E, S, W)
- WithoutWolf: Red Riding Hood must reach any side of the house. No gaps, crossings, or extra tiles allowed.
- WithWolf: Two separate paths required. Both must reach the house.
- Path Length: Calculated by tile segments (1 for 1-cell Weiss tile, 2 for all 2-cell tiles).
- Wolf Rule: The Wolf's path must be strictly shorter (weighted length) than Red Riding Hood's path.

## Tools

- **Hint System:** Backtracking solver finds the solution and places one missing/correct tile.
- **Check:** Validates the entire board including path connectivity and Wolf rules. Triggers confetti on success.
- **Success State:** After a 2-second celebration following a successful solve, the game automatically advances to the next challenge.
- **Drag & Drop:** Supports snapping to the nearest valid grid position.
- **Smart Rotation (Right-Click):** Rotating a tile that would collide causes it to "fly" to the nearest valid placement.
- **Drag-out:** Dragging a tile off the board removes it instantly and returns it to the inventory.
- **Inventory:** Dynamic sidebar only shows tiles not currently on the board.
- **Debug Mode (D):** Visualizes the internal path graph (nodes and edges) for debugging.
- **Auto-Solve (S):** Triggers the solver to automatically complete the level.
- **Skip Level (N):** Immediately skips to the next challenge in the sequence.
