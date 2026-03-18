/**
 * electron-builder afterPack hook.
 * 1. Prune duplicated directories from standalone (src/, data/, scripts/, etc.)
 * 2. Copy .next/static and public/ (sans geojson) into standalone project root
 * 3. Rebuild better-sqlite3 from source tree, then copy the .node into standalone
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

module.exports = async function afterPack(context) {
  const appDir = context.packager.getResourcesDir(context.appOutDir);
  const platform = context.electronPlatformName;
  const arch =
    context.arch === 1 ? "x64" : context.arch === 3 ? "arm64" : "x64";

  const unpackedBase = path.join(appDir, "app.asar.unpacked");
  const standaloneDir = path.join(unpackedBase, ".next", "standalone");
  if (!fs.existsSync(standaloneDir)) {
    console.log("  afterPack: no standalone dir found, skipping");
    return;
  }

  function findProjectRoot(dir) {
    const serverJs = path.join(dir, "server.js");
    if (fs.existsSync(serverJs)) return dir;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const found = findProjectRoot(path.join(dir, entry.name));
        if (found) return found;
      }
    } catch {}
    return null;
  }

  const projRoot = findProjectRoot(standaloneDir);
  if (!projRoot) {
    console.log("  afterPack: could not find project root in standalone");
    return;
  }

  function dirSizeBytes(dir) {
    let total = 0;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          total += dirSizeBytes(full);
        } else {
          try {
            total += fs.statSync(full).size;
          } catch {}
        }
      }
    } catch {}
    return total;
  }

  // ── 1. Prune directories not needed at runtime ──
  const dirsToRemove = ["src", "data", "scripts", "build", "docs", "electron"];
  let savedBytes = 0;
  for (const d of dirsToRemove) {
    const target = path.join(projRoot, d);
    if (fs.existsSync(target)) {
      const size = dirSizeBytes(target);
      savedBytes += size;
      fs.rmSync(target, { recursive: true, force: true });
      console.log(
        `  afterPack: removed standalone/${d}/ (${(size / 1048576).toFixed(0)}MB)`,
      );
    }
  }

  const standalonePublic = path.join(projRoot, "public");
  if (fs.existsSync(standalonePublic)) {
    const size = dirSizeBytes(standalonePublic);
    savedBytes += size;
    fs.rmSync(standalonePublic, { recursive: true, force: true });
    console.log(
      `  afterPack: removed standalone/public/ (${(size / 1048576).toFixed(0)}MB)`,
    );
  }

  if (savedBytes > 0) {
    console.log(
      `  afterPack: total pruned from standalone: ${(savedBytes / 1048576).toFixed(0)}MB`,
    );
  }

  // ── 2. Copy .next/static into standalone project root ──
  const staticSrc = path.join(unpackedBase, ".next", "static");
  const staticDest = path.join(projRoot, ".next", "static");
  if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
    fs.cpSync(staticSrc, staticDest, { recursive: true });
    console.log(`  afterPack: copied .next/static into standalone`);
  }

  // ── 3. Copy small public/ files (skip geojson snapshots) ──
  const publicSrc = path.join(appDir, "public");
  const publicDest = path.join(projRoot, "public");
  if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
    fs.mkdirSync(publicDest, { recursive: true });
    for (const entry of fs.readdirSync(publicSrc, { withFileTypes: true })) {
      if (entry.name === "geojson") continue;
      const src = path.join(publicSrc, entry.name);
      const dest = path.join(publicDest, entry.name);
      fs.cpSync(src, dest, { recursive: true });
    }
    // Copy territories.json (needed by frontend map) but not snapshot files
    const geoSrc = path.join(publicSrc, "geojson");
    if (fs.existsSync(geoSrc)) {
      const geoDest = path.join(publicDest, "geojson");
      fs.mkdirSync(geoDest, { recursive: true });
      const terrFile = path.join(geoSrc, "territories.json");
      if (fs.existsSync(terrFile)) {
        fs.copyFileSync(terrFile, path.join(geoDest, "territories.json"));
      }
    }
    console.log(
      `  afterPack: copied public/ (with territories.json, sans snapshots) into standalone`,
    );
  }

  // ── 4. Rebuild better-sqlite3 for Electron, then copy .node into standalone ──
  const electronVersion =
    context.packager.config.electronVersion ||
    require(
      path.join(process.cwd(), "node_modules", "electron", "package.json"),
    ).version;

  // Rebuild from the source tree (has binding.gyp)
  const srcSqliteDir = path.join(
    process.cwd(),
    "node_modules",
    "better-sqlite3",
  );
  if (!fs.existsSync(srcSqliteDir)) {
    console.log(
      "  afterPack: better-sqlite3 not found in project node_modules, skipping",
    );
    return;
  }

  console.log(
    `  afterPack: rebuilding better-sqlite3 for electron@${electronVersion} ${platform}-${arch}`,
  );

  try {
    execSync(
      `npx @electron/rebuild --module-dir "${srcSqliteDir}" --electron-version ${electronVersion} --arch ${arch} --only better-sqlite3 --force`,
      { stdio: "inherit", cwd: process.cwd() },
    );
    console.log("  afterPack: source rebuild complete ✓");
  } catch (err) {
    console.error("  afterPack: source rebuild failed ✗", err.message);
    throw err;
  }

  // Find the rebuilt .node in source tree
  const srcNode = path.join(
    srcSqliteDir,
    "build",
    "Release",
    "better_sqlite3.node",
  );
  if (!fs.existsSync(srcNode)) {
    console.error("  afterPack: rebuilt .node not found at", srcNode);
    return;
  }

  // Find the .node destination in standalone
  // Next.js standalone may use hashed directory names like better-sqlite3-<hash>
  function findBetterSqliteDirs(dir, depth = 0) {
    if (depth > 10) return [];
    const results = [];
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const full = path.join(dir, entry.name);
        if (entry.name.startsWith("better-sqlite3")) {
          results.push(full);
        }
        if (entry.name === "node_modules" || entry.name === ".next") {
          results.push(...findBetterSqliteDirs(full, depth + 1));
        }
      }
    } catch {}
    return results;
  }

  function findNodeFile(dir) {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isFile() && entry.name === "better_sqlite3.node") return full;
        if (entry.isDirectory()) {
          const found = findNodeFile(full);
          if (found) return found;
        }
      }
    } catch {}
    return null;
  }

  // Strategy 1: find existing .node file in standalone and replace it
  const destNode = findNodeFile(standaloneDir);
  if (destNode) {
    fs.copyFileSync(srcNode, destNode);
    console.log(`  afterPack: copied rebuilt .node to standalone ✓`);
  } else {
    // Strategy 2: find better-sqlite3* dirs in standalone and place .node inside
    const sqliteDirs = findBetterSqliteDirs(standaloneDir);
    let placed = false;
    for (const d of sqliteDirs) {
      const buildRelease = path.join(d, "build", "Release");
      fs.mkdirSync(buildRelease, { recursive: true });
      fs.copyFileSync(srcNode, path.join(buildRelease, "better_sqlite3.node"));
      console.log(`  afterPack: placed rebuilt .node into ${path.relative(standaloneDir, d)} ✓`);
      placed = true;
    }
    if (!placed) {
      // Strategy 3: place into standard node_modules path
      const fallbackDir = path.join(projRoot, "node_modules", "better-sqlite3", "build", "Release");
      fs.mkdirSync(fallbackDir, { recursive: true });
      fs.copyFileSync(srcNode, path.join(fallbackDir, "better_sqlite3.node"));
      console.log(`  afterPack: placed rebuilt .node into fallback path ✓`);
    }
  }
};
