# Roadmap – Redcape Deluxe

**UI & Experience Roadmap · Version 1.0 · As of 2026**

Overview of implemented and planned improvements, organised by vision and time horizons.

---

## 1. Vision

Redcape Deluxe should feel like a calm, high-quality puzzle experience in the forest. The aim is a clear, intuitive interface with strong atmosphere and pleasant micro-interactions.

In the long term the game should:

- look visually high-quality
- be intuitive to use
- work equally well on desktop and mobile
- feel emotionally coherent and immersive

---

## 2. Short-term Goals (0 to 4 weeks)

### 2.1 Visual Clarity of the Board

Goal: Better readability and stronger focus on the board.

- [x] **Reduce background pattern** (lower opacity on hero pattern)
- [x] **Emphasise the board as its own panel** (background, border, shadow)
- [ ] Add spacing between tiles (reverted after trial; optional for later)
- [ ] Add subtle shadows or depth effects
- [ ] Consistent stroke width for icons

**Outcome:** The board looks more modern, structured, and less flat.

### 2.2 Interaction Feedback

Goal: Every action should be noticeable.

- [x] **Hover state for tiles** (inventory bar + placed tiles on board)
- [ ] Smooth rotation animation
- [x] **Visual selection indicator** (selection ring)
- [ ] Animated feedback on “Check”
- [ ] Clear disabled state for buttons

**Outcome:** Players get immediate visual feedback, making the game feel more alive.

### 2.3 Button Hierarchy

Goal: Clear prioritisation of actions.

- [x] **“Check” as primary button** (green emphasis)
- [x] **“Rotate” as secondary button**
- [x] **Visual grouping in an action bar** (overlay on the board)
- [x] **Further spacing / polish** (action bar and header button gaps)
- [ ] Loading state for buttons

**Outcome:** User flow becomes clearer and more professional.

---

## 3. Medium-term Goals (1 to 3 months)

### 3.1 Atmospheric Upgrade

Goal: More immersion without visual overload.

- [ ] Subtle fog effect in the background
- [ ] Light parallax motion
- [ ] Optional ambient sound
- [ ] Day/night theme
- [ ] Seasonal colour variants

**Outcome:** The game gains a stronger identity.

### 3.2 UX Improvements

Goal: Lower barrier to entry.

- [ ] Mini-tutorial on first start
- [ ] Explanatory tooltips
- [ ] Visual error hints instead of text only
- [ ] Progress indicator per level
- [ ] Reset button with clear feedback
- [x] **Hint system** (solver places missing tile)
- [x] **Overlays** (Ready?, How to Play)

**Outcome:** New players understand the goal faster and stay longer.

### 3.3 Accessibility

Goal: Accessibility for more players.

- [ ] Check/improve colour contrast
- [x] **Visible focus states** (focus-visible ring)
- [x] **Larger touch targets** (~44px min)
- [ ] “Reduced Motion” option
- [ ] Scalable font sizes

**Outcome:** Better usability on all devices.

---

## 4. Long-term Vision (3 to 12 months)

### 4.1 Content & Progression

- [ ] Level system with difficulty curve
- [ ] Daily Challenge
- [ ] Randomly generated boards
- [ ] Star rating per level
- [ ] High score or time scoring
- [ ] Final level polish: consistency and balance across all 43 levels

### 4.2 Design System

Goal: Scalability of the project.

- [ ] Define own colour palette
- [ ] Clear typography hierarchy
- [ ] Component library (buttons, tiles, status messages, overlays)
- [ ] Animation guidelines

**Outcome:** Clean codebase and consistent UI.

### 4.3 Polishing & Premium Feel

- [ ] Smooth transitions between states
- [ ] Refined sound effects (extended)
- [x] **Light particle effects on success** (confetti)
- [ ] Intro animation on start
- [ ] High-quality loading state
- [ ] Animation polish: smoother glide/rotate animations

---

## 5. Already Implemented (Overview)

See sections 2–4 for details. Full list of completed items:

**UX & Gameplay**

- [x] Single-screen layout: everything in one viewport, no scrolling
- [x] Floating toolbar: Rotate and Check on the board
- [x] Drag-out to remove: drag tiles off the board to remove them
- [x] Debug tools: path graph (D), Auto-Solve (S), Skip (N)
- [x] Tile preview: only unplaced tiles in the bar
- [x] Success celebration: confetti and auto-advance
- [x] Smart rotation: “fly-to-fit” on collision

**Content & Help**

- [x] Hint system: reliable hints for all levels
- [x] Audio: background music and SFX

**Mobile & Touch**

- [x] Touch support: pointer capture, extended drop zone, movement threshold
- [x] Double-tap rotate: inventory and placed tiles
- [x] Mobile layout: footer with safe area, scrollable tile list
- [x] Touch robustness: pointercancel, non-mouse treated as touch
- [x] Touch targets & readability: ~44px, focus rings
- [x] Edge tile grab: pixel hit and game-frame clicks (letterbox)

**UI & Polish**

- [x] Calm background: reduced hero-pattern opacity; board as panel (background, border, shadow)
- [x] Hover feedback: tile bar cards and placed tiles on board (outline)
- [x] Button spacing: Rotate/Check bar and header buttons with clearer gaps
- [x] Toast feedback: status messages as compact toast with color by type (success/error/info), auto-hide
- [x] Level picker as icon with overlay list; current level highlighted
- [x] Tile placement alignment: anchor snapped to grid (no hitpoint offset)

---

## 6. Technical Structure

Recommended:

- Clear separation of game logic and UI layer
- Component-based structure
- Central theme configuration
- Consistently defined animations
- State management cleanly encapsulated

---

## 7. Priority Matrix

| Priority | Examples (references to sections) |
|----------|-----------------------------------|
| **High impact + low effort** | Tile spacing (2.1), button hierarchy (2.3), hover states (2.2), calm background (2.1) |
| **High impact + medium effort** | Micro-animations (2.2, 4.3), tutorial (3.2), visual error hints (3.2) |
| **High impact + high effort** | Level system (4.1), parallax and fog (3.1), Daily Challenge (4.1) |

---

## 8. Summary

Redcape Deluxe has a strong foundation. The next development phase should focus on clarity, feedback, and depth.

As the UI becomes clearer and interactions feel more alive, perceived quality will increase significantly.
