import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import net from "net";

/* ── Simple JSON preferences store ── */

interface AppPreferences {
  autoUpdate: boolean;
  checkIntervalHours: number;
}

const DEFAULTS: AppPreferences = { autoUpdate: false, checkIntervalHours: 4 };

function getPrefsPath(): string {
  return path.join(app.getPath("userData"), "preferences.json");
}

function loadPrefs(): AppPreferences {
  try {
    const raw = fs.readFileSync(getPrefsPath(), "utf-8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function savePrefs(prefs: Partial<AppPreferences>): void {
  const current = loadPrefs();
  const merged = { ...current, ...prefs };
  fs.mkdirSync(path.dirname(getPrefsPath()), { recursive: true });
  fs.writeFileSync(getPrefsPath(), JSON.stringify(merged, null, 2));
}

/* ── App settings (API key, model, simulation options) persisted to userData ── */

interface AppSettings {
  apiKey?: string;
  model?: string;
  simulationMode?: string;
  enableCivMemory?: boolean;
  enableScenarioInjection?: boolean;
  webSearchOnAdvance?: boolean;
}

function getSettingsPath(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

function loadAppSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(getSettingsPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAppSettings(settings: Partial<AppSettings>): void {
  const current = loadAppSettings();
  const merged = { ...current, ...settings };
  fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
  fs.writeFileSync(getSettingsPath(), JSON.stringify(merged, null, 2));
}

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let serverPort = 3000;

const isProd = app.isPackaged;

function getResourcePath(...segments: string[]): string {
  if (isProd) {
    return path.join(process.resourcesPath, ...segments);
  }
  return path.join(app.getAppPath(), ...segments);
}

function findServerJs(dir: string): string | null {
  const direct = path.join(dir, "server.js");
  if (fs.existsSync(direct)) return direct;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const found = findServerJs(path.join(dir, entry.name));
      if (found) return found;
    }
  } catch { /* ignore */ }
  return null;
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Could not find free port"));
      }
    });
    server.on("error", reject);
  });
}

async function waitForServer(port: number, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(`http://localhost:${port}/`);
      return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

async function startNextServer(): Promise<number> {
  const port = await findFreePort();
  serverPort = port;

  const appDataDir = app.getPath("userData");
  const resourceDir = process.resourcesPath;

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(port),
    HOSTNAME: "localhost",
    APP_DATA_DIR: appDataDir,
    APP_RESOURCE_DIR: resourceDir,
    NODE_ENV: "production",
  };

  const standaloneDir = path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    ".next",
    "standalone"
  );
  const serverPath = findServerJs(standaloneDir);
  if (!serverPath) {
    throw new Error("Could not find server.js in standalone build");
  }

  serverProcess = spawn(process.execPath, [serverPath], {
    env,
    cwd: path.dirname(serverPath),
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (data: Buffer) => {
    console.log(`[next] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on("data", (data: Buffer) => {
    console.error(`[next:err] ${data.toString().trim()}`);
  });

  serverProcess.on("exit", (code) => {
    console.log(`Next.js server exited with code ${code}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });

  await waitForServer(port);
  return port;
}

/* ── Loading page (inline HTML) ── */

function getLoadingHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0f0e0c;
    color: #d4c5a0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    overflow: hidden;
  }
  .logo-container {
    width: 96px; height: 96px;
    margin-bottom: 32px;
    animation: pulse 2s ease-in-out infinite;
  }
  .logo-container svg {
    width: 100%; height: 100%;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.85; }
  }
  h1 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
    color: #f1f5f9;
  }
  .status {
    font-size: 14px;
    color: #6b6352;
    margin-bottom: 32px;
  }
  .spinner-track {
    width: 200px;
    height: 3px;
    background: #1e1b16;
    border-radius: 2px;
    overflow: hidden;
  }
  .spinner-bar {
    width: 40%;
    height: 100%;
    background: linear-gradient(90deg, #c9a44e, #e8c96a, #c9a44e);
    border-radius: 2px;
    animation: slide 1.4s ease-in-out infinite;
  }
  @keyframes slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }
  .version {
    position: fixed;
    bottom: 16px;
    font-size: 12px;
    color: #3d3929;
  }
</style>
</head>
<body>
  <div class="logo-container">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#1a1812" stroke="#c9a44e" stroke-width="4"/>
      <!-- Globe lines -->
      <ellipse cx="50" cy="50" rx="30" ry="44" fill="none" stroke="#c9a44e" stroke-width="1.5" opacity="0.5"/>
      <ellipse cx="50" cy="50" rx="44" ry="20" fill="none" stroke="#c9a44e" stroke-width="1.5" opacity="0.5"/>
      <line x1="50" y1="6" x2="50" y2="94" stroke="#c9a44e" stroke-width="1.5" opacity="0.5"/>
      <line x1="6" y1="50" x2="94" y2="50" stroke="#c9a44e" stroke-width="1.5" opacity="0.5"/>
      <!-- Compass star -->
      <polygon points="50,12 54,44 50,48 46,44" fill="#c9a44e"/>
      <polygon points="50,88 54,56 50,52 46,56" fill="#c9a44e"/>
      <polygon points="12,50 44,46 48,50 44,54" fill="#c9a44e"/>
      <polygon points="88,50 56,46 52,50 56,54" fill="#c9a44e"/>
      <!-- Diagonal arms -->
      <polygon points="23,23 46,46 44,48" fill="#c9a44e" opacity="0.7"/>
      <polygon points="77,23 54,46 56,48" fill="#c9a44e" opacity="0.7"/>
      <polygon points="23,77 46,54 44,52" fill="#c9a44e" opacity="0.7"/>
      <polygon points="77,77 54,54 56,52" fill="#c9a44e" opacity="0.7"/>
      <circle cx="50" cy="50" r="4" fill="#c9a44e"/>
    </svg>
  </div>
  <h1>Human History Simulator</h1>
  <p class="status">Initializing server…</p>
  <div class="spinner-track"><div class="spinner-bar"></div></div>
  <div class="version">v${app.getVersion()}</div>
</body>
</html>`;
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Human History Simulator",
    backgroundColor: "#0f0e0c",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.on("closed", () => {
    mainWindow = null;
  });

  return win;
}

/* ── Auto-updater ── */

function setupAutoUpdater(win: BrowserWindow) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.checkForUpdates().catch(() => { });

  const prefs = loadPrefs();
  const intervalMs = (prefs.checkIntervalHours || 4) * 3_600_000;
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => { });
  }, intervalMs);

  autoUpdater.on("update-available", (info) => {
    const p = loadPrefs();
    if (p.autoUpdate) {
      autoUpdater.downloadUpdate();
    }
    win.webContents.send("update-available", {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
      autoDownloading: p.autoUpdate,
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    win.webContents.send("update-progress", {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    win.webContents.send("update-downloaded", { version: info.version });
  });

  autoUpdater.on("error", (err) => {
    win.webContents.send("update-error", { message: err.message });
  });
}

/* ── IPC handlers ── */

function registerIpcHandlers() {
  ipcMain.handle("get-app-version", () => app.getVersion());
  ipcMain.handle("check-for-updates", () =>
    autoUpdater.checkForUpdates().catch(() => null)
  );
  ipcMain.handle("download-update", () => autoUpdater.downloadUpdate());
  ipcMain.handle("install-update", () => {
    autoUpdater.quitAndInstall(false, true);
  });
  ipcMain.handle("get-update-settings", () => ({
    autoUpdate: loadPrefs().autoUpdate,
  }));
  ipcMain.handle("set-update-settings", (_event, settings: { autoUpdate?: boolean }) => {
    if (settings.autoUpdate !== undefined) {
      savePrefs({ autoUpdate: settings.autoUpdate });
    }
  });

  ipcMain.handle("get-app-settings", () => loadAppSettings());
  ipcMain.handle("set-app-settings", (_event, settings: Record<string, unknown>) => {
    saveAppSettings(settings as Partial<AppSettings>);
  });
}

/* ── App lifecycle ── */

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("ready", async () => {
    registerIpcHandlers();

    mainWindow = createWindow();
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getLoadingHTML())}`);

    try {
      let port: number;
      if (isProd) {
        port = await startNextServer();
        setupAutoUpdater(mainWindow);
      } else {
        await waitForServer(3000, 60_000);
        port = 3000;
        serverPort = 3000;
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(`http://localhost:${port}`);
      }
    } catch (err) {
      dialog.showErrorBox(
        "Startup Error",
        `Failed to start the application server.\n\n${err}`
      );
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
    app.quit();
  });

  app.on("before-quit", () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });
}
