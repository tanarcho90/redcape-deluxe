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
  - **Sidebar:** Redesigned sidebar featuring challenge selection, reset/hint controls, music player, and dynamic inventory.
  - **Floating Toolbar:** Simplified to a prominent "Check" button.
  - **Status Indicator:** Pulsing status light located at the bottom of the sidebar.
- **Audio:**
  - Background music playlist with 4 tracks (fairytale theme).
  - UI controls for Play/Pause, Skip, and Volume.
  - Sound Effects (SFX) for Win, False solution, and Tile rotation.
- **Gameplay Mechanics:**
  - **Smart Rotation:** Tiles auto-locate the nearest valid slot if a rotation causes a collision ("fly to fit").
  - **Inventory Management:** Sidebar only shows tiles not currently on the board.
  - **Success Feedback:** `canvas-confetti` celebration upon solving, followed by a 2-second delay and auto-transition to the next level.
  - **Hint System:** Robust real-time hints that place the correct tile.
  - **Drag-out to Remove:** Intuitive way to clear tiles from the board.
  - **Debug Manager:** Visualizes graph nodes and edges with 'D', auto-solve with 'S', and skip with 'N'.
- **Local Support:** Optimized for direct execution via `index.html` (skips CORS/Fetch blocks using inline data).
- **Challenges:** 43 solvable levels verified.

## Next Steps

- **Animation Polish:** Adding smooth glide animations for the "fly to fit" logic.
- **Touch Support:** Optimization of drag and rotation events for mobile/tablet devices.
- **Mobile Responsive Refinement:** Fine-tuning sidebar and board scaling for narrow portrait viewports.
- **Final Level Polish:** Consistency check across all 43 levels.

## Entwicklungsprozess

- **Step-by-Step:** Aufgaben werden kleinteilig und nacheinander abgearbeitet.
- **Rücksprache:** Nach jedem signifikanten Schritt oder bei Unklarheiten wird kurz innegehalten und das weitere Vorgehen abgestimmt.
- **Keine Alleingänge:** Komplexe Refactorings oder massive Änderungen an den Spieldaten erfolgen nur nach expliziter Bestätigung.
