# Changelog

All notable changes to Redcape Deluxe are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Hover feedback:** Tile bar cards and placed tiles on the board show a clear hover state (inventory: stronger background/border; board: subtle white outline on the tile under the cursor).

### Changed

- **Visual clarity:** Calmer background (reduced hero-pattern opacity); game board emphasised as its own panel (background, border, soft shadow) in the main area.
- **Button spacing:** Rotate/Check action bar and header icon buttons use increased padding and gaps for clearer grouping.

## [0.2.0] – 2025-02

### Added

- **Level picker overlay:** Level selection is now an icon in the header; tapping it opens an overlay with the full level list. Current level is highlighted (green background, white bold text). Replaces the previous dropdown to free space for a larger logo.
- **CHANGELOG.md:** This file.

### Changed

- **Header:** Logo size increased (`h-8` / `h-10` on larger screens). Challenge dropdown removed in favour of the level icon.
- **Mobile / layout:** Larger touch targets (~44px min) for header buttons (Reset, Hint, Music, Level picker) and for Rotate/Check on the board; status line and level list text more readable on small screens. Main area padding and footer separation (shadow) adjusted; status line has a light background for clarity.
- **Accessibility:** Visible focus rings for buttons and the level list (keyboard/screen reader).
- **Start overlay:** Double-tap hint for touch users (“Double-tap a tile to rotate”). Help overlay body text set to `text-sm` for readability.

### Fixed

- **Tile placement / hitpoint:** Drop anchor was stored with fractional grid coordinates, so the selection outline could appear offset from the drawn tile. Anchors are now snapped to the grid (`Math.round`) so selection and drawing align.
- **Edge tile grab:** When a tile (especially a vertical one) stood at the board edge, taps in the letterbox/pillarbox around the canvas did not hit the canvas, so the tile could not be grabbed. Clicks in the game-frame but outside the canvas are now clamped to the canvas edge and handled as board clicks; pixel-based hit testing and visual bounds are used so the full tile area is grabbable.

---

## [0.1.0] – earlier

- Single-screen layout, drag & drop, smart rotation, hint system, confetti, auto-advance.
- Touch: pointer capture, extended drop zone, double-tap to rotate (inventory and placed tiles).
- Mobile layout: footer tile bar, safe-area, scrollable tile list on small viewports.
- Audio: background music and SFX.
- Debug: path graph (D), auto-solve (S), skip (N).

[Unreleased]: https://github.com/.../compare/v0.2.0...HEAD
[0.2.0]: https://github.com/.../compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/.../releases/tag/v0.1.0
