const LogicCore = require("./logic-core");
const SolverEngine = require("./solver-engine");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "challenges.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const allTiles = Object.keys(LogicCore.tileDefs);

function combinations(array, size) {
  const result = [];
  const choose = (start, combo) => {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      choose(i + 1, combo);
      combo.pop();
    }
  };
  choose(0, []);
  return result;
}

console.log("Fixing challenges...");

data.challenges = data.challenges.map(challenge => {
  console.log(`Checking ${challenge.id}...`);
  
  // Try current setup
  if (SolverEngine.solve(challenge)) {
    console.log(`  Already OK.`);
    return challenge;
  }

  // Try different counts of tiles
  for (let count = 1; count <= 5; count++) {
    const combos = combinations(allTiles, count);
    for (const combo of combos) {
      const candidate = { ...challenge, availableTiles: combo, requiredTileCount: count };
      if (SolverEngine.solve(candidate)) {
        console.log(`  Fixed ${challenge.id}: ${combo.join(",")} (count ${count})`);
        return candidate;
      }
    }
  }

  console.log(`  FAILED to fix ${challenge.id}`);
  return challenge;
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log("Done.");
