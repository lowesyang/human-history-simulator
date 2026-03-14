import path from "path";

function getAppDataDir(): string {
  return process.env.APP_DATA_DIR || process.cwd();
}

function getResourceDir(): string {
  return process.env.APP_RESOURCE_DIR || process.cwd();
}

export function getDbPath(): string {
  return path.join(getAppDataDir(), "data", "history.db");
}

/** Read-only built-in seed directory (packaged with app). */
export function getSeedDir(): string {
  return path.join(getResourceDir(), "src", "data", "seed");
}

/** Writable seed directory for user-generated eras. */
export function getUserSeedDir(): string {
  return path.join(getAppDataDir(), "seed");
}

export function getPublicDir(): string {
  return path.join(getResourceDir(), "public");
}

/**
 * Resolve a seed file by eraId. Checks user seed dir first,
 * then falls back to built-in seed dir.
 */
export function resolveSeedPath(eraId: string): string | null {
  const fs = require("fs");
  const userPath = path.join(getUserSeedDir(), `era-${eraId}.json`);
  if (fs.existsSync(userPath)) return userPath;
  const builtinPath = path.join(getSeedDir(), `era-${eraId}.json`);
  if (fs.existsSync(builtinPath)) return builtinPath;
  return null;
}
