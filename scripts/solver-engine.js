(function() {
  const LogicCore = typeof require !== "undefined" ? require("./logic-core") : (window.LogicCore || {});

  const SolverEngine = {
    solve(challenge) {
      const requiredCount = challenge.requiredTileCount ?? challenge.availableTiles.length;
      const blockedMask = this.getBlockedMask(challenge);
      const tileOptions = this.getPrecomputedPlacements(challenge.availableTiles, blockedMask);

      const tileSets = this.getTileSets(challenge.availableTiles, requiredCount);

      for (const tiles of tileSets) {
        const solution = this.backtrack([], tiles, 0, 0, tileOptions, challenge);
        if (solution) return solution;
      }

      return null;
    },

    getBlockedMask(challenge) {
      let mask = 0;
      const { cols } = LogicCore.boardConfig;

      const add = (x, y) => {
        if (x < 1 || x > 4 || y < 1 || y > 4) return;
        mask |= 1 << ((y - 1) * cols + (x - 1));
      };

      challenge.boardSetup.trees.forEach(([x, y]) => add(x, y));
      add(...challenge.boardSetup.startRot);
      if (challenge.boardSetup.startWolf) add(...challenge.boardSetup.startWolf);
      add(...challenge.boardSetup.house.position);

      return mask;
    },

    getPrecomputedPlacements(availableTiles, blockedMask) {
      const options = new Map();
      const { cols, rows } = LogicCore.boardConfig;

      availableTiles.forEach((tileId) => {
        const placements = [];
        const seen = new Set();

        [0, 90, 180, 270].forEach((rotation) => {
          const shape = LogicCore.getTransformedTile(tileId, rotation);
          const key = shape.cells.map((c) => `${c.x},${c.y}`).join("|");
          if (seen.has(key)) return;
          seen.add(key);

          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              let pMask = 0;
              let valid = true;
              for (const cell of shape.cells) {
                const cx = x + cell.x;
                const cy = y + cell.y;
                if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) {
                  valid = false;
                  break;
                }
                const bit = 1 << (cy * cols + cx);
                if (blockedMask & bit) {
                  valid = false;
                  break;
                }
                pMask |= bit;
              }
              if (valid) {
                placements.push({ tileId, rotation, anchorX: x, anchorY: y, mask: pMask });
              }
            }
          }
        });
        options.set(tileId, placements);
      });

      return options;
    },

    getTileSets(tiles, size) {
      if (size === tiles.length) return [tiles];
      const result = [];
      const combine = (start, current) => {
        if (current.length === size) {
          result.push([...current]);
          return;
        }
        for (let i = start; i < tiles.length; i++) {
          current.push(tiles[i]);
          combine(i + 1, current);
          current.pop();
        }
      };
      combine(0, []);
      return result;
    },

    backtrack(currentPlacements, tiles, index, usedMask, tileOptions, challenge) {
      if (index === tiles.length) {
        const placementMap = new Map();
        currentPlacements.forEach((p) => placementMap.set(p.tileId, p));
        const result = LogicCore.validateSolution(challenge, placementMap);
        return result.ok ? placementMap : null;
      }

      const tileId = tiles[index];
      const options = tileOptions.get(tileId) || [];

      for (const p of options) {
        if ((p.mask & usedMask) === 0) {
          currentPlacements.push(p);
          const found = this.backtrack(currentPlacements, tiles, index + 1, usedMask | p.mask, tileOptions, challenge);
          if (found) return found;
          currentPlacements.pop();
        }
      }

      return null;
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = SolverEngine;
  }
  if (typeof window !== "undefined") {
    window.SolverEngine = SolverEngine;
  }
})();