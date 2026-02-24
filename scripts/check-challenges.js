const fs = require("fs");
const path = require("path");
const LogicCore = require("./logic-core");
const SolverEngine = require("./solver-engine");

const dataPath = path.join(__dirname, "..", "data", "challenges.json");
const raw = fs.readFileSync(dataPath, "utf8");
const data = JSON.parse(raw);

const results = {
  ok: [],
  failed: [],
};

console.log("Starting challenge verification...");

data.challenges.forEach((challenge) => {
  const solution = SolverEngine.solve(challenge);
  if (solution) {
    results.ok.push(challenge.id);
  } else {
    results.failed.push(challenge.id);
  }
});

console.log(`\nVerification complete:`);
console.log(`- OK: ${results.ok.length}`);
console.log(`- FAILED: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log("\nFailed challenges:");
  results.failed.forEach((id) => console.log(`  - ${id}`));
} else {
  console.log("\nAll challenges passed! The solver is now working correctly.");
}
