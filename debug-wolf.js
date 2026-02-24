const LogicCore = require("./scripts/logic-core");
const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data/challenges.json"), "utf8"));
const challenge = data.challenges.find(c => c.id === "Starter 1 (Wolf)");

const tileId1 = "White";
const tileId2 = "Pink";

// Let's try to find ANY placement of these 2 tiles that connects both
const findAny = () => {
  const options1 = getPlacements(tileId1);
  const options2 = getPlacements(tileId2);

  for (const p1 of options1) {
    for (const p2 of options2) {
      if ((p1.mask & p2.mask) !== 0) continue;
      
      const placements = new Map();
      placements.set(tileId1, p1);
      placements.set(tileId2, p2);
      
      const result = validateNoLength(challenge, placements);
      if (result.ok) {
        console.log(`Found connection! WolfLen: ${result.wolfLen}, RotLen: ${result.rotLen}`);
        console.log(`P1: ${p1.anchorX},${p1.anchorY} R${p1.rotation}`);
        console.log(`P2: ${p2.anchorX},${p2.anchorY} R${p2.rotation}`);
      }
    }
  }
};

function getPlacements(tileId) {
  const placements = [];
  [0, 90, 180, 270].forEach(rotation => {
    const shape = LogicCore.getTransformedTile(tileId, rotation);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        let mask = 0;
        let valid = true;
        for (const cell of shape.cells) {
          const cx = x + cell.x;
          const cy = y + cell.y;
          if (cx < 0 || cx >= 4 || cy < 0 || cy >= 4) { valid = false; break; }
          mask |= 1 << (cy * 4 + cx);
        }
        if (valid) placements.push({ tileId, rotation, anchorX: x, anchorY: y, mask });
      }
    }
  });
  return placements;
}

function validateNoLength(challenge, placements) {
  const graph = new Map();
  const edgeNodes = new Set();
  const addEdge = (a, b) => {
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a).add(b);
    graph.get(b).add(a);
  };

  for (const [tileId, p] of placements) {
    const shape = LogicCore.getTransformedTile(tileId, p.rotation);
    shape.endpoints.forEach(ep => {
      const nodeId = LogicCore.edgeNodeFromPoint(p.anchorX + ep.point.x, p.anchorY + ep.point.y);
      if (nodeId) edgeNodes.add(nodeId);
    });
    const nodes = shape.endpoints.map(ep => LogicCore.edgeNodeFromPoint(p.anchorX + ep.point.x, p.anchorY + ep.point.y));
    addEdge(nodes[0], nodes[1]);
  }

  const startRotNode = "start:rot";
  const startWolfNode = "start:wolf";
  const doorNodes = LogicCore.getDoorNodes(challenge.boardSetup.house);

  const connect = (coord, nodeId) => {
    if (!coord) return;
    ["N", "E", "S", "W"].forEach(dir => {
      const edge = LogicCore.edgeNodeId(coord[0] - 1, coord[1] - 1, dir);
      if (edgeNodes.has(edge)) addEdge(nodeId, edge);
    });
  };

  connect(challenge.boardSetup.startRot, startRotNode);
  connect(challenge.boardSetup.startWolf, startWolfNode);
  doorNodes.forEach((node, i) => { if (edgeNodes.has(node)) addEdge(`door:${i}`, node); });

  const degrees = new Map();
  edgeNodes.forEach(node => degrees.set(node, (graph.get(node) || []).size));
  if ([...degrees.values()].some(d => d !== 2)) return { ok: false };

  const components = LogicCore.buildComponents(graph);
  const rotComp = components.nodeToComponent.get(startRotNode);
  const wolfComp = components.nodeToComponent.get(startWolfNode);
  if (rotComp === undefined || wolfComp === undefined || rotComp === wolfComp) return { ok: false };

  const reachedDoors = doorNodes.map((_, i) => components.nodeToComponent.get(`door:${i}`));
  if (!reachedDoors.some(c => c === rotComp) || !reachedDoors.some(c => c === wolfComp)) return { ok: false };

  const rotLen = LogicCore.shortestPathToAny(graph, startRotNode, doorNodes.map((_,i) => `door:${i}`));
  const wolfLen = LogicCore.shortestPathToAny(graph, startWolfNode, doorNodes.map((_,i) => `door:${i}`));

  return { ok: true, rotLen, wolfLen };
}

findAny();
