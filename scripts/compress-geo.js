#!/usr/bin/env node
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const d = path.join("public", "geojson", "snapshots");
if (!fs.existsSync(d)) {
  console.log("No geojson snapshots directory found, skipping compression");
  process.exit(0);
}

const files = fs.readdirSync(d).filter((f) => f.endsWith(".json"));
for (const f of files) {
  const input = path.join(d, f);
  const output = input + ".gz";
  fs.writeFileSync(output, zlib.gzipSync(fs.readFileSync(input), { level: 9 }));
}
console.log(`Compressed ${files.length} GeoJSON snapshots`);
