const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "..", "data", "challenges.json");
const pyPath = path.join(__dirname, "..", "..", "aleksi", "states", "rotcap_challenges.py");

const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const pySource = fs.readFileSync(pyPath, "utf8");

const colorMap = {
  blue: "Blue",
  pink: "Pink",
  white: "White",
  purple: "Purple",
  yellow: "Yellow",
};
const allColors = ["blue", "pink", "white", "purple", "yellow"];

function extractChallengeBlocks(source) {
  const blocks = [];
  let index = 0;
  while (index < source.length) {
    const start = source.indexOf("engine.Challenge(", index);
    if (start === -1) break;
    let depth = 0;
    let started = false;
    let end = start;
    let inString = false;
    for (let i = start; i < source.length; i += 1) {
      const char = source[i];
      if (char === '"' && source[i - 1] !== "\\") {
        inString = !inString;
      }
      if (!inString) {
        if (char === "(") {
          depth += 1;
          started = true;
        }
        if (char === ")") depth -= 1;
        if (started && depth === 0) {
          end = i;
          break;
        }
      }
    }
    blocks.push(source.slice(start, end + 1));
    index = end + 1;
  }
  return blocks;
}

function parseTupleList(text) {
  const coords = [];
  const regex = /\((\d+)\s*,\s*(\d+)\)/g;
  let match = null;
  while ((match = regex.exec(text))) {
    coords.push([Number(match[1]), Number(match[2])]);
  }
  return coords;
}

function parseTiles(text) {
  const match = text.match(/_tiles\(([^)]*)\)/);
  if (!match) return [];
  const raw = match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/"/g, ""));
  const colors = raw.length === 1 && raw[0] === "all" ? allColors : raw;
  return colors.map((color) => colorMap[color]);
}

function toOneBased(coord) {
  if (!coord) return null;
  return [coord[0] + 1, coord[1] + 1];
}

function parseCoordValue(block, key) {
  const match = block.match(new RegExp(`${key}=\\(([^)]+)\\)`));
  if (!match) return null;
  const parts = match[1].split(",").map((item) => Number(item.trim()));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return [parts[0], parts[1]];
}

function parseChallenge(block) {
  const getString = (key) => {
    const match = block.match(new RegExp(`${key}="([^"]+)"`));
    return match ? match[1] : null;
  };

  let trees = [];
  const treesStart = block.indexOf("trees=");
  const startRotIndex = block.indexOf("start_rot");
  if (treesStart !== -1 && startRotIndex !== -1 && startRotIndex > treesStart) {
    const treesSection = block.slice(treesStart, startRotIndex);
    trees = parseTupleList(treesSection);
  }

  const mode = getString("mode");
  const chimney = getString("chimney") || "N";
  const startRot = parseCoordValue(block, "start_rot");
  const startWolf = parseCoordValue(block, "start_wolf");
  const house = parseCoordValue(block, "house");
  const tiles = parseTiles(block);

  return {
    mode,
    trees,
    startRot,
    startWolf,
    house,
    chimney,
    tiles,
  };
}

const blocks = extractChallengeBlocks(pySource);
const expected = blocks.map(parseChallenge);
const actual = jsonData.challenges || [];

const mismatches = [];
if (expected.length !== actual.length) {
  mismatches.push(`Challenge count differs: python=${expected.length} json=${actual.length}`);
}

expected.forEach((py, index) => {
  const js = actual[index];
  if (!js) {
    mismatches.push(`Missing JSON challenge at index ${index}`);
    return;
  }
  const jsSetup = js.boardSetup || {};
  const jsTrees = (jsSetup.trees || []).map((t) => t);
  const expectedTrees = py.trees.map((t) => toOneBased(t));
  jsTrees.sort();
  expectedTrees.sort();

  const errors = [];
  if (!py.startRot || !py.house) {
    errors.push("python parse failure (missing start_rot/house)");
  }
  const expectedMode = py.mode === "dual" ? "WithWolf" : "WithoutWolf";
  if (js.requiredMode !== expectedMode) {
    errors.push(`mode ${js.requiredMode} != ${expectedMode}`);
  }
  if (JSON.stringify(jsTrees) !== JSON.stringify(expectedTrees)) {
    errors.push(`trees ${JSON.stringify(jsTrees)} != ${JSON.stringify(expectedTrees)}`);
  }
  if (JSON.stringify(jsSetup.startRot) !== JSON.stringify(toOneBased(py.startRot))) {
    errors.push(`startRot ${JSON.stringify(jsSetup.startRot)} != ${JSON.stringify(toOneBased(py.startRot))}`);
  }
  const expectedWolf = py.startWolf ? toOneBased(py.startWolf) : null;
  if (JSON.stringify(jsSetup.startWolf || null) !== JSON.stringify(expectedWolf)) {
    errors.push(`startWolf ${JSON.stringify(jsSetup.startWolf || null)} != ${JSON.stringify(expectedWolf)}`);
  }
  const expectedHouse = toOneBased(py.house);
  if (JSON.stringify(jsSetup.house?.position) !== JSON.stringify(expectedHouse)) {
    errors.push(`house.position ${JSON.stringify(jsSetup.house?.position)} != ${JSON.stringify(expectedHouse)}`);
  }
  if (jsSetup.house?.chimney !== py.chimney) {
    errors.push(`house.chimney ${jsSetup.house?.chimney} != ${py.chimney}`);
  }
  if (JSON.stringify(js.availableTiles) !== JSON.stringify(py.tiles)) {
    errors.push(`availableTiles ${JSON.stringify(js.availableTiles)} != ${JSON.stringify(py.tiles)}`);
  }
  if (js.requiredTileCount !== py.tiles.length) {
    errors.push(`requiredTileCount ${js.requiredTileCount} != ${py.tiles.length}`);
  }

  if (errors.length) {
    mismatches.push(`${js.id} (index ${index}): ${errors.join("; ")}`);
  }
});

if (mismatches.length) {
  console.log("Mismatch gefunden:");
  mismatches.forEach((item) => console.log(`- ${item}`));
} else {
  console.log("Alle JSON-Challenges stimmen mit den Python-Challenges ueberein.");
}
