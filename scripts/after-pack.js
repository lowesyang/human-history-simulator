/**
 * electron-builder afterPack hook.
 * 1. Prune duplicated directories from standalone (public/, src/, data/, scripts/, etc.)
 *    since they are already in extraResources or not needed at runtime.
 * 2. Rebuild better-sqlite3 inside .next/standalone for the target Electron ABI.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

module.exports = async function afterPack(context) {
  const appDir = context.packager.getResourcesDir(context.appOutDir);
  const platform = context.electronPlatformName;
  const arch = context.arch === 1 ? "x64" : context.arch === 3 ? "arm64" : "x64";

  const unpackedBase = path.join(appDir, "app.asar.unpacked");
  const standaloneDir = path.join(unpackedBase, ".next", "standalone");
  if (!fs.existsSync(standaloneDir)) {
    console.log("  afterPack: no standalone dir found, skipping");
    return;
  }

  // Find the project root inside standalone (Next.js copies full cwd path)
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

  // 1. Remove directories duplicated by extraResources or not needed at runtime
  const dirsToRemove = ["public", "src", "data", "scripts", "build", "docs", "electron"];
  let savedBytes = 0;
  for (const d of dirsToRemove) {
    const target = path.join(projRoot, d);
    if (fs.existsSync(target)) {
      const stat = execSync(`du -sk "${target}"`).toString().trim().split("\t")[0];
      savedBytes += parseInt(stat) * 1024;
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`  afterPack: removed standalone/${d}/ (${(parseInt(stat) / 1024).toFixed(0)}MB)`);
    }
  }
  if (savedBytes > 0) {
    console.log(`  afterPack: total pruned from standalone: ${(savedBytes / 1048576).toFixed(0)}MB`);
  }

  // 2. Rebuild better-sqlite3 for Electron
  function findModuleDir(dir, name) {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const full = path.join(dir, entry.name);
        if (entry.name === name && full.includes("node_modules")) return full;
        const found = findModuleDir(full, name);
        if (found) return found;
      }
    } catch {}
    return null;
  }

  const sqliteDir = findModuleDir(projRoot, "better-sqlite3");
  if (!sqliteDir) {
    console.log("  afterPack: better-sqlite3 not found in standalone, skipping rebuild");
    return;
  }

  const electronVersion = context.packager.config.electronVersion ||
    require(path.join(process.cwd(), "node_modules", "electron", "package.json")).version;

  console.log(`  afterPack: rebuilding better-sqlite3 for electron@${electronVersion} ${platform}-${arch}`);

  try {
    execSync(
      `npx @electron/rebuild --module-dir "${sqliteDir}" --electron-version ${electronVersion} --arch ${arch} --only better-sqlite3`,
      { stdio: "inherit", cwd: process.cwd() }
    );
    console.log("  afterPack: rebuild complete ✓");
  } catch (err) {
    console.error("  afterPack: rebuild failed ✗", err.message);
    throw err;
  }
};
