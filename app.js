// Base path for GitHub Pages (e.g. /redcape-deluxe/) – resolves relative to current page
const BASE = (() => {
  const b = document.querySelector("base");
  if (b && b.getAttribute("href")) return new URL(b.getAttribute("href"), location.href).href;
  return new URL(".", location.href).href;
})();
function asset(path) {
  return new URL(path, document.baseURI).href;
}

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const challengeSelect = document.getElementById("challengeSelect");
const tileList = document.getElementById("tileList");
const checkBtn = document.getElementById("checkBtn");
const hintBtn = document.getElementById("hintBtn");
const resetBtn = document.getElementById("resetBtn");
const helpSidebarBtn = document.getElementById("helpSidebarBtn");
const rotateBtn = document.getElementById("rotateBtn");
const removeBtn = document.getElementById("removeBtn");
const statusText = document.getElementById("statusText");
const modeLabel = document.getElementById("modeLabel");
const difficultyBadge = document.getElementById("difficultyBadge");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayBtn = document.getElementById("overlayBtn");
const overlaySoundBtn = document.getElementById("overlaySoundBtn");
const overlaySoundOnIcon = document.getElementById("overlaySoundOnIcon");
const overlaySoundOffIcon = document.getElementById("overlaySoundOffIcon");
const overlaySoundLabel = document.getElementById("overlaySoundLabel");
const helpBtn = document.getElementById("helpBtn");
const helpOverlay = document.getElementById("helpOverlay");
const closeHelpBtn = document.getElementById("closeHelpBtn");
const gameFrame = document.querySelector(".game-frame");
const playPauseBtn = document.getElementById("playPauseBtn");
const skipBtn = document.getElementById("skipBtn");
const volumeSlider = document.getElementById("volumeSlider");
const trackInfo = document.getElementById("trackInfo");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const musicMuteBtn = document.getElementById("musicMuteBtn");
const musicMuteOnIcon = document.getElementById("musicMuteOnIcon");
const musicMuteOffIcon = document.getElementById("musicMuteOffIcon");

const AudioManager = {
  music: [
    asset("assets/music/denis-pavlov-music-acoustic-guitar-amp-flute-fairytale-music-240577.mp3"),
    asset("assets/music/denis-pavlov-music-mysterious-esoteric-magical-shadowy-dark-fairytale-music-369257.mp3"),
    asset("assets/music/elisaveta_stoycheva-fairytale-cello-346847.mp3"),
    asset("assets/music/geoffharvey-fairy-nights-158413.mp3")
  ],
  sfx: {
    win: asset("assets/sfx/win.mp3"),
    false: asset("assets/sfx/false.mp3"),
    rotate: asset("assets/sfx/rotate.mp3")
  },
  currentTrackIndex: 0,
  audio: new Audio(),
  isPlaying: false,
  muted: false,

  getMuted() {
    return this.muted;
  },

  setMuted(m) {
    this.muted = !!m;
    try { localStorage.setItem("soundMuted", this.muted ? "1" : "0"); } catch (_) {}
    this.audio.volume = this.muted ? 0 : (volumeSlider ? volumeSlider.value : 0.3);
  },

  init() {
    try { this.muted = localStorage.getItem("soundMuted") === "1"; } catch (_) {}
    if (volumeSlider) {
      this.audio.volume = this.muted ? 0 : volumeSlider.value;
      volumeSlider.addEventListener("input", (e) => {
        this.audio.volume = this.muted ? 0 : e.target.value;
      });
    } else if (!this.muted) {
      this.audio.volume = 0.3;
    }
    
    this.audio.addEventListener("ended", () => this.next());
    
    if (playPauseBtn) playPauseBtn.addEventListener("click", () => this.togglePlay());
    if (skipBtn) skipBtn.addEventListener("click", () => this.next());
    
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
      sound.volume = volumeSlider ? volumeSlider.value : 0.3;
      sound.play().catch(() => {});
    }
  },

  // Helper for first interaction
  startIfStopped() {
    if (!this.isPlaying && playPauseBtn) this.togglePlay();
  }
};

const AnimationManager = {
  animations: new Map(), // tileId -> animation state
  loopId: null,

  addGlide(tileId, fromX, fromY, toX, toY, duration = 250) {
    const anim = this.animations.get(tileId) || {};
    anim.glide = {
      startTime: performance.now(),
      duration,
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY },
      current: { x: fromX, y: fromY }
    };
    this.animations.set(tileId, anim);
    this.startLoop();
  },

  addRotate(tileId, fromRot, toRot, duration = 200) {
    const anim = this.animations.get(tileId) || {};
    let delta = toRot - fromRot;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;

    anim.rotate = {
      startTime: performance.now(),
      duration,
      from: fromRot,
      to: fromRot + delta,
      current: fromRot
    };
    this.animations.set(tileId, anim);
    this.startLoop();
  },

  startLoop() {
    if (!this.loopId) {
      this.loopId = requestAnimationFrame(this.tick.bind(this));
    }
  },

  tick(now) {
    let hasActive = false;
    for (const [tileId, anim] of this.animations) {
      let tileHasActive = false;

      if (anim.glide) {
        const elapsed = now - anim.glide.startTime;
        const progress = Math.min(elapsed / anim.glide.duration, 1);
        const t = this.easeOutCubic(progress);
        
        anim.glide.current = {
          x: anim.glide.from.x + (anim.glide.to.x - anim.glide.from.x) * t,
          y: anim.glide.from.y + (anim.glide.to.y - anim.glide.from.y) * t
        };

        if (progress >= 1) delete anim.glide;
        else tileHasActive = true;
      }

      if (anim.rotate) {
        const elapsed = now - anim.rotate.startTime;
        const progress = Math.min(elapsed / anim.rotate.duration, 1);
        const t = this.easeOutCubic(progress);

        anim.rotate.current = anim.rotate.from + (anim.rotate.to - anim.rotate.from) * t;

        if (progress >= 1) delete anim.rotate;
        else tileHasActive = true;
      }

      if (!tileHasActive) {
        this.animations.delete(tileId);
      } else {
        hasActive = true;
      }
    }

    draw();

    if (hasActive) {
      this.loopId = requestAnimationFrame(this.tick.bind(this));
    } else {
      this.loopId = null;
    }
  },

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
};

const DebugManager = {
  active: false,
  showNodes: false,
  showEdges: false,
  showTileIds: false,

  init() {
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "d") {
        this.toggle();
      }
      if (this.active && e.key.toLowerCase() === "s") {
        this.solveCurrent();
      }
      if (this.active && e.key.toLowerCase() === "n") {
        this.nextLevel();
      }
    });
  },

  toggle() {
    this.active = !this.active;
    this.showNodes = this.active;
    this.showEdges = this.active;
    this.showTileIds = this.active;
    status(`Debug Mode: ${this.active ? "ON" : "OFF"}`);
    draw();
  },

  solveCurrent() {
    if (!state.current) return;
    status("Solving...");
    const solution = SolverEngine.solve(state.current);
    if (solution) {
      state.placements = solution;
      updateTileList();
      draw();
      status("Solved!");
    } else {
      status("No solution found.");
    }
  },

  nextLevel() {
    const next = getNextChallenge();
    if (next) {
      setChallenge(next);
      hideOverlay();
    }
  },

  draw(ctx, cellSize) {
    if (!this.active) return;

    if (this.showTileIds) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "bold 12px sans-serif";
      state.placements.forEach((p, id) => {
        const x = (p.anchorX + 0.5) * cellSize;
        const y = (p.anchorY + 0.5) * cellSize;
        ctx.fillText(id, x, y);
      });
      ctx.restore();
    }

    if (this.showNodes || this.showEdges) {
      this.drawGraph(ctx, cellSize);
    }
  },

  drawGraph(ctx, cellSize) {
    if (!state.current) return;
    
    const edgeNodes = new Set();
    const connections = [];

    state.placements.forEach((p, tileId) => {
      const shape = LogicCore.getTransformedTile(tileId, p.rotation);
      const nodes = shape.endpoints.map(ep => LogicCore.edgeNodeFromPoint(p.anchorX + ep.point.x, p.anchorY + ep.point.y));
      nodes.forEach(n => edgeNodes.add(n));
      connections.push({ a: nodes[0], b: nodes[1], color: "#3b82f6" });
    });

    const house = state.current.boardSetup.house;
    const doors = LogicCore.getDoorNodes(house);
    
    // Draw edges
    ctx.lineWidth = 2;
    connections.forEach(conn => {
      const pA = this.parseNode(conn.a, cellSize);
      const pB = this.parseNode(conn.b, cellSize);
      if (pA && pB) {
        ctx.strokeStyle = conn.color;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    edgeNodes.forEach(node => {
      const p = this.parseNode(node, cellSize);
      if (p) {
        ctx.fillStyle = doors.includes(node) ? "#f59e0b" : "#10b981";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },

  parseNode(nodeId, cellSize) {
    if (!nodeId || nodeId.startsWith("start") || nodeId.startsWith("door")) return null;
    const parts = nodeId.split("-").map(p => p.split(",").map(Number));
    // Midpoint of the edge
    const x = (parts[0][0] + parts[1][0]) / 2 * cellSize;
    const y = (parts[0][1] + parts[1][1]) / 2 * cellSize;
    return { x, y };
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
  red: asset("assets/icons/redcap.png"),
  wolf: asset("assets/icons/wolf.png"),
  tree: asset("assets/icons/tree.png"),
  house: asset("assets/icons/cabin.png"),
};

const tileImagePaths = {
  Blue: asset("assets/tiles/blau.svg"),
  Pink: asset("assets/tiles/rosa.svg"),
  White: asset("assets/tiles/weiss.svg"),
  Purple: asset("assets/tiles/lila.svg"),
  Yellow: asset("assets/tiles/gelb.svg"),
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
  inventoryRotations: new Map(), // Store rotation for each tile in inventory
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
  DebugManager.init();
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
    img.onload = () => draw();
    img.onerror = () => draw();
    img.src = src;
    iconCache[key] = img;
  });
}

function loadTileImages() {
  Object.entries(tileImagePaths).forEach(([tileId, src]) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      updateTileList();
      draw();
    };
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
  
  if (helpSidebarBtn) {
    helpSidebarBtn.addEventListener("click", () => {
      showHelp();
    });
  }

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
        // Save rotation to inventory before removing
        const placement = state.placements.get(state.selectedTileId);
        if (placement) {
          state.inventoryRotations.set(state.selectedTileId, placement.rotation);
        }
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

  function updateMusicMuteUI() {
    const muted = AudioManager.getMuted();
    if (overlaySoundOnIcon) overlaySoundOnIcon.classList.toggle("hidden", muted);
    if (overlaySoundOffIcon) overlaySoundOffIcon.classList.toggle("hidden", !muted);
    if (overlaySoundLabel) overlaySoundLabel.textContent = muted ? "Music off" : "Music on";
    if (overlaySoundBtn) overlaySoundBtn.setAttribute("aria-label", muted ? "Music off" : "Music on");
    if (musicMuteOnIcon) musicMuteOnIcon.classList.toggle("hidden", muted);
    if (musicMuteOffIcon) musicMuteOffIcon.classList.toggle("hidden", !muted);
    if (musicMuteBtn) musicMuteBtn.setAttribute("aria-label", muted ? "Music off" : "Music on");
  }
  updateMusicMuteUI();
  if (overlaySoundBtn) {
    overlaySoundBtn.addEventListener("click", () => {
      AudioManager.setMuted(!AudioManager.getMuted());
      updateMusicMuteUI();
    });
  }
  if (musicMuteBtn) {
    musicMuteBtn.addEventListener("click", () => {
      AudioManager.setMuted(!AudioManager.getMuted());
      updateMusicMuteUI();
    });
  }

  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      showHelp();
    });
  }

  if (closeHelpBtn) {
    closeHelpBtn.addEventListener("click", () => {
      hideHelp();
    });
  }

  // Close help when clicking outside
  if (helpOverlay) {
    helpOverlay.addEventListener("click", (e) => {
      if (e.target === helpOverlay) {
        hideHelp();
      }
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
    const { x: pixelX, y: pixelY } = getPixelFromEvent(event);

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
        const fromGrid = getAnchorGridCoords(tileId, currentDrag.rotation, currentDrag.pixelX, currentDrag.pixelY, 0, 0);
        
        const result = placeTile(tileId, currentDrag.x, currentDrag.y, currentDrag.rotation, {
            animateGlideFrom: { x: fromGrid.x, y: fromGrid.y }
        });
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
         const fromGrid = getAnchorGridCoords(tileId, currentDrag.rotation, currentDrag.pixelX, currentDrag.pixelY, 0, 0);
         result = placeTile(tileId, cell.x, cell.y, currentDrag.rotation, {
             animateGlideFrom: { x: fromGrid.x, y: fromGrid.y }
         });
    }
    
    // Try nearest
    if (!result?.ok && dropPoint) {
      const nearest = findNearestValidPlacement(tileId, currentDrag.rotation, dropPoint);
      if (nearest) {
        const fromGrid = getAnchorGridCoords(tileId, currentDrag.rotation, currentDrag.pixelX, currentDrag.pixelY, 0, 0);
        result = placeTile(tileId, nearest.x, nearest.y, currentDrag.rotation, {
            animateGlideFrom: { x: fromGrid.x, y: fromGrid.y }
        });
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
    const oldRot = p.rotation;
    const newRot = (oldRot + 90) % 360;
    
    // Temporarily remove self from placements to check collision properly
    const originalPlacement = { ...p };
    state.placements.delete(tileId);
    
    // 1. Try to rotate in place
    if (canPlaceTile(tileId, p.anchorX, p.anchorY, newRot)) {
      state.placements.set(tileId, { ...p, rotation: newRot });
      AnimationManager.addRotate(tileId, oldRot, newRot);
      AudioManager.playSFX("rotate");
      status("Rotated.");
    } 
    // 2. If it doesn't fit, find nearest valid spot
    else {
      // Calculate visual center of current placement to find "nearest" accurately
      const shape = LogicCore.getTransformedTile(tileId, p.rotation);
      const xs = shape.cells.map(c => p.anchorX + c.x);
      const ys = shape.cells.map(c => p.anchorY + c.y);
      const visualCenter = { 
        x: (Math.min(...xs) + Math.max(...xs) + 1) * 0.5,
        y: (Math.min(...ys) + Math.max(...ys) + 1) * 0.5
      };

      const nearest = findNearestValidPlacement(tileId, newRot, visualCenter);
      if (nearest) {
        state.placements.set(tileId, { 
          tileId, 
          rotation: newRot, 
          anchorX: nearest.x, 
          anchorY: nearest.y 
        });
        AnimationManager.addGlide(tileId, p.anchorX, p.anchorY, nearest.x, nearest.y);
        AnimationManager.addRotate(tileId, oldRot, newRot);
        AudioManager.playSFX("rotate");
        status("Rotated and moved to fit.");
      } else {
        // 3. Nowhere to go, put it back
        state.placements.set(tileId, originalPlacement);
        status("Cannot rotate: No space found.");
        AudioManager.playSFX("false");
      }
    }
    draw();
  }
}

function handleDragStart(e) {
    if (e.button !== 0) return; // Only Left Click
    if (!state.current) return;
    const { x: clickX, y: clickY } = getPixelFromEvent(e);
    
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
    
    const { x: pixelX, y: pixelY } = getPixelFromEvent(e);

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

    const { tileId, x, y, valid, rotation, originalX, originalY, pixelX, pixelY, offsetX, offsetY } = state.dragState;

    // Use release position for "outside" check (more reliable than last mousemove)
    const { x: releaseX, y: releaseY } = getPixelFromEvent(e);
    const margin = 40;
    const isOutside = releaseX < -margin || releaseX > canvas.width + margin ||
                      releaseY < -margin || releaseY > canvas.height + margin;

    resetDragState();

    if (valid && x !== -1 && !isOutside) {
        // Place at new spot (only if still over canvas)
        state.placements.delete(tileId);
        
        const fromGrid = getAnchorGridCoords(tileId, rotation, pixelX, pixelY, offsetX, offsetY);
        
        const result = placeTile(tileId, x, y, rotation, { 
            animateGlideFrom: { x: fromGrid.x, y: fromGrid.y } 
        });
        if (result.ok) {
            AudioManager.playSFX("rotate");
            return;
        }
    }

    // Dragged out of board → remove tile
    if (isOutside) {
        // Save rotation to inventory before removing
        const placement = state.placements.get(tileId);
        if (placement) {
          state.inventoryRotations.set(tileId, placement.rotation);
        }
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

function getAnchorGridCoords(tileId, rotation, pixelX, pixelY, offsetX, offsetY) {
  const { cellSize } = getBoardMetrics();
  const shape = LogicCore.getTransformedTile(tileId, rotation);
  const xs = shape.cells.map(c => c.x);
  const ys = shape.cells.map(c => c.y);
  const width = Math.max(...xs) - Math.min(...xs) + 1;
  const height = Math.max(...ys) - Math.min(...ys) + 1;
  
  // The visual center in pixels
  const centerX = pixelX - offsetX;
  const centerY = pixelY - offsetY;
  
  // Convert center back to anchor grid coordinates
  // Based on: centerX = (anchorX + width/2) * cellSize
  return {
    x: (centerX / cellSize) - (width / 2),
    y: (centerY / cellSize) - (height / 2)
  };
}

async function loadChallenges() {
  const isLocalFile = window.location.protocol === "file:";
  
  if (!isLocalFile) {
    try {
      const response = await fetch(asset("data/challenges.json"));
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
    // Show only the ID since difficulty is already part of it (e.g., "Starter 4" instead of "Starter 4 – Starter")
    option.textContent = challenge.id;
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
  modeLabel.textContent = challenge.requiredMode === "WithWolf" ? "WITH WOLF" : "WITHOUT WOLF";
  if (difficultyBadge) difficultyBadge.textContent = challenge.difficulty;
  updateTileList();
  status("Challenge loaded.");
  showOverlay("Ready?", "Select tiles and place them.", "Start");
  draw();
}

function updateTileList() {
  tileList.innerHTML = "";
  if (!state.current) return;

  const availableInInventory = state.current.availableTiles.filter(tileId => !state.placements.has(tileId));
  availableInInventory.forEach((tileId) => {
    const tile = tileDefs[tileId];
    const card = document.createElement("button");
    card.type = "button";
    card.draggable = true;
    card.title = tileId;
    // Static size for inventory items
    card.className = "flex h-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/40 p-2 transition hover:bg-slate-800 hover:scale-105 active:scale-95";
    if (state.selectedTileId === tileId) card.classList.add("ring-2", "ring-emerald-400/40", "bg-slate-800");
    
    // Get rotation for this tile (default 0)
    const tileRotation = state.inventoryRotations.get(tileId) || 0;
    
    const preview = document.createElement("canvas");
    renderTilePreview(preview, tileId, tileRotation);
    
    card.append(preview);
    
    card.addEventListener("click", () => {
      state.selectedTileId = tileId;
      state.rotation = tileRotation; // Use stored rotation
      updateTileList();
      status(`Selected: ${tileId}. Drag to board.`);
      draw();
    });
    
    // Right-click to rotate in inventory
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const currentRot = state.inventoryRotations.get(tileId) || 0;
      const newRot = (currentRot + 90) % 360;
      state.inventoryRotations.set(tileId, newRot);
      if (state.selectedTileId === tileId) {
        state.rotation = newRot;
      }
      AudioManager.playSFX("rotate");
      updateTileList();
      status(`Rotated ${tileId} to ${newRot}°.`);
    });
    
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", tileId);
      state.selectedTileId = tileId;
      state.rotation = tileRotation; // Use stored rotation
      
      state.dragState = {
        active: true,
        tileId: tileId,
        x: -1, 
        y: -1,
        rotation: tileRotation, // Use stored rotation
        valid: false
      };

      setTileDragImage(event, tileId, tileRotation);
    });

    card.addEventListener("dragend", () => {
        state.dragState = { active: false, tileId: null, x: -1, y: -1, rotation: 0, valid: false };
        draw();
    });
    
    tileList.append(card);
  });
}

function renderTilePreview(canvas, tileId, rotation) {
  const ctx = canvas.getContext("2d");
  const img = getTileImage(tileId);
  if (!img) return;

  // Use 0 rotation for inventory previews to keep it tidy
  const shape = LogicCore.getTransformedTile(tileId, 0);
  const isSingleCell = shape.cells.length === 1;
  
  const baseSize = 20; // Slightly smaller for inventory
  
  // Inventory preview is always horizontal or 1x1
  canvas.width = (isSingleCell ? 1 : 2) * baseSize;
  canvas.height = baseSize;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  // No rotation here for inventory
  
  const drawW = baseSize * 2;
  const drawH = baseSize;
  
  if (isSingleCell) {
    drawTintedImage(ctx, img, "#ffffff", -baseSize / 2, -baseSize / 2, drawW, drawH);
  } else {
    drawTintedImage(ctx, img, "#ffffff", -baseSize, -baseSize / 2, drawW, drawH);
  }
  ctx.restore();
}

function handleBoardClick(event) {
  if (!state.current) return;
  const cell = getCellFromEvent(event);
  if (!cell) return;

  if (!state.selectedTileId || state.placements.has(state.selectedTileId)) {
    const clickedTile = findTileAtCell(cell.x, cell.y);
    if (clickedTile) {
      state.selectedTileId = clickedTile;
      state.rotation = state.placements.get(clickedTile)?.rotation ?? 0;
      updateTileList(); // Refresh to clear inventory highlights
      status(`Selected: ${clickedTile}.`);
      draw();
    }
    return;
  }

  const fromGrid = getAnchorGridCoords(state.selectedTileId, state.rotation, getPixelFromEvent(event).x, getPixelFromEvent(event).y, 0, 0);

  const result = placeTile(state.selectedTileId, cell.x, cell.y, state.rotation, {
    animateGlideFrom: { x: fromGrid.x, y: fromGrid.y }
  });
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
    
    // Confetti!
    if (typeof confetti === 'function') {
      const btnRect = checkBtn.getBoundingClientRect();
      const originX = (btnRect.left + btnRect.width / 2) / window.innerWidth;
      const originY = (btnRect.top + btnRect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { x: originX, y: originY },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff']
      });
    }

    const nextChallenge = getNextChallenge();
    if (nextChallenge) {
      setTimeout(() => {
        setChallenge(nextChallenge);
        hideOverlay();
      }, 2000); // 2 seconds delay to enjoy the confetti
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
        const oldP = state.placements.get(tileId);
        state.placements.set(tileId, {
          tileId,
          rotation: p.rotation,
          anchorX: p.anchorX,
          anchorY: p.anchorY,
        });
        
        if (oldP) {
          AnimationManager.addGlide(tileId, oldP.anchorX, oldP.anchorY, p.anchorX, p.anchorY);
          AnimationManager.addRotate(tileId, oldP.rotation, p.rotation);
        }

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
  const p = state.placements.get(tileId);
  
  // If not placed yet, just update the global rotation state
  if (!p) {
    state.rotation = rotation;
    AudioManager.playSFX("rotate");
    updateTileList();
    draw();
    return;
  }

  // If already placed, try to rotate in place or find next spot
  state.rotation = rotation;
  const originalPlacement = { ...p };
  state.placements.delete(tileId);

  if (canPlaceTile(tileId, p.anchorX, p.anchorY, rotation)) {
    const oldRot = p.rotation;
    state.placements.set(tileId, { ...p, rotation });
    AnimationManager.addRotate(tileId, oldRot, rotation);
    AudioManager.playSFX("rotate");
    status("Rotated.");
  } else {
    const shape = LogicCore.getTransformedTile(tileId, p.rotation);
    const xs = shape.cells.map(c => p.anchorX + c.x);
    const ys = shape.cells.map(c => p.anchorY + c.y);
    const visualCenter = { 
      x: (Math.min(...xs) + Math.max(...xs) + 1) * 0.5,
      y: (Math.min(...ys) + Math.max(...ys) + 1) * 0.5
    };

    const nearest = findNearestValidPlacement(tileId, rotation, visualCenter);
    if (nearest) {
      const oldRot = p.rotation;
      state.placements.set(tileId, { 
        tileId, 
        rotation, 
        anchorX: nearest.x, 
        anchorY: nearest.y 
      });
      AnimationManager.addGlide(tileId, p.anchorX, p.anchorY, nearest.x, nearest.y);
      AnimationManager.addRotate(tileId, oldRot, rotation);
      AudioManager.playSFX("rotate");
      status("Rotated and moved to fit.");
    } else {
      state.placements.set(tileId, originalPlacement);
      status("No space found for rotation.");
      AudioManager.playSFX("false");
    }
  }
  updateTileList();
  draw();
}

function placeTile(tileId, anchorX, anchorY, rotation, options = {}) {
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

  if (options.animateGlideFrom) {
    AnimationManager.addGlide(tileId, options.animateGlideFrom.x, options.animateGlideFrom.y, anchorX, anchorY);
  }

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

function getPixelFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function getCellFromEvent(event) {
  const { x, y } = getPixelFromEvent(event);
  const { cellSize, startX, startY } = getBoardMetrics();
  const col = Math.floor((x - startX) / cellSize);
  const row = Math.floor((y - startY) / cellSize);
  if (col < 0 || col >= boardConfig.cols || row < 0 || row >= boardConfig.rows) return null;
  return { x: col, y: row };
}

function getDropPoint(event) {
  const { x, y } = getPixelFromEvent(event);
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
    
    // Animation Override
    let drawP = { ...p };
    const anim = AnimationManager.animations.get(tileId);
    if (anim) {
      if (anim.glide) {
        drawP.anchorX = anim.glide.current.x;
        drawP.anchorY = anim.glide.current.y;
      }
      if (anim.rotate) {
        drawP.rotation = anim.rotate.current;
      }
    }
    
    drawTileImage(tileId, drawP, cellSize, state.tileTint);
    
    if (DEBUG_ENDPOINTS) {
      const shape = LogicCore.getTransformedTile(tileId, p.rotation);
      ctx.fillStyle = "#94a3b8"; // Light gray (slate-400)
      const radius = Math.max(1, Math.round(cellSize * 0.03)); // Smaller radius
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
  
  // Use a smaller scale for the drag image so it doesn't obscure everything
  const dragScale = 0.8;
  const size = cellSize * dragScale;
  
  if (isSingleCell) {
    canvas.width = size;
    canvas.height = size;
  } else {
    canvas.width = (isVertical ? 1 : 2) * size;
    canvas.height = (isVertical ? 2 : 1) * size;
  }

  const ctx = canvas.getContext("2d");
  const img = getTileImage(tileId);
  if (img) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    const drawW = size * 2;
    const drawH = size;
    
    if (isSingleCell) {
      drawTintedImage(ctx, img, "#ffffff", -size / 2, -size / 2, drawW, drawH);
    } else {
      drawTintedImage(ctx, img, "#ffffff", -size, -size / 2, drawW, drawH);
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
function showHelp() {
  if (helpOverlay) helpOverlay.classList.remove("hidden");
}
function hideHelp() {
  if (helpOverlay) helpOverlay.classList.add("hidden");
}
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
