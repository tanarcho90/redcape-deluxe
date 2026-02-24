# Redcape Deluxe (Web App)

Web implementation of the Red Riding Hood logic game. Place 1x2 path tiles on a 4x4 grid to build a valid route.

## Start

1. Open the folder
2. Launch `index.html` in a browser

## Controls

- **Drag & Drop:** Select a tile, then drag it onto the board. Snaps to the nearest valid placement.
- **Right-Click:** Rotate the currently selected or placed tile.
- **Drag-out:** Drag a placed tile outside the grid to remove it.
- **Hint:** Uses the solver to place the next correct tile.
- **Debug Mode:** Press 'D' to toggle visual path graph (nodes/edges).
- **Auto-Solve:** Press 'S' in Debug Mode to instantly solve the level.
- **Skip Level:** Press 'N' in Debug Mode to go to the next challenge.

## Data

- Challenges: `data/challenges.json` & `data/challenges.inline.js`
- Rules and logic: `scripts/logic-core.js`
- Solver: `scripts/solver-engine.js`
- Main App: `app.js`

## Current State

- **Logic Core:** Centralized rules and validation in `scripts/logic-core.js`.
- **Solver Engine:** High-performance DFS solver in `scripts/solver-engine.js` used for validation and hints.
- **UI & Layout:**
  - **Single-Screen UI:** App fits entirely in the viewport without scrolling (`overflow-hidden`).
  - **Floating Toolbar:** Glassmorphism-style toolbar positioned over the board.
  - **Status Indicator:** Pulsing status light showing game state.
- **Audio:**
  - Background music playlist with 4 tracks (fairytale theme).
  - UI controls for Play/Pause, Skip, and Volume.
  - Sound Effects (SFX) for Win, False solution, and Tile rotation.
- **Gameplay Mechanics:**
  - **Hint System:** Robust real-time hints that place the correct tile.
  - **Drag-out to Remove:** Intuitive way to clear tiles from the board.
  - **Debug Manager:** Visualizes graph nodes and edges for pathfinding analysis.
- **Local Support:** Optimized for direct execution via `index.html` (skips CORS/Fetch blocks using inline data).
- **Challenges:** 43 solvable levels verified.

## Next Steps

- **Success Overlay:** High-quality visual feedback after solving a level.
- **Touch Support:** Optimization of drag events for mobile devices.
- **Preview Graphics:** Exact shape representation (1x1 vs 1x2) in the tile list.
- **Animation Polishing:** Transitions for UI overlays and tile placements.

## Entwicklungsprozess

- **Step-by-Step:** Aufgaben werden kleinteilig und nacheinander abgearbeitet.
- **Rücksprache:** Nach jedem signifikanten Schritt oder bei Unklarheiten wird kurz innegehalten und das weitere Vorgehen abgestimmt.
- **Keine Alleingänge:** Komplexe Refactorings oder massive Änderungen an den Spieldaten erfolgen nur nach expliziter Bestätigung.
