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
      console.log(
        `  afterPack: placed rebuilt .node into ${path.relative(standaloneDir, d)} ✓`,
      );
      placed = true;
    }
    if (!placed) {
      // Strategy 3: place into standard node_modules path
      const fallbackDir = path.join(
        projRoot,
        "node_modules",
        "better-sqlite3",
        "build",
        "Release",
      );
      fs.mkdirSync(fallbackDir, { recursive: true });
      fs.copyFileSync(srcNode, path.join(fallbackDir, "better_sqlite3.node"));
      console.log(`  afterPack: placed rebuilt .node into fallback path ✓`);
    }
  }

  // ── 5. Fix broken better-sqlite3 hashed refs in unpacked asar ──
  // Next.js standalone creates hashed symlinks like better-sqlite3-<hash> in
  // .next/node_modules/. These become broken refs in the unpacked asar on
  // Windows, causing 7zip to fail. We directly check the known problematic
  // locations and create valid directories with the rebuilt .node file.
  const nextNodeModules = path.join(standaloneDir, ".next", "node_modules");
  try {
    if (fs.existsSync(nextNodeModules)) {
      const entries = fs.readdirSync(nextNodeModules);
      for (const name of entries) {
        if (name.startsWith("better-sqlite3")) {
          const full = path.join(nextNodeModules, name);
          const hasNode = findNodeFile(full);
          if (!hasNode) {
            const br = path.join(full, "build", "Release");
            fs.mkdirSync(br, { recursive: true });
            fs.copyFileSync(srcNode, path.join(br, "better_sqlite3.node"));
            console.log(`  afterPack: fixed .next/node_modules/${name} ✓`);
          }
        }
      }
    }
  } catch (e) {
    console.log(`  afterPack: .next/node_modules scan: ${e.message}`);
  }

  // Also check the same location in the unpacked asar root (outside standalone)
  const unpackedNextNM = path.join(
    unpackedBase,
    ".next",
    "standalone",
    ".next",
    "node_modules",
  );
  try {
    if (fs.existsSync(unpackedNextNM)) {
      const entries = fs.readdirSync(unpackedNextNM);
      for (const name of entries) {
        if (name.startsWith("better-sqlite3")) {
          const full = path.join(unpackedNextNM, name);
          const hasNode = findNodeFile(full);
          if (!hasNode) {
            const br = path.join(full, "build", "Release");
            fs.mkdirSync(br, { recursive: true });
            fs.copyFileSync(srcNode, path.join(br, "better_sqlite3.node"));
            console.log(`  afterPack: fixed unpacked .next/node_modules/${name} ✓`);
          }
        }
      }
    }
  } catch (e) {
    console.log(`  afterPack: unpacked .next/node_modules scan: ${e.message}`);
  }

  // Last resort: if the hashed dir doesn't appear in readdirSync (broken
  // symlink on Windows), directly check the appOutDir for any 7zip-problematic
  // paths by scanning the win-unpacked/resources tree.
  const appOutResources = path.join(context.appOutDir, "resources");
  function ensureSqliteInTree(dir, depth) {
    if (depth > 10) return;
    try {
      const entries = fs.readdirSync(dir);
      for (const name of entries) {
        const full = path.join(dir, name);
        if (name.startsWith("better-sqlite3")) {
          let stat;
          try {
            stat = fs.lstatSync(full);
          } catch {
            continue;
          }
          if (stat.isSymbolicLink()) {
            try { fs.unlinkSync(full); } catch {}
            fs.mkdirSync(path.join(full, "build", "Release"), {
              recursive: true,
            });
            fs.copyFileSync(
              srcNode,
              path.join(full, "build", "Release", "better_sqlite3.node"),
            );
            console.log(
              `  afterPack: replaced symlink ${path.relative(context.appOutDir, full)} ✓`,
            );
          } else if (stat.isDirectory()) {
            const hasNode = findNodeFile(full);
            if (!hasNode) {
              const br = path.join(full, "build", "Release");
              fs.mkdirSync(br, { recursive: true });
              fs.copyFileSync(
                srcNode,
                path.join(br, "better_sqlite3.node"),
              );
              console.log(
                `  afterPack: fixed ${path.relative(context.appOutDir, full)} ✓`,
              );
            }
          }
        } else {
          let stat;
          try {
            stat = fs.lstatSync(full);
          } catch {
            continue;
          }
          if (
            stat.isDirectory() &&
            (name === "node_modules" ||
              name === ".next" ||
              name === "standalone" ||
              name === "resources" ||
              name === "app.asar.unpacked")
          ) {
            ensureSqliteInTree(full, depth + 1);
          }
        }
      }
    } catch {}
  }

  ensureSqliteInTree(appOutResources, 0);
};
