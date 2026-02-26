# Roadmap – Redcape Deluxe

Track of done and planned improvements.

## UX & Gameplay

- [x] **Single-screen layout:** No scrolling; everything in one viewport.
- [x] **Floating toolbar:** Rotate and Check on the board.
- [x] **Drag-out to remove:** Drag placed tiles off the board to remove them.
- [x] **Debug tools:** Path graph (D), Auto-Solve (S), Skip (N).
- [x] **Tile preview:** Inventory shows only unplaced tiles; clean preview in the bar.
- [x] **Success celebration:** Confetti and auto-advance to next level.
- [x] **Smart rotation:** “Fly-to-fit” when rotation would collide.
- [ ] **Animation polish:** Smoother glide/rotate animations.

## Content & Help

- [x] **Hint system:** Reliable hints for all levels.
- [x] **Audio:** Background music and SFX.
- [ ] **Final level polish:** Consistency and balance across all 43 levels.

## Mobile & Touch

- [x] **Touch support:** Drag from tile bar with pointer capture; extended drop zone; drag only after movement threshold.
- [x] **Double-tap rotate:** Inventory tiles (double-tap in bar) and placed tiles (double-tap on board).
- [x] **Mobile layout:** Footer tile bar with safe-area and bottom padding; flexible main area; tile list max-height and scroll on small screens.
- [x] **Touch robustness:** pointercancel handled for taps; non-mouse pointer types treated as touch where appropriate.
- [x] **Touch targets & readability:** ~44px min touch targets for header/board actions; larger status text and level list on small screens; focus rings for a11y.
- [x] **Edge tile grab:** Pixel-based hit test and game-frame click handling so vertical tiles at the board edge can be grabbed (clicks in letterbox/pillarbox count as board-edge).

## UI & Polish

- [x] **Level picker as icon:** Replaced header dropdown with an icon that opens a level overlay list; current level highlighted (green); more space for logo.
- [x] **Tile placement alignment:** Drop anchor snapped to grid so selection outline and tile drawing stay aligned (no “hitpoint left” offset).
