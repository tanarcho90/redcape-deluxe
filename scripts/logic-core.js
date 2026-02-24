(function() {
  const LogicCore = {
    boardConfig: {
      cols: 4,
      rows: 4,
    },

    tileDefs: {
      Blau:  { id: "Blau",  endpoints: [{ cell: "A", edge: "W" }, { cell: "B", edge: "E" }] }, // Straight, 2 cells
      Rosa:  { id: "Rosa",  endpoints: [{ cell: "A", edge: "S" }, { cell: "B", edge: "N" }] }, // Straight, 2 cells
      Weiss: { id: "Weiss", endpoints: [{ cell: "A", edge: "W" }, { cell: "A", edge: "N" }] }, // Curve, 1 cell
      Lila:  { id: "Lila",  endpoints: [{ cell: "A", edge: "W" }, { cell: "B", edge: "N" }] }, // Curve, 2 cells
      Gelb:  { id: "Gelb",  endpoints: [{ cell: "A", edge: "S" }, { cell: "B", edge: "S" }] }, // U-Turn, 2 cells
    },

    getTransformedTile(tileId, rotation) {
      const rotateSteps = (((rotation % 360) + 360) % 360) / 90;
      const tileDef = this.tileDefs[tileId];
      
      // Determine if it's a 1-cell or 2-cell tile based on endpoint references
      const usedCellIds = new Set(tileDef.endpoints.map(ep => ep.cell));
      let cells = [{ id: "A", x: 0, y: 0 }];
      if (usedCellIds.has("B")) {
        cells.push({ id: "B", x: 1, y: 0 });
      }

      let endpoints = tileDef.endpoints.map(ep => ({...ep}));

      for (let i = 0; i < rotateSteps; i++) {
        cells = cells.map(c => ({ ...c, x: -c.y, y: c.x }));
        endpoints = endpoints.map(ep => ({ ...ep, edge: this.rotateEdge(ep.edge) }));
      }

      const minX = Math.min(...cells.map(c => c.x));
      const minY = Math.min(...cells.map(c => c.y));
      cells = cells.map(c => ({ ...c, x: c.x - minX, y: c.y - minY }));

      const cellLookup = Object.fromEntries(cells.map(c => [c.id, c]));
      const resolvedEndpoints = endpoints.map(ep => {
        const cell = cellLookup[ep.cell];
        const offset = this.getEdgeOffset(ep.edge);
        return {
          cellId: ep.cell,
          point: { x: cell.x + offset.x, y: cell.y + offset.y }
        };
      });

      return { cells, endpoints: resolvedEndpoints };
    },

    rotateEdge(edge) {
      const map = { N: "E", E: "S", S: "W", W: "N" };
      return map[edge];
    },

    getEdgeOffset(edge) {
      if (edge === "N") return { x: 0.5, y: 0 };
      if (edge === "S") return { x: 0.5, y: 1 };
      if (edge === "W") return { x: 0, y: 0.5 };
      return { x: 1, y: 0.5 };
    },

    edgeNodeId(cellX, cellY, edge) {
      let a, b;
      if (edge === "N") { a = { x: cellX, y: cellY }; b = { x: cellX + 1, y: cellY }; }
      else if (edge === "E") { a = { x: cellX + 1, y: cellY }; b = { x: cellX + 1, y: cellY + 1 }; }
      else if (edge === "S") { a = { x: cellX, y: cellY + 1 }; b = { x: cellX + 1, y: cellY + 1 }; }
      else { a = { x: cellX, y: cellY }; b = { x: cellX, y: cellY + 1 }; }
      return this.normalizeEdge(a, b);
    },

    edgeNodeFromPoint(x, y) {
      const eps = 1e-6;
      const isInt = (val) => Math.abs(val - Math.round(val)) < eps;
      if (isInt(x) && !isInt(y)) return this.normalizeEdge({ x: Math.round(x), y: Math.floor(y) }, { x: Math.round(x), y: Math.ceil(y) });
      if (isInt(y) && !isInt(x)) return this.normalizeEdge({ x: Math.floor(x), y: Math.round(y) }, { x: Math.ceil(x), y: Math.round(y) });
      return null;
    },

    normalizeEdge(a, b) {
      if (a.x < b.x || (a.x === b.x && a.y <= b.y)) return `${a.x},${a.y}-${b.x},${b.y}`;
      return `${b.x},${b.y}-${a.x},${a.y}`;
    },

    getDoorNodes(house) {
      const [hx, hy] = house.position;
      const edges = ["N", "E", "S", "W"];
      // All sides are doors
      return edges.map(dir => this.edgeNodeId(hx - 1, hy - 1, dir));
    },

    validateSolution(challenge, placements) {
      const requiredCount = challenge.requiredTileCount ?? challenge.availableTiles.length;
      if (placements.size !== requiredCount) return { ok: false, message: "Place all tiles." };

      const graph = new Map();
      const edgeNodes = new Set();
      const addEdge = (a, b, weight) => {
        if (!graph.has(a)) graph.set(a, []);
        if (!graph.has(b)) graph.set(b, []);
        graph.get(a).push({ node: b, weight });
        graph.get(b).push({ node: a, weight });
      };

      for (const [tileId, p] of placements) {
        const shape = this.getTransformedTile(tileId, p.rotation);
        const nodes = shape.endpoints.map(ep => this.edgeNodeFromPoint(p.anchorX + ep.point.x, p.anchorY + ep.point.y));
        if (nodes.some(n => !n)) return { ok: false, message: "Invalid placement." };
        nodes.forEach(n => edgeNodes.add(n));
        
        const weight = (shape.endpoints[0].cellId === shape.endpoints[1].cellId) ? 1 : 2;
        addEdge(nodes[0], nodes[1], weight);
      }

      const startRotNode = "start:rot";
      const startWolfNode = "start:wolf";
      const doorNodes = this.getDoorNodes(challenge.boardSetup.house);

      const connect = (coord, nodeId) => {
        if (!coord) return;
        ["N", "E", "S", "W"].forEach(dir => {
          const edge = this.edgeNodeId(coord[0] - 1, coord[1] - 1, dir);
          if (edgeNodes.has(edge)) addEdge(nodeId, edge, 0);
        });
      };

      connect(challenge.boardSetup.startRot, startRotNode);
      if (challenge.requiredMode === "WithWolf") connect(challenge.boardSetup.startWolf, startWolfNode);
      doorNodes.forEach((node, i) => { if (edgeNodes.has(node)) addEdge(`door:${i}`, node, 0); });

      const degrees = new Map();
      edgeNodes.forEach(node => degrees.set(node, (graph.get(node) || []).length));
      if ([...degrees.values()].some(d => d !== 2)) return { ok: false, message: "Gaps or crossings." };

      const components = this.buildComponents(graph);
      const rotComp = components.nodeToComponent.get(startRotNode);
      if (rotComp === undefined) return { ok: false, message: "Red is lost." };

      const reachedDoors = doorNodes.map((_, i) => components.nodeToComponent.get(`door:${i}`));

      if (challenge.requiredMode === "WithoutWolf") {
        if (!reachedDoors.some(c => c === rotComp)) return { ok: false, message: "Red missed the house." };
        if (edgeNodes.size > components.componentMembers.get(rotComp).size) return { ok: false, message: "Extra tiles." };
        return { ok: true, message: "Success!" };
      }

      const wolfComp = components.nodeToComponent.get(startWolfNode);
      if (wolfComp === undefined || wolfComp === rotComp) return { ok: false, message: "Paths invalid." };
      if (!reachedDoors.some(c => c === rotComp) || !reachedDoors.some(c => c === wolfComp)) return { ok: false, message: "Missed house." };

      const covered = new Set([...components.componentMembers.get(rotComp), ...components.componentMembers.get(wolfComp)]);
      if (edgeNodes.size > covered.size) return { ok: false, message: "Extra tiles." };

      const rotLen = this.shortestPathToAny(graph, startRotNode, doorNodes.map((_, i) => `door:${i}`));
      const wolfLen = this.shortestPathToAny(graph, startWolfNode, doorNodes.map((_, i) => `door:${i}`));

      if (wolfLen >= rotLen) return { ok: false, message: "Wolf path must be shorter." };

      return { ok: true, message: "Success!" };
    },

    buildComponents(graph) {
      const nodeToComponent = new Map();
      const componentMembers = new Map();
      let componentId = 0;
      for (const node of graph.keys()) {
        if (nodeToComponent.has(node)) continue;
        const members = new Set();
        const queue = [node];
        nodeToComponent.set(node, componentId);
        while (queue.length) {
          const curr = queue.shift();
          members.add(curr);
          (graph.get(curr) || []).forEach(edge => {
            if (!nodeToComponent.has(edge.node)) {
              nodeToComponent.set(edge.node, componentId);
              queue.push(edge.node);
            }
          });
        }
        componentMembers.set(componentId, members);
        componentId++;
      }
      return { nodeToComponent, componentMembers };
    },

    shortestPath(graph, start, target) {
      if (start === target) return 0;
      const dists = new Map();
      dists.set(start, 0);
      const queue = [start];
      while (queue.length) {
        queue.sort((a, b) => dists.get(a) - dists.get(b));
        const curr = queue.shift();
        const d = dists.get(curr);
        if (curr === target) return d;
        for (const edge of (graph.get(curr) || [])) {
          const newD = d + edge.weight;
          if (!dists.has(edge.node) || newD < dists.get(edge.node)) {
            dists.set(edge.node, newD);
            if (!queue.includes(edge.node)) queue.push(edge.node);
          }
        }
      }
      return null;
    },

    shortestPathToAny(graph, start, targets) {
      let best = null;
      targets.forEach(t => {
        const d = this.shortestPath(graph, start, t);
        if (d !== null && (best === null || d < best)) best = d;
      });
      return best;
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = LogicCore;
  }
  if (typeof window !== "undefined") {
    window.LogicCore = LogicCore;
  }
})();