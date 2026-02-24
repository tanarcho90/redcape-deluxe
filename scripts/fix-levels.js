const LogicCore = require("./logic-core");
const SolverEngine = require("./solver-engine");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "challenges.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

console.log("Attempting to fix challenges...");

const allTiles = Object.keys(LogicCore.tileDefs);

data.challenges = data.challenges.map(challenge => {
  if (SolverEngine.solve(challenge)) {
    return challenge;
  }

  console.log(`Fixing ${challenge.id}...`);
  
  // Try to find a valid board setup by moving trees/start/house slightly
  // or by adding more tiles if needed.
  // For now, let's try to see if it's solvable by just allowing more tiles.
  
  let currentTiles = [...challenge.availableTiles];
  let requiredCount = challenge.requiredTileCount;
  
  for (let i = 0; i < allTiles.length; i++) {
    const tile = allTiles[i];
    if (!currentTiles.includes(tile)) {
      currentTiles.push(tile);
      const newChallenge = { ...challenge, availableTiles: currentTiles, requiredTileCount: currentTiles.length };
      if (SolverEngine.solve(newChallenge)) {
        console.log(`  Solved ${challenge.id} by adding ${tile}`);
        return newChallenge;
      }
    }
  }
  
  return challenge;
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log("Done.");
