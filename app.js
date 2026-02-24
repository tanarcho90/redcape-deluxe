const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const challengeSelect = document.getElementById("challengeSelect");
const tileList = document.getElementById("tileList");
const checkBtn = document.getElementById("checkBtn");
const hintBtn = document.getElementById("hintBtn");
const resetBtn = document.getElementById("resetBtn");
const rotateBtn = document.getElementById("rotateBtn");
const removeBtn = document.getElementById("removeBtn");
const statusText = document.getElementById("statusText");
const modeLabel = document.getElementById("modeLabel");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayBtn = document.getElementById("overlayBtn");
const gameFrame = document.querySelector(".game-frame");
const playPauseBtn = document.getElementById("playPauseBtn");
const skipBtn = document.getElementById("skipBtn");
const volumeSlider = document.getElementById("volumeSlider");
const trackInfo = document.getElementById("trackInfo");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");

const AudioManager = {
  music: [
    "assets/music/denis-pavlov-music-acoustic-guitar-amp-flute-fairytale-music-240577.mp3",
    "assets/music/denis-pavlov-music-mysterious-esoteric-magical-shadowy-dark-fairytale-music-369257.mp3",
    "assets/music/elisaveta_stoycheva-fairytale-cello-346847.mp3",
    "assets/music/geoffharvey-fairy-nights-158413.mp3"
  ],
  sfx: {
    win: "assets/sfx/win.mp3",
    false: "assets/sfx/false.mp3",
    rotate: "assets/sfx/rotate.mp3"
  },
  currentTrackIndex: 0,
  audio: new Audio(),
  isPlaying: false,

  init() {
    this.audio.volume = volumeSlider.value;
    this.audio.addEventListener("ended", () => this.next());
    
    volumeSlider.addEventListener("input", (e) => {
      this.audio.volume = e.target.value;
    });

    playPauseBtn.addEventListener("click", () => this.togglePlay());
    skipBtn.addEventListener("click", () => this.next());
    
    // SFX precaching
    this.winAudio = new Audio(this.sfx.win);
    this.falseAudio = new Audio(this.sfx.false);
    this.rotateAudio = new Audio(this.sfx.rotate);
  },

  togglePlay() {
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      if (!this.audio.src) this.loadTrack();
      this.audio.play().catch(e => console.log("Audio play blocked", e));
    }
    this.isPlaying = !this.isPlaying;
    this.updateUI();
  },

  loadTrack() {
    this.audio.src = this.music[this.currentTrackIndex];
    this.audio.load();
    this.updateUI();
  },

  next() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.music.length;
    this.audio.src = this.music[this.currentTrackIndex];
    if (this.isPlaying) this.audio.play();
    this.updateUI();
  },

  updateUI() {
    trackInfo.textContent = this.isPlaying ? `Track ${this.currentTrackIndex + 1}/${this.music.length}` : "Paused";
    playIcon.classList.toggle("hidden", this.isPlaying);
    pauseIcon.classList.toggle("hidden", !this.isPlaying);
  },

  playSFX(name) {
    const sound = this[name + "Audio"];
    if (sound) {
      sound.currentTime = 0;
      sound.volume = volumeSlider.value;
      sound.play().catch(() => {});
    }
  },

  // Helper for first interaction
  startIfStopped() {
    if (!this.isPlaying) this.togglePlay();
  }
};

const theme = {
  grass: "#5a7b7c",
  grid: "#b4b9c3",
  path: "#f8fafc",
  tileBorder: "#5a5a5a",
  text: "#1e1e1e",
  red: "#eb5a6e",
  wolf: "#6e6e6e",
  canvasBg: "#f9f2ea",
  tileSuccess: "#22c55e",
  tileError: "#ef4444",
};

const DEBUG_ENDPOINTS = true;

const iconPaths = {
  red: "assets/icons/_new/redcap.png",
  wolf: "assets/icons/_new/wolf.png",
  tree: "assets/icons/_new/tree.png",
  house: "assets/icons/_new/cabin.png",
};

const tileImagePaths = {
  Blau: "assets/tiles/blau.svg",
  Rosa: "assets/tiles/rosa.svg",
  Weiss: "assets/tiles/weiss.svg",
  Lila: "assets/tiles/lila.svg",
  Gelb: "assets/tiles/gelb.svg",
};

const iconCache = {};
const tileImageCache = {};
const patternCache = { key: null, canvas: null };
const tintCache = { canvas: null, ctx: null };

const boardConfig = LogicCore.boardConfig;
const tileDefs = LogicCore.tileDefs;

const state = {
  challenges: [],
  current: null,
  placements: new Map(),
  selectedTileId: null,
  rotation: 0,
  lastResultOk: false,
  tileTint: theme.path,
  dragState: {
    active: false,
    tileId: null,
    x: -1,
    y: -1,
    // Pixel coordinates for smooth dragging
    pixelX: 0,
    pixelY: 0,
    // Offset from tile center to grab point
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    valid: false,
    isFromBoard: false,
    originalX: -1,
    originalY: -1
  },
};

function init() {
  AudioManager.init();
  loadIcons();
  loadTileImages();
  loadChallenges();
  attachEvents();
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  draw();
}

function loadIcons() {
  Object.entries(iconPaths).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    img.onload = () => draw();
    iconCache[key] = img;
  });
}

function loadTileImages() {
  Object.entries(tileImagePaths).forEach(([tileId, src]) => {
    const img = new Image();
    img.src = src;
    img.onload = () => draw();
    tileImageCache[tileId] = img;
  });
}

function getIcon(name) {
  const img = iconCache[name];
  if (!img || !img.complete || img.naturalWidth === 0) return null;
  return img;
}

function getTileImage(tileId) {
  const img = tileImageCache[tileId];
  if (!img || !img.complete || img.naturalWidth === 0) return null;
  return img;
}

function attachEvents() {
  challengeSelect.addEventListener("change", () => {
    const id = challengeSelect.value;
    const challenge = state.challenges.find((item) => item.id === id);
    if (challenge) setChallenge(challenge);
  });

  checkBtn.addEventListener("click", handleCheck);
  hintBtn.addEventListener("click", handleHint);
  resetBtn.addEventListener("click", () => {
    if (!state.current) return;
    setChallenge(state.current);
  });

  if (rotateBtn) {
    rotateBtn.addEventListener("click", () => {
      if (!state.selectedTileId) return;
      updateOrientation((state.rotation + 90) % 360);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      if (!state.selectedTileId) return;
      if (state.placements.has(state.selectedTileId)) {
        state.placements.delete(state.selectedTileId);
        updateTileList();
        status("Tile removed.");
        draw();
      }
    });
  }

  if (overlayBtn) {
    overlayBtn.addEventListener("click", () => {
      hideOverlay();
      AudioManager.startIfStopped();
    });
  }

  canvas.addEventListener("click", handleBoardClick);
  
  // -- Custom Mouse Dragging (Board to Board) --
  canvas.addEventListener("mousedown", handleDragStart);
  window.addEventListener("mousemove", handleDragMove);
  window.addEventListener("mouseup", handleDragEnd);
  
  // -- Right Click Rotation --
  canvas.addEventListener("contextmenu", handleRightClick);

  // -- HTML5 Dragging (List to Board) --
  canvas.addEventListener("dragover", (event) => {
    event.preventDefault();
    const tileId = state.dragState.active ? state.dragState.tileId : null;
    if (!tileId) return; // Only react if we know what we are dragging (set in dragstart)

    // Calculate pixel position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pixelX = (event.clientX - rect.left) * scaleX;
    const pixelY = (event.clientY - rect.top) * scaleY;

    state.dragState.pixelX = pixelX;
    state.dragState.pixelY = pixelY;

    // Calculate snap target
    const dropPoint = getDropPoint(event);
    if (!dropPoint) return;

    const cell = getCellFromEvent(event);
    let bestX = -1, bestY = -1, valid = false;

    if (cell) {
        if (canPlaceTile(tileId, cell.x, cell.y, state.dragState.rotation)) {
            bestX = cell.x;
            bestY = cell.y;
            valid = true;
        }
    }

    if (!valid) {
        const nearest = findNearestValidPlacement(tileId, state.dragState.rotation, dropPoint);
        if (nearest) {
            bestX = nearest.x;
            bestY = nearest.y;
            valid = true;
        }
    }

    state.dragState.x = bestX;
    state.dragState.y = bestY;
    state.dragState.valid = valid;
    draw();
  });

  canvas.addEventListener("dragleave", () => {
     // Optional: Clear ghost if leaving canvas
     // state.dragState.x = -1; 
     // draw();
  });

  canvas.addEventListener("drop", (event) => {
    event.preventDefault();
    const tileId = event.dataTransfer?.getData("text/plain");
    
    // Logic is now shared with mouseup, but for HTML5 drop we use the calculated ghost or drop point
    const currentDrag = { ...state.dragState };
    resetDragState();

    if (!tileId || !state.current) {
        draw();
        return;
    }

    // Try ghost snap first
    if (currentDrag.valid && currentDrag.x !== -1) {
        const result = placeTile(tileId, currentDrag.x, currentDrag.y, currentDrag.rotation);
        if (result.ok) {
            status("Tile placed.");
            return;
        }
    }
    
    // Fallback logic
    const dropPoint = getDropPoint(event);
    state.selectedTileId = tileId;
    let result = null;
    
    // Try exact drop
    const cell = getCellFromEvent(event);
    if (cell) {
         result = placeTile(tileId, cell.x, cell.y, currentDrag.rotation);
    }
    
    // Try nearest
    if (!result?.ok && dropPoint) {
      const nearest = findNearestValidPlacement(tileId, currentDrag.rotation, dropPoint);
      if (nearest) {
        result = placeTile(tileId, nearest.x, nearest.y, currentDrag.rotation);
      }
    }

    if (result?.ok) status("Tile placed.");
    else status(result?.reason || "No free spot found.");
    
    draw();
  });
}

// -- Drag Handlers --

function handleRightClick(e) {
  e.preventDefault();
  
  // If dragging, rotate the dragged tile
  if (state.dragState.active) {
    const newRot = (state.dragState.rotation + 90) % 360;
    state.dragState.rotation = newRot;
    
    // Check validity with new rotation
    const { tileId, rotation, pixelX, pixelY } = state.dragState;
    const { cellSize } = getBoardMetrics();
    const nearest = findNearestValidPlacement(
        tileId, 
        rotation, 
        { x: pixelX / cellSize, y: pixelY / cellSize }
    );

    if (nearest) {
        state.dragState.x = nearest.x;
        state.dragState.y = nearest.y;
        state.dragState.valid = true;
    } else {
        state.dragState.valid = false;
    }
    
    AudioManager.playSFX("rotate");
    draw();
    return;
  }

  // If not dragging, rotate tile under cursor
  const cell = getCellFromEvent(e);
  if (!cell) return;
  
  const tileId = findTileAtCell(cell.x, cell.y);
  if (tileId) {
    const p = state.placements.get(tileId);
    const newRot = (p.rotation + 90) % 360;
    
    // Try to rotate in place
    // We need to check if the new rotation fits at the current anchor
    // If not, maybe try to adjust anchor? For now, strict in-place rotation.
    
    const shape = LogicCore.getTransformedTile(tileId, newRot);
    const occupied = shape.cells.map((c) => ({
      x: p.anchorX + c.x,
      y: p.anchorY + c.y,
    }));

    // Temporarily remove self from placements to check collision
    state.placements.delete(tileId);
    
    let valid = false;
    if (isWithinBoard(occupied) && !isBlocked(occupied) && !isOverlapping(tileId, occupied)) {
       valid = true;
    }
    
    if (valid) {
      state.placements.set(tileId, { ...p, rotation: newRot });
      AudioManager.playSFX("rotate");
      status("Rotated.");
    } else {
      // Put it back
      state.placements.set(tileId, p);
      
      // Optional: Try to find a valid anchor nearby for this rotation?
      // For now, just fail silently or shake?
      status("Cannot rotate here.");
      AudioManager.playSFX("false");
    }
    draw();
  }
}

function handleDragStart(e) {
    if (e.button !== 0) return; // Only Left Click
    if (!state.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    const { cellSize } = getBoardMetrics();
    const col = Math.floor(clickX / cellSize);
    const row = Math.floor(clickY / cellSize);

    const tileId = findTileAtCell(col, row);
    if (!tileId) return;

    // Found a tile, start dragging
    const placement = state.placements.get(tileId);
    
    // Calculate center of the tile for offset
    const shape = LogicCore.getTransformedTile(tileId, placement.rotation);
    const xs = shape.cells.map(c => placement.anchorX + c.x);
    const ys = shape.cells.map(c => placement.anchorY + c.y);
    const centerX = (Math.min(...xs) + Math.max(...xs) + 1) * 0.5 * cellSize;
    const centerY = (Math.min(...ys) + Math.max(...ys) + 1) * 0.5 * cellSize;

    state.dragState = {
        active: true,
        tileId: tileId,
        isFromBoard: true,
        rotation: placement.rotation,
        pixelX: clickX,
        pixelY: clickY,
        offsetX: clickX - centerX,
        offsetY: clickY - centerY,
        originalX: placement.anchorX,
        originalY: placement.anchorY,
        valid: true,
        x: placement.anchorX,
        y: placement.anchorY
    };

    // Select it
    state.selectedTileId = tileId;
    updateTileList();

    // Temporarily remove from placements for rendering
    // (We will draw it manually in drawGhost)
    // Actually, we can just filter it out in drawTiles
    draw();
}

function handleDragMove(e) {
    if (!state.dragState.active || !state.dragState.isFromBoard) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pixelX = (e.clientX - rect.left) * scaleX;
    const pixelY = (e.clientY - rect.top) * scaleY;

    state.dragState.pixelX = pixelX;
    state.dragState.pixelY = pixelY;

    // Calculate snap target for highlight
    const { cellSize } = getBoardMetrics();
    // Predict drop based on center
    const targetCenterX = pixelX - state.dragState.offsetX;
    const targetCenterY = pixelY - state.dragState.offsetY;
    
    // Convert back to approximate anchor.
    // This depends on tile shape. A simpler way:
    // Just find nearest valid placement for the mouse position 
    // mapped to the relative anchor.
    
    const dropPoint = { x: targetCenterX / cellSize, y: targetCenterY / cellSize };
    // Adjust drop point to be the anchor 0,0
    // Actually `findNearestValidPlacement` expects the "center" or just a point?
    // It compares distance to x+0.5, y+0.5. So it expects a cell center.
    // Let's just pass the raw grid coords of the center.
    
    // We need to pass the tile's visual center. 
    // The drop point passed to findNearest... is used to minimize distance.
    // Let's use the mouse position projected onto grid.

    const nearest = findNearestValidPlacement(
        state.dragState.tileId, 
        state.dragState.rotation, 
        { x: pixelX / cellSize, y: pixelY / cellSize }
    );

    if (nearest) {
        state.dragState.x = nearest.x;
        state.dragState.y = nearest.y;
        state.dragState.valid = true;
    } else {
        state.dragState.valid = false;
    }

    draw();
}

function handleDragEnd(e) {
    if (!state.dragState.active || !state.dragState.isFromBoard) return;

    const { tileId, x, y, valid, rotation, originalX, originalY, pixelX, pixelY } = state.dragState;
    
    resetDragState();

    if (valid && x !== -1) {
        // Place at new spot
        state.placements.delete(tileId);
        const result = placeTile(tileId, x, y, rotation);
        if (result.ok) {
            AudioManager.playSFX("rotate");
            return;
        }
    }

    // Check if dragged out to remove
    const isOutside = pixelX < -20 || pixelX > canvas.width + 20 || pixelY < -20 || pixelY > canvas.height + 20;
    if (isOutside) {
        state.placements.delete(tileId);
        updateTileList();
        status("Tile removed.");
        draw();
        return;
    }

    // Revert if invalid or failed
    state.placements.set(tileId, { 
        tileId, 
        rotation, 
        anchorX: originalX, 
        anchorY: originalY 
    });
    draw();
}

function resetDragState() {
    state.dragState = { 
        active: false, 
        tileId: null, 
        x: -1, y: -1, 
        pixelX: 0, pixelY: 0, 
        offsetX: 0, offsetY: 0,
        rotation: 0, 
        valid: false, 
        isFromBoard: false, 
        originalX: -1, originalY: -1 
    };
}

async function loadChallenges() {
  const isLocalFile = window.location.protocol === "file:";
  
  if (!isLocalFile) {
    try {
      const response = await fetch("data/challenges.json");
      if (response.ok) {
        const data = await response.json();
        state.challenges = data.challenges || [];
        populateChallengeSelect();
        return;
      }
    } catch (error) {
      console.warn("Fetch failed, falling back to inline data.");
    }
  }

  // Fallback
  const inlineData = window.__CHALLENGES__;
  if (inlineData && Array.isArray(inlineData.challenges)) {
    state.challenges = inlineData.challenges;
    populateChallengeSelect();
    status(isLocalFile ? "Challenges loaded from local file." : "Challenges loaded locally.");
  } else {
    status("Error: Could not load challenges.");
  }
}

function populateChallengeSelect() {
  challengeSelect.innerHTML = "";
  state.challenges.forEach((challenge, index) => {
    const option = document.createElement("option");
    option.value = challenge.id;
    option.textContent = `${challenge.id} – ${challenge.difficulty}`;
    if (index === 0) option.selected = true;
    challengeSelect.append(option);
  });
  if (state.challenges[0]) setChallenge(state.challenges[0]);
}

function setChallenge(challenge) {
  state.current = challenge;
  state.lastResultOk = false;
  state.tileTint = theme.path;
  state.placements.clear();
  state.selectedTileId = null;
  state.rotation = 0;
  challengeSelect.value = challenge.id;
  modeLabel.textContent = challenge.requiredMode === "WithWolf" ? "With Wolf" : "Without Wolf";
  updateTileList();
  status("Challenge loaded.");
  showOverlay("Ready?", "Select tiles and place them.", "Start");
  draw();
}

function updateTileList() {
  tileList.innerHTML = "";
  if (!state.current) return;
  state.current.availableTiles.forEach((tileId) => {
    const tile = tileDefs[tileId];
    const card = document.createElement("button");
    card.type = "button";
    card.draggable = true;
    card.title = tileId;
    card.className = "flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 p-2 transition hover:bg-slate-800";
    if (state.selectedTileId === tileId) card.classList.add("ring-2", "ring-emerald-400/70");
    if (state.placements.has(tileId)) card.classList.add("opacity-60");
    const preview = document.createElement("canvas");
    preview.width = 72;
    preview.height = 44;
    const placement = state.placements.get(tileId);
    const isSelected = state.selectedTileId === tileId;
    const previewRotation = isSelected ? state.rotation : placement?.rotation ?? 0;
    renderTilePreview(preview, tileId, previewRotation);
    card.append(preview);
    card.addEventListener("click", () => {
      const wasSelected = state.selectedTileId === tileId;
      state.selectedTileId = tileId;
      const placement = state.placements.get(tileId);
      if (placement) state.rotation = placement.rotation;
      else if (!wasSelected) state.rotation = 0;
      updateTileList();
      status(`Selected: ${tileId}.`);
      draw();
    });
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", tileId);
      state.selectedTileId = tileId;
      const placement = state.placements.get(tileId);
      const rot = placement ? placement.rotation : (state.selectedTileId === tileId ? state.rotation : 0);
      if (placement) state.rotation = placement.rotation;
      
      // Init Drag State
      state.dragState = {
        active: true,
        tileId: tileId,
        x: -1, 
        y: -1,
        rotation: rot,
        valid: false
      };

      setTileDragImage(event, tileId, rot);
    });

    card.addEventListener("dragend", () => {
        state.dragState = { active: false, tileId: null, x: -1, y: -1, rotation: 0, valid: false };
        draw();
    });
    tileList.append(card);
  });
}

function handleBoardClick(event) {
  if (!state.current) return;
  const cell = getCellFromEvent(event);
  if (!cell) return;

  if (!state.selectedTileId) {
    const clickedTile = findTileAtCell(cell.x, cell.y);
    if (clickedTile) {
      state.selectedTileId = clickedTile;
      state.rotation = state.placements.get(clickedTile)?.rotation ?? 0;
      updateTileList();
      status(`Selected: ${clickedTile}.`);
      draw();
    }
    return;
  }

  const result = placeTile(state.selectedTileId, cell.x, cell.y, state.rotation);
  if (result.ok) status("Tile placed.");
  else status(result.reason);
}

function handleCheck() {
  if (!state.current) return;
  const result = LogicCore.validateSolution(state.current, state.placements);
  if (result.ok) {
    AudioManager.playSFX("win");
    state.lastResultOk = true;
    state.tileTint = theme.tileSuccess;
    flashBoard("success");
    status(result.message || "Correct.");
    const nextChallenge = getNextChallenge();
    if (nextChallenge) {
      setTimeout(() => {
        setChallenge(nextChallenge);
        hideOverlay();
      }, 1500); // Wait longer for win sound
    } else {
      showOverlay("Correct!", "You solved all challenges.", "Finish");
    }
  } else {
    AudioManager.playSFX("false");
    state.lastResultOk = false;
    state.tileTint = theme.path;
    flashBoard("error");
    status(result.message || "Not correct.");
  }
}

function handleHint() {
  if (!state.current) return;
  status("Thinking...");
  
  // Use timeout to let the UI update the status text before heavy calculation
  setTimeout(() => {
    const solution = SolverEngine.solve(state.current);
    if (!solution) {
      status("No solution found for this challenge.");
      return;
    }

    // Find a tile that isn't placed yet or is placed incorrectly
    let hintFound = false;
    for (const [tileId, p] of solution) {
      const current = state.placements.get(tileId);
      if (
        !current ||
        current.anchorX !== p.anchorX ||
        current.anchorY !== p.anchorY ||
        current.rotation !== p.rotation
      ) {
        // Force placement: remove whatever is in the way
        const shape = LogicCore.getTransformedTile(tileId, p.rotation);
        const occupied = shape.cells.map((cell) => ({
          x: p.anchorX + cell.x,
          y: p.anchorY + cell.y,
        }));

        // Remove existing tiles that occupy these cells
        for (const cell of occupied) {
          const blockingTileId = findTileAtCell(cell.x, cell.y);
          if (blockingTileId && blockingTileId !== tileId) {
            state.placements.delete(blockingTileId);
          }
        }

        // Place the correct tile
        state.placements.set(tileId, {
          tileId,
          rotation: p.rotation,
          anchorX: p.anchorX,
          anchorY: p.anchorY,
        });
        
        state.selectedTileId = tileId;
        state.rotation = p.rotation;
        
        updateTileList();
        draw();
        status(`Hint: ${tileId} placed.`);
        hintFound = true;
        break;
      }
    }

    if (!hintFound) {
      status("Everything looks correct!");
    }
  }, 50);
}

function updateOrientation(rotation) {
  const tileId = state.selectedTileId;
  if (!tileId) return;
  const placement = state.placements.get(tileId);
  if (!placement) {
    state.rotation = rotation;
    AudioManager.playSFX("rotate");
    updateTileList();
    draw();
    return;
  }
  state.rotation = rotation;
  AudioManager.playSFX("rotate");
  placeTile(tileId, placement.anchorX, placement.anchorY, rotation, true);
}

function placeTile(tileId, anchorX, anchorY, rotation) {
  const shape = LogicCore.getTransformedTile(tileId, rotation);
  const occupied = shape.cells.map((cell) => ({
    x: anchorX + cell.x,
    y: anchorY + cell.y,
  }));

  if (!isWithinBoard(occupied)) return { ok: false, reason: "Outside the board." };
  if (isBlocked(occupied)) return { ok: false, reason: "Cell is blocked." };
  if (isOverlapping(tileId, occupied)) return { ok: false, reason: "Tile overlaps another." };

  state.placements.set(tileId, { tileId, rotation, anchorX, anchorY });
  state.rotation = rotation;
  updateTileList();
  draw();
  return { ok: true };
}

function isWithinBoard(cells) {
  return cells.every((cell) => cell.x >= 0 && cell.x < boardConfig.cols && cell.y >= 0 && cell.y < boardConfig.rows);
}

function isBlocked(cells) {
  const blocked = getBlockedCells();
  return cells.some((cell) => blocked.has(`${cell.x},${cell.y}`));
}

function getBlockedCells() {
  const blocked = new Set();
  const setup = state.current.boardSetup;
  setup.trees.forEach(([x, y]) => blocked.add(`${x - 1},${y - 1}`));
  blocked.add(`${setup.startRot[0] - 1},${setup.startRot[1] - 1}`);
  if (setup.startWolf) blocked.add(`${setup.startWolf[0] - 1},${setup.startWolf[1] - 1}`);
  blocked.add(`${setup.house.position[0] - 1},${setup.house.position[1] - 1}`);
  return blocked;
}

function isOverlapping(tileId, cells) {
  for (const [placedId, p] of state.placements) {
    if (placedId === tileId) continue;
    const shape = LogicCore.getTransformedTile(placedId, p.rotation);
    for (const cell of shape.cells) {
      const cx = p.anchorX + cell.x;
      const cy = p.anchorY + cell.y;
      if (cells.some((c) => c.x === cx && c.y === cy)) return true;
    }
  }
  return false;
}

function findNearestValidPlacement(tileId, rotation, dropPoint) {
  if (!dropPoint) return null;
  let best = null;
  for (let y = 0; y < boardConfig.rows; y++) {
    for (let x = 0; x < boardConfig.cols; x++) {
      if (canPlaceTile(tileId, x, y, rotation)) {
        const dist = Math.hypot(x + 0.5 - dropPoint.x, y + 0.5 - dropPoint.y);
        if (!best || dist < best.dist) best = { x, y, dist };
      }
    }
  }
  return best;
}

function canPlaceTile(tileId, anchorX, anchorY, rotation) {
  const shape = LogicCore.getTransformedTile(tileId, rotation);
  const occupied = shape.cells.map((cell) => ({ x: anchorX + cell.x, y: anchorY + cell.y }));
  if (!isWithinBoard(occupied)) return false;
  if (isBlocked(occupied)) return false;
  if (isOverlapping(tileId, occupied)) return false;
  return true;
}

function findTileAtCell(x, y) {
  for (const [tileId, p] of state.placements) {
    const shape = LogicCore.getTransformedTile(tileId, p.rotation);
    if (shape.cells.some((c) => p.anchorX + c.x === x && p.anchorY + c.y === y)) return tileId;
  }
  return null;
}

function getCellFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  const { cellSize, startX, startY } = getBoardMetrics();
  const col = Math.floor((x - startX) / cellSize);
  const row = Math.floor((y - startY) / cellSize);
  if (col < 0 || col >= boardConfig.cols || row < 0 || row >= boardConfig.rows) return null;
  return { x: col, y: row };
}

function getDropPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  const { cellSize, startX, startY } = getBoardMetrics();
  return { x: (x - startX) / cellSize, y: (y - startY) / cellSize };
}

function getBoardMetrics() {
  const cellSize = canvas.width / boardConfig.cols;
  return { cellSize, startX: 0, startY: 0 };
}

function resizeCanvas() {
  const frame = document.querySelector(".game-frame");
  if (!frame) return;
  
  // Use the actual available space in the frame
  const padding = 32; // Total padding around board
  const maxWidth = frame.clientWidth - padding;
  const maxHeight = frame.clientHeight - padding;
  
  const size = Math.floor(Math.min(maxWidth, maxHeight));
  
  if (canvas.width !== size) {
    canvas.width = size;
    canvas.height = size;
    draw();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  if (!state.current) return;
  drawGrid();
  drawTrees();
  drawHouse();
  drawStarts();
  drawSelection();
  drawTiles();
  drawGhost();
}

function drawGhost() {
  if (!state.dragState.active) return;
  const { tileId, rotation, pixelX, pixelY, offsetX, offsetY, x, y, valid, isFromBoard } = state.dragState;
  const { cellSize } = getBoardMetrics();
  
  ctx.save();
  
  // 1. Draw Snap Indicator (The Grid Target)
  if (valid && x !== -1) {
      const shape = LogicCore.getTransformedTile(tileId, rotation);
      const xs = shape.cells.map(c => x + c.x);
      const ys = shape.cells.map(c => y + c.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const drawX = minX * cellSize;
      const drawY = minY * cellSize;
      const width = (maxX - minX + 1) * cellSize;
      const height = (maxY - minY + 1) * cellSize;
      
      // Dashed outline
      ctx.strokeStyle = "#4ade80"; // Green
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(drawX + 4, drawY + 4, width - 8, height - 8);
      ctx.setLineDash([]);
      
      // Light background
      ctx.fillStyle = "rgba(74, 222, 128, 0.15)";
      ctx.fillRect(drawX + 4, drawY + 4, width - 8, height - 8);
  }

  // 2. Draw Flying Tile
  // The tile center should be at (pixelX - offsetX, pixelY - offsetY)
  let drawCenterX = pixelX;
  let drawCenterY = pixelY;
  
  if (isFromBoard) {
      drawCenterX = pixelX - offsetX;
      drawCenterY = pixelY - offsetY;
  }
  
  ctx.translate(drawCenterX, drawCenterY);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Scale up slightly for "lift" effect
  ctx.scale(1.1, 1.1);
  
  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 15;
  
  const img = getTileImage(tileId);
  if (img) {
      const shape = LogicCore.getTransformedTile(tileId, rotation);
      const isSingleCell = shape.cells.length === 1;

      if (isSingleCell) {
        ctx.translate(-cellSize / 2, -cellSize / 2);
      } else {
        ctx.translate(-cellSize, -cellSize / 2);
      }
      
      // Using standard tint (usually white/path) for the floating tile
      drawTintedImage(ctx, img, state.tileTint, 0, 0, cellSize * 2, cellSize);
  }

  ctx.restore();
}

function drawBackground() {
  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#030712");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  const { cellSize } = getBoardMetrics();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= boardConfig.cols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();
  }
  for (let j = 0; j <= boardConfig.rows; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * cellSize);
    ctx.lineTo(canvas.width, j * cellSize);
    ctx.stroke();
  }
}

function drawTrees() {
  const { cellSize } = getBoardMetrics();
  const icon = getIcon("tree");
  state.current.boardSetup.trees.forEach(([tx, ty]) => {
    const x = (tx - 0.5) * cellSize;
    const y = (ty - 0.5) * cellSize;
    if (icon) ctx.drawImage(icon, x - cellSize * 0.35, y - cellSize * 0.35, cellSize * 0.7, cellSize * 0.7);
  });
}

function drawHouse() {
  const { cellSize } = getBoardMetrics();
  const [hx, hy] = state.current.boardSetup.house.position;
  const icon = getIcon("house");
  const x = (hx - 1) * cellSize;
  const y = (hy - 1) * cellSize;
  if (icon) ctx.drawImage(icon, x + cellSize * 0.1, y + cellSize * 0.1, cellSize * 0.8, cellSize * 0.8);
}

function drawStarts() {
  const { cellSize } = getBoardMetrics();
  const setup = state.current.boardSetup;
  const drawIcon = (name, [sx, sy]) => {
    const icon = getIcon(name);
    const x = (sx - 0.5) * cellSize;
    const y = (sy - 0.5) * cellSize;
    if (icon) ctx.drawImage(icon, x - cellSize * 0.35, y - cellSize * 0.35, cellSize * 0.7, cellSize * 0.7);
  };
  drawIcon("red", setup.startRot);
  if (setup.startWolf) drawIcon("wolf", setup.startWolf);
}

function drawTiles() {
  const { cellSize } = getBoardMetrics();
  state.placements.forEach((p, tileId) => {
    if (state.dragState.active && state.dragState.tileId === tileId) {
      return;
    }
    
    drawTileImage(tileId, p, cellSize, state.tileTint);
    
    if (DEBUG_ENDPOINTS) {
      const shape = LogicCore.getTransformedTile(tileId, p.rotation);
      ctx.fillStyle = "#3b82f6"; // Blue instead of green
      const radius = Math.max(1.5, Math.round(cellSize * 0.05)); // Smaller radius
      shape.endpoints.forEach((ep) => {
        const x = (p.anchorX + ep.point.x) * cellSize;
        const y = (p.anchorY + ep.point.y) * cellSize;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  });
}

function drawTileImage(tileId, p, cellSize, tint) {
  const img = getTileImage(tileId);
  if (!img) return;
  const shape = LogicCore.getTransformedTile(tileId, p.rotation);
  const isSingleCell = shape.cells.length === 1;
  
  const xs = shape.cells.map(c => p.anchorX + c.x);
  const ys = shape.cells.map(c => p.anchorY + c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const centerX = (minX + maxX + 1) * 0.5 * cellSize;
  const centerY = (minY + maxY + 1) * 0.5 * cellSize;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((p.rotation * Math.PI) / 180);
  
  if (isSingleCell) {
    // Center the 1x1 active part of the 2x1 asset
    ctx.translate(-cellSize / 2, -cellSize / 2);
  } else {
    // Center the full 2x1 asset
    ctx.translate(-cellSize, -cellSize / 2);
  }
  
  drawTintedImage(ctx, img, tint || theme.path, 0, 0, cellSize * 2, cellSize);
  ctx.restore();
}

function drawTintedImage(context, img, color, x, y, w, h) {
  if (!tintCache.canvas) {
    tintCache.canvas = document.createElement("canvas");
    tintCache.ctx = tintCache.canvas.getContext("2d");
  }
  const { canvas: off, ctx: offCtx } = tintCache;
  off.width = w; off.height = h;
  offCtx.drawImage(img, 0, 0, w, h);
  offCtx.globalCompositeOperation = "source-in";
  offCtx.fillStyle = color;
  offCtx.fillRect(0, 0, w, h);
  offCtx.globalCompositeOperation = "source-over";
  context.drawImage(off, x, y, w, h);
}

function drawSelection() {
  if (!state.selectedTileId) return;
  const p = state.placements.get(state.selectedTileId);
  if (!p) return;
  const { cellSize } = getBoardMetrics();
  const shape = LogicCore.getTransformedTile(state.selectedTileId, p.rotation);
  const xs = shape.cells.map(c => p.anchorX + c.x);
  const ys = shape.cells.map(c => p.anchorY + c.y);
  const x = Math.min(...xs) * cellSize;
  const y = Math.min(...ys) * cellSize;
  const w = (Math.max(...xs) - Math.min(...xs) + 1) * cellSize;
  const h = (Math.max(...ys) - Math.min(...ys) + 1) * cellSize;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
}

function renderTilePreview(canvas, tileId, rotation) {
  const ctx = canvas.getContext("2d");
  const img = getTileImage(tileId);
  if (!img) return;
  
  const shape = LogicCore.getTransformedTile(tileId, rotation);
  const isSingleCell = shape.cells.length === 1;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  
  if (isSingleCell) {
    drawTintedImage(ctx, img, "#ffffff", -11, -11, 44, 22);
  } else {
    drawTintedImage(ctx, img, "#ffffff", -22, -11, 44, 22);
  }
  ctx.restore();
}

function setTileDragImage(event, tileId, rotation) {
  const { cellSize } = getBoardMetrics();
  const canvas = document.createElement("canvas");
  
  const shape = LogicCore.getTransformedTile(tileId, rotation);
  const isSingleCell = shape.cells.length === 1;
  const isVertical = rotation % 180 !== 0;
  
  if (isSingleCell) {
    canvas.width = cellSize;
    canvas.height = cellSize;
  } else {
    canvas.width = (isVertical ? 1 : 2) * cellSize;
    canvas.height = (isVertical ? 2 : 1) * cellSize;
  }

  const ctx = canvas.getContext("2d");
  const img = getTileImage(tileId);
  if (img) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    if (isSingleCell) {
      drawTintedImage(ctx, img, "#ffffff", -cellSize / 2, -cellSize / 2, cellSize * 2, cellSize);
    } else {
      drawTintedImage(ctx, img, "#ffffff", -cellSize, -cellSize / 2, cellSize * 2, cellSize);
    }
  }
  event.dataTransfer.setDragImage(canvas, canvas.width / 2, canvas.height / 2);
}

function status(msg) { statusText.textContent = msg; }
function showOverlay(t, txt, btn) {
  overlayTitle.textContent = t; overlayText.textContent = txt; overlayBtn.textContent = btn;
  overlay.classList.remove("hidden");
}
function hideOverlay() { overlay.classList.add("hidden"); }
function getNextChallenge() {
  const i = state.challenges.findIndex(c => c.id === state.current.id);
  return state.challenges[i + 1];
}
function flashBoard(type) {
  const cls = type === "success" ? "board-glow-success" : "board-glow-error";
  gameFrame.classList.add(cls);
  setTimeout(() => gameFrame.classList.remove(cls), 600);
}

init();
