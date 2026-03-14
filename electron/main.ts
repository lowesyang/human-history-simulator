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

async function waitForServer(port: number, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${port}/api/state`);
      if (res.ok || res.status === 404) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

async function startNextServer(): Promise<number> {
  const port = await findFreePort();
  serverPort = port;

  const appDataDir = app.getPath("userData");
  const resourceDir = isProd ? process.resourcesPath : app.getAppPath();

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    PORT: String(port),
    HOSTNAME: "localhost",
    APP_DATA_DIR: appDataDir,
    APP_RESOURCE_DIR: resourceDir,
    NODE_ENV: "production",
  };

  if (isProd) {
    const serverPath = path.join(
      process.resourcesPath,
      ".next",
      "standalone",
      "server.js"
    );
    serverProcess = spawn(process.execPath, [serverPath], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } else {
    serverProcess = spawn("npx", ["next", "start", "-p", String(port)], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      cwd: app.getAppPath(),
    });
  }

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

function createWindow(port: number): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Human History Simulator",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://localhost:${port}`);

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

    try {
      const port = await startNextServer();
      mainWindow = createWindow(port);
      setupAutoUpdater(mainWindow);
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
