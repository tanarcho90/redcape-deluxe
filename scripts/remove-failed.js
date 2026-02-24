const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "challenges.json");
const inlinePath = path.join(__dirname, "..", "data", "challenges.inline.js");

const raw = fs.readFileSync(dataPath, "utf8");
const data = JSON.parse(raw);

const failedIds = [
  "Expert 18",
  "Master 22",
  "Junior 8 (Wolf)",
  "Expert 13 (Wolf)",
  "Expert 16 (Wolf)"
];

const initialCount = data.challenges.length;
data.challenges = data.challenges.filter(c => !failedIds.includes(c.id));
const finalCount = data.challenges.length;

console.log(`Removed ${initialCount - finalCount} challenges.`);

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
fs.writeFileSync(inlinePath, `window.__CHALLENGES__ = ${JSON.stringify(data, null, 2)};\n`, "utf8");

console.log("Updated challenges.json and challenges.inline.js.");
