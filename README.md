# Redcape Deluxe (Web App)

Web implementation of the Red Riding Hood logic game. Place 1x2 path tiles on a 4x4 grid to build a valid route.

## Start

1. Open the folder
2. Launch `index.html` in a browser

## Controls

- Select a tile, then click the board
- Rotate to change orientation
- Remove deletes the placement
- Check validates the solution
- Drag & drop is supported (drops snap to the nearest valid placement)

## Data

- Challenges: `data/challenges.json`
- Rules and logic: `app.js`

## Current State

- **Logic Core:** Centralized rules and validation in `scripts/logic-core.js`.
- **Solver Engine:** High-performance DFS solver in `scripts/solver-engine.js` used for validation and hints.
- **Audio:**
  - Background music playlist with 4 tracks (fairytale theme).
  - UI controls for Play/Pause, Skip, and Volume.
  - Sound Effects (SFX) for Win, False solution, and Tile rotation.
- **Hint System:** Robust real-time hints that place the correct tile and automatically remove blocking tiles. Works with 50ms delay for UI responsiveness.
- **Visuals:**
  - Corrected 1x1 tile (Weiss) rotation and grid offset.
  - Centered tile rotation for 1x2 and 1x1 pieces.
- **Local Support:** Optimized for direct execution via `index.html` (skips CORS/Fetch blocks using inline data).
- **Challenges:** 43 solvable levels verified.
- **UI:** English interface with Tailwind CSS styling.

## Next Steps

Siehe [ROADMAP.md](ROADMAP.md) für detaillierte Informationen zu geplanten Verbesserungen.

- Drag & Drop Verbesserungen
- UX-Optimierung der Rotation
- Vollständige Hint-Abdeckung
- Mobile/Touch Support

## Entwicklungsprozess

- **Step-by-Step:** Aufgaben werden kleinteilig und nacheinander abgearbeitet.
- **Rücksprache:** Nach jedem signifikanten Schritt oder bei Unklarheiten wird kurz innegehalten und das weitere Vorgehen abgestimmt.
- **Keine Alleingänge:** Komplexe Refactorings oder massive Änderungen an den Spieldaten erfolgen nur nach expliziter Bestätigung.
