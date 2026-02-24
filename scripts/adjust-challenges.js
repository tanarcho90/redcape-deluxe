const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "challenges.json");
const inlinePath = path.join(__dirname, "..", "data", "challenges.inline.js");

const raw = fs.readFileSync(dataPath, "utf8");
const data = JSON.parse(raw);

const boardConfig = { cols: 4, rows: 4 };

const tileDefs = {
  Blau: {
    endpoints: [
      { cell: "A", edge: "W" },
      { cell: "B", edge: "E" },
    ],
  },
  Rosa: {
    endpoints: [
      { cell: "A", edge: "S" },
      { cell: "B", edge: "N" },
    ],
  },
  Weiss: {
    endpoints: [
      { cell: "A", edge: "W" },
      { cell: "A", edge: "N" },
    ],
  },
  Lila: {
    endpoints: [
      { cell: "A", edge: "W" },
      { cell: "B", edge: "N" },
    ],
  },
  Gelb: {
    endpoints: [
      { cell: "A", edge: "S" },
      { cell: "B", edge: "S" },
    ],
  },
};

function getEdgeOffset(edge) {
  if (edge === "N") return { x: 0.5, y: 0 };
  if (edge === "S") return { x: 0.5, y: 1 };
  if (edge === "W") return { x: 0, y: 0.5 };
  return { x: 1, y: 0.5 };
}

function getTransformedTile(tileId, rotation) {
  const baseCells = [
    { id: "A", x: 0, y: 0 },
    { id: "B", x: 1, y: 0 },
  ];
  const baseCellLookup = Object.fromEntries(baseCells.map((cell) => [cell.id, cell]));
  const baseEndpoints = tileDefs[tileId].endpoints.map((endpoint) => {
    const cell = baseCellLookup[endpoint.cell];
    const offset = getEdgeOffset(endpoint.edge);
    return {
      point: {
        x: cell.x + offset.x,
        y: cell.y + offset.y,
      },
    };
  });

  const rotateTimes = ((rotation % 360) + 360) % 360;
  const rotateSteps = rotateTimes / 90;
  const tileCenter = { x: 1, y: 0.5 };

  const transformPoint = (point) => {
    let x = point.x - tileCenter.x;
    let y = point.y - tileCenter.y;
    for (let i = 0; i < rotateSteps; i += 1) {
      const nextX = -y;
      const nextY = x;
      x = nextX;
      y = nextY;
    }
    return { x: x + tileCenter.x, y: y + tileCenter.y };
  };

  const transformedCells = baseCells.map((cell) => {
    const center = { x: cell.x + 0.5, y: cell.y + 0.5 };
    const rotated = transformPoint(center);
    return {
      id: cell.id,
      x: rotated.x - 0.5,
      y: rotated.y - 0.5,
    };
  });

  const transformedEndpoints = baseEndpoints.map((endpoint) => ({
    point: transformPoint(endpoint.point),
  }));

  const anchorCell = transformedCells.find((cell) => cell.id === "A") || { x: 0, y: 0 };
  const cells = transformedCells.map((cell) => ({
    ...cell,
    x: cell.x - anchorCell.x,
    y: cell.y - anchorCell.y,
  }));
  const endpoints = transformedEndpoints.map((endpoint) => ({
    point: {
      x: endpoint.point.x - anchorCell.x,
      y: endpoint.point.y - anchorCell.y,
    },
  }));

  return { cells, endpoints };
}

function isWithinBoard(x, y) {
  return x >= 0 && x < boardConfig.cols && y >= 0 && y < boardConfig.rows;
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function getBlockedCells(challenge) {
  const blocked = new Set();
  challenge.boardSetup.trees.forEach(([x, y]) => blocked.add(cellKey(x - 1, y - 1)));
  const [rx, ry] = challenge.boardSetup.startRot;
  blocked.add(cellKey(rx - 1, ry - 1));
  if (challenge.boardSetup.startWolf) {
    const [wx, wy] = challenge.boardSetup.startWolf;
    blocked.add(cellKey(wx - 1, wy - 1));
  }
  const [hx, hy] = challenge.boardSetup.house.position;
  blocked.add(cellKey(hx - 1, hy - 1));
  return blocked;
}

function placementsForTile(tileId, blocked) {
  const placements = [];
  const seen = new Set();
  [0, 90, 180, 270].forEach((rotation) => {
    const shape = getTransformedTile(tileId, rotation);
    const key = `${rotation}-${shape.cells.map((cell) => `${cell.x},${cell.y}`).join("|")}`;
    if (seen.has(key)) return;
    seen.add(key);

    for (let anchorY = 0; anchorY < boardConfig.rows; anchorY += 1) {
      for (let anchorX = 0; anchorX < boardConfig.cols; anchorX += 1) {
        let valid = true;
        for (const cell of shape.cells) {
          const x = anchorX + cell.x;
          const y = anchorY + cell.y;
          if (!isWithinBoard(x, y) || blocked.has(cellKey(x, y))) {
            valid = false;
            break;
          }
        }
        if (!valid) continue;
        placements.push({
          tileId,
          rotation,
          anchorX,
          anchorY,
        });
      }
    }
  });
  return placements;
}

function edgeNodeId(cellX, cellY, edge) {
  let a = null;
  let b = null;
  if (edge === "N") {
    a = { x: cellX, y: cellY };
    b = { x: cellX + 1, y: cellY };
  } else if (edge === "E") {
    a = { x: cellX + 1, y: cellY };
    b = { x: cellX + 1, y: cellY + 1 };
  } else if (edge === "S") {
    a = { x: cellX, y: cellY + 1 };
    b = { x: cellX + 1, y: cellY + 1 };
  } else {
    a = { x: cellX, y: cellY };
    b = { x: cellX, y: cellY + 1 };
  }
  return normalizeEdge(a, b);
}

function edgeNodeFromPoint(x, y) {
  const eps = 1e-6;
  const isInt = (value) => Math.abs(value - Math.round(value)) < eps;
  const intX = Math.round(x);
  const intY = Math.round(y);
  if (isInt(x) && !isInt(y)) {
    const y0 = Math.floor(y + eps);
    return normalizeEdge({ x: intX, y: y0 }, { x: intX, y: y0 + 1 });
  }
  if (isInt(y) && !isInt(x)) {
    const x0 = Math.floor(x + eps);
    return normalizeEdge({ x: x0, y: intY }, { x: x0 + 1, y: intY });
  }
  return null;
}

function normalizeEdge(a, b) {
  if (a.x < b.x || (a.x === b.x && a.y <= b.y)) {
    return `${a.x},${a.y}-${b.x},${b.y}`;
  }
  return `${b.x},${b.y}-${a.x},${a.y}`;
}

function addEdge(graph, a, b) {
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a).add(b);
  graph.get(b).add(a);
}

function connectStart(startCoord, nodeId, edgeNodes, graph) {
  if (!startCoord) return;
  const [sx, sy] = startCoord;
  const cellX = sx - 1;
  const cellY = sy - 1;
  if (cellX < 0 || cellX >= boardConfig.cols || cellY < 0 || cellY >= boardConfig.rows) return;
  ["N", "E", "S", "W"].forEach((edge) => {
    const node = edgeNodeId(cellX, cellY, edge);
    if (edgeNodes.has(node)) {
      addEdge(graph, nodeId, node);
    }
  });
}

function connectDoors(house, doorNodes, edgeNodes, graph) {
  const [hx, hy] = house.position;
  const cellX = hx - 1;
  const cellY = hy - 1;
  if (cellX < 0 || cellX >= boardConfig.cols || cellY < 0 || cellY >= boardConfig.rows) return;
  const edges = ["N", "E", "S", "W"];
  edges.forEach((edge, index) => {
    if (index >= doorNodes.length) return;
    const node = edgeNodeId(cellX, cellY, edge);
    if (edgeNodes.has(node)) {
      addEdge(graph, doorNodes[index], node);
    }
  });
}

function getEdgeDegrees(graph, edgeNodes) {
  const degrees = new Map();
  edgeNodes.forEach((node) => {
    const neighbors = graph.get(node);
    degrees.set(node, neighbors ? neighbors.size : 0);
  });
  return degrees;
}

function buildComponents(graph) {
  const nodeToComponent = new Map();
  const componentMembers = new Map();
  let componentId = 0;

  graph.forEach((_, node) => {
    if (nodeToComponent.has(node)) return;
    const queue = [node];
    const members = new Set();
    nodeToComponent.set(node, componentId);
    while (queue.length) {
      const current = queue.shift();
      members.add(current);
      const neighbors = graph.get(current) || [];
      for (const neighbor of neighbors) {
        if (!nodeToComponent.has(neighbor)) {
          nodeToComponent.set(neighbor, componentId);
          queue.push(neighbor);
        }
      }
    }
    componentMembers.set(componentId, members);
    componentId += 1;
  });

  return { nodeToComponent, componentMembers };
}

function allEdgeNodesInComponent(edgeNodes, components, componentId) {
  for (const node of edgeNodes) {
    if (components.nodeToComponent.get(node) !== componentId) return false;
  }
  return true;
}

function shortestPath(graph, start, target) {
  if (start === target) return 0;
  const queue = [{ node: start, dist: 0 }];
  const visited = new Set([start]);
  while (queue.length) {
    const { node, dist } = queue.shift();
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      if (neighbor === target) return dist + 1;
      visited.add(neighbor);
      queue.push({ node: neighbor, dist: dist + 1 });
    }
  }
  return null;
}

function shortestPathToAny(graph, start, targets) {
  let best = null;
  targets.forEach((target) => {
    const distance = shortestPath(graph, start, target);
    if (distance == null) return;
    if (best == null || distance < best) best = distance;
  });
  return best;
}

function validateSolution(challenge, placements) {
  const requiredCount = challenge.requiredTileCount ?? challenge.availableTiles.length;
  if (placements.size !== requiredCount) {
    return { ok: false };
  }

  const graph = new Map();
  const edgeNodes = new Set();
  let invalidEndpoint = false;

  placements.forEach((placement, tileId) => {
    const shape = getTransformedTile(tileId, placement.rotation);
    const endpoints = shape.endpoints.map((endpoint) => {
      const pointX = placement.anchorX + endpoint.point.x;
      const pointY = placement.anchorY + endpoint.point.y;
      const nodeId = edgeNodeFromPoint(pointX, pointY);
      if (!nodeId) {
        invalidEndpoint = true;
        return null;
      }
      edgeNodes.add(nodeId);
      return nodeId;
    });
    if (invalidEndpoint || endpoints.includes(null)) return;
    addEdge(graph, endpoints[0], endpoints[1]);
  });

  if (invalidEndpoint || edgeNodes.size === 0) {
    return { ok: false };
  }

  const startRotNode = "start:rot";
  const startWolfNode = "start:wolf";
  const doorNodes = ["house:N", "house:E", "house:S", "house:W"];

  connectStart(challenge.boardSetup.startRot, startRotNode, edgeNodes, graph);
  if (challenge.requiredMode === "WithWolf") {
    connectStart(challenge.boardSetup.startWolf, startWolfNode, edgeNodes, graph);
  }
  connectDoors(challenge.boardSetup.house, doorNodes, edgeNodes, graph);

  const edgeDegrees = getEdgeDegrees(graph, edgeNodes);
  for (const degree of edgeDegrees.values()) {
    if (degree !== 2) {
      return { ok: false };
    }
  }

  const components = buildComponents(graph);
  const rotComponent = components.nodeToComponent.get(startRotNode);
  if (rotComponent == null) {
    return { ok: false };
  }

  const doorComponents = doorNodes.map((node) => components.nodeToComponent.get(node));
  if (challenge.requiredMode === "WithoutWolf") {
    const reachesDoor = doorComponents.some((comp) => comp === rotComponent);
    if (!reachesDoor) {
      return { ok: false };
    }
    if (!allEdgeNodesInComponent(edgeNodes, components, rotComponent)) {
      return { ok: false };
    }
    const distance = shortestPathToAny(graph, startRotNode, doorNodes);
    if (distance == null) {
      return { ok: false };
    }
    return { ok: true };
  }

  const wolfComponent = components.nodeToComponent.get(startWolfNode);
  if (wolfComponent == null || wolfComponent === rotComponent) {
    return { ok: false };
  }

  const rotReachesDoor = doorComponents.some((comp) => comp === rotComponent);
  const wolfReachesDoor = doorComponents.some((comp) => comp === wolfComponent);
  if (!rotReachesDoor || !wolfReachesDoor) {
    return { ok: false };
  }
  const covered = new Set([
    ...components.componentMembers.get(rotComponent),
    ...components.componentMembers.get(wolfComponent),
  ]);
  for (const edgeNode of edgeNodes) {
    if (!covered.has(edgeNode)) {
      return { ok: false };
    }
  }

  const rotDistance = shortestPathToAny(graph, startRotNode, doorNodes);
  const wolfDistance = shortestPathToAny(graph, startWolfNode, doorNodes);
  if (rotDistance == null || wolfDistance == null) {
    return { ok: false };
  }
  if (wolfDistance >= rotDistance) {
    return { ok: false };
  }

  return { ok: true };
}

function solveChallenge(challenge) {
  const requiredCount = challenge.requiredTileCount ?? challenge.availableTiles.length;
  const blocked = getBlockedCells(challenge);
  const basePlacements = new Map();
  challenge.availableTiles.forEach((tileId) => {
    basePlacements.set(tileId, placementsForTile(tileId, blocked));
  });

  const tileSets = requiredCount === challenge.availableTiles.length
    ? [challenge.availableTiles]
    : combinations(challenge.availableTiles, requiredCount);

  for (const tiles of tileSets) {
    const orderedTiles = [...tiles].sort((a, b) => {
      const countA = basePlacements.get(a)?.length ?? 0;
      const countB = basePlacements.get(b)?.length ?? 0;
      if (countA === countB) return a.localeCompare(b);
      return countA - countB;
    });
    const placements = new Map();
    if (search(orderedTiles, 0, placements, 0, basePlacements, challenge)) {
      return { ok: true };
    }
  }
  return { ok: false };
}

function search(tiles, index, placements, usedMask, tilePlacements, challenge) {
  if (index >= tiles.length) {
    return validateSolution({
      ...challenge,
      availableTiles: tiles,
      requiredTileCount: tiles.length,
    }, placements).ok;
  }
  const tileId = tiles[index];
  const candidates = tilePlacements.get(tileId) || [];
  for (const placement of candidates) {
    const mask = placementMask(tileId, placement);
    if ((usedMask & mask) !== 0) continue;
    placements.set(tileId, placement);
    if (search(tiles, index + 1, placements, usedMask | mask, tilePlacements, challenge)) {
      return true;
    }
    placements.delete(tileId);
  }
  return false;
}

function placementMask(tileId, placement) {
  const shape = getTransformedTile(tileId, placement.rotation);
  let mask = 0;
  shape.cells.forEach((cell) => {
    const x = placement.anchorX + cell.x;
    const y = placement.anchorY + cell.y;
    mask |= 1 << (y * boardConfig.cols + x);
  });
  return mask;
}

function combinations(array, size) {
  const result = [];
  const choose = (start, combo) => {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i += 1) {
      combo.push(array[i]);
      choose(i + 1, combo);
      combo.pop();
    }
  };
  choose(0, []);
  return result;
}

const allTiles = Object.keys(tileDefs);
const updates = [];
const failures = [];
const boardUpdates = [];

data.challenges = (data.challenges || []).map((challenge) => {
  const originalCount = challenge.requiredTileCount ?? challenge.availableTiles.length;
  let selected = null;
  let selectedCount = originalCount;

  if (solveChallenge(challenge).ok) {
    return challenge;
  }

  for (let count = originalCount; count <= allTiles.length; count += 1) {
    const combos = combinations(allTiles, count);
    for (const combo of combos) {
      const candidate = {
        ...challenge,
        availableTiles: combo,
        requiredTileCount: count,
      };
      if (solveChallenge(candidate).ok) {
        selected = combo;
        selectedCount = count;
        break;
      }
    }
    if (selected) break;
  }

  if (!selected) {
    return challenge;
  }

  const didChange =
    selectedCount !== originalCount ||
    challenge.availableTiles.length !== selected.length ||
    challenge.availableTiles.some((tile, index) => tile !== selected[index]);

  if (didChange) {
    updates.push({
      id: challenge.id,
      fromCount: originalCount,
      toCount: selectedCount,
      fromTiles: challenge.availableTiles,
      toTiles: selected,
    });
  }

  return {
    ...challenge,
    availableTiles: selected,
    requiredTileCount: selectedCount,
  };
});

const positions = [];
for (let y = 1; y <= boardConfig.rows; y += 1) {
  for (let x = 1; x <= boardConfig.cols; x += 1) {
    positions.push({ x, y });
  }
}

function posKey(pos) {
  return `${pos.x},${pos.y}`;
}

function normalizeTreeSet(trees) {
  return trees.map(([x, y]) => `${x},${y}`).sort().join("|");
}

function moveToFront(list, matchFn) {
  const index = list.findIndex(matchFn);
  if (index > 0) {
    const [item] = list.splice(index, 1);
    list.unshift(item);
  }
  return list;
}

function findSolvableBoard(challenge) {
  const treeCount = challenge.boardSetup.trees.length;
  const originalStartRot = challenge.boardSetup.startRot;
  const originalStartWolf = challenge.boardSetup.startWolf;
  const originalHouse = challenge.boardSetup.house.position;

  const seedFromId = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash || 1;
  };

  const rng = (() => {
    let seed = seedFromId(challenge.id);
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
  })();

  const shuffle = (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  };

  const tryBoard = (trees, startRot, startWolf, house) => {
    const candidate = {
      ...challenge,
      boardSetup: {
        trees,
        startRot: [startRot.x, startRot.y],
        ...(challenge.requiredMode === "WithWolf"
          ? { startWolf: [startWolf.x, startWolf.y] }
          : {}),
        house: { position: [house.x, house.y], chimney: challenge.boardSetup.house.chimney },
      },
    };
    return solveChallenge(candidate).ok ? candidate.boardSetup : null;
  };

  const pickFrom = (pool, count) => {
    const copy = shuffle(pool);
    return copy.slice(0, count);
  };

  const orderedCandidates = [
    { x: originalStartRot[0], y: originalStartRot[1] },
    ...(challenge.requiredMode === "WithWolf" && originalStartWolf
      ? [{ x: originalStartWolf[0], y: originalStartWolf[1] }]
      : []),
    { x: originalHouse[0], y: originalHouse[1] },
  ];
  if (orderedCandidates.every((pos) => positions.some((p) => p.x === pos.x && p.y === pos.y))) {
    const unique = new Set(orderedCandidates.map((pos) => posKey(pos)));
    if (unique.size === orderedCandidates.length) {
      const fixedTrees = challenge.boardSetup.trees.map((tree) => [tree[0], tree[1]]);
      const result = tryBoard(
        fixedTrees,
        orderedCandidates[0],
        orderedCandidates[1] || { x: 0, y: 0 },
        orderedCandidates[challenge.requiredMode === "WithWolf" ? 2 : 1],
      );
      if (result) return result;
    }
  }

  const fixedTrees = challenge.boardSetup.trees.map((tree) => ({ x: tree[0], y: tree[1] }));
  const fixedTreeKeys = new Set(fixedTrees.map((tree) => posKey(tree)));
  const fixedPool = positions.filter((pos) => !fixedTreeKeys.has(posKey(pos)));
  const fixedAttempts = 40;
  for (let attempt = 0; attempt < fixedAttempts; attempt += 1) {
    const pool = shuffle(fixedPool);
    const startRot = pool[0];
    const startWolf = challenge.requiredMode === "WithWolf" ? pool[1] : null;
    const house = pool[challenge.requiredMode === "WithWolf" ? 2 : 1];
    const result = tryBoard(
      fixedTrees.map((tree) => [tree.x, tree.y]),
      startRot,
      startWolf || { x: 0, y: 0 },
      house,
    );
    if (result) return result;
  }

  const randomAttempts = 120;
  for (let attempt = 0; attempt < randomAttempts; attempt += 1) {
    const pool = shuffle(positions);
    const trees = pool.slice(0, treeCount).map((pos) => [pos.x, pos.y]);
    const startRot = pool[treeCount];
    const startWolf = challenge.requiredMode === "WithWolf" ? pool[treeCount + 1] : null;
    const house = pool[treeCount + (challenge.requiredMode === "WithWolf" ? 2 : 1)];
    const result = tryBoard(trees, startRot, startWolf || { x: 0, y: 0 }, house);
    if (result) return result;
  }

  return null;
}

data.challenges = (data.challenges || []).map((challenge) => {
  if (solveChallenge(challenge).ok) {
    return challenge;
  }
  const boardSetup = findSolvableBoard(challenge);
  if (!boardSetup) {
    failures.push(challenge.id);
    return challenge;
  }
  boardUpdates.push({
    id: challenge.id,
    from: challenge.boardSetup,
    to: boardSetup,
  });
  return {
    ...challenge,
    boardSetup,
  };
});

fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(inlinePath, `window.__CHALLENGES__ = ${JSON.stringify(data, null, 2)};\n`, "utf8");

if (updates.length) {
  console.log("Updated challenges:");
  updates.forEach((update) => {
    const countChange = update.fromCount === update.toCount
      ? ""
      : ` (count ${update.fromCount} -> ${update.toCount})`;
    console.log(`- ${update.id}${countChange}: ${update.fromTiles.join(", ")} -> ${update.toTiles.join(", ")}`);
  });
} else {
  console.log("No changes needed.");
}

if (boardUpdates.length) {
  console.log("Updated board setups:");
  boardUpdates.forEach((update) => {
    const fromTrees = update.from.trees.map((t) => t.join(",")).join(" ");
    const toTrees = update.to.trees.map((t) => t.join(",")).join(" ");
    const fromStart = update.from.startRot.join(",");
    const toStart = update.to.startRot.join(",");
    const fromWolf = update.from.startWolf ? update.from.startWolf.join(",") : "-";
    const toWolf = update.to.startWolf ? update.to.startWolf.join(",") : "-";
    const fromHouse = update.from.house.position.join(",");
    const toHouse = update.to.house.position.join(",");
    console.log(`- ${update.id}:`);
    console.log(`  trees ${fromTrees} -> ${toTrees}`);
    console.log(`  startRot ${fromStart} -> ${toStart}`);
    console.log(`  startWolf ${fromWolf} -> ${toWolf}`);
    console.log(`  house ${fromHouse} -> ${toHouse}`);
  });
}

if (failures.length) {
  console.log("Unsolved challenges:");
  failures.forEach((id) => console.log(`- ${id}`));
}
