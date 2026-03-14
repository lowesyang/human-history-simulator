import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => ipcRenderer.invoke("get-app-version"),

  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  getUpdateSettings: () => ipcRenderer.invoke("get-update-settings"),
  setUpdateSettings: (settings: { autoUpdate?: boolean }) =>
    ipcRenderer.invoke("set-update-settings", settings),

  getAppSettings: () => ipcRenderer.invoke("get-app-settings"),
  setAppSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke("set-app-settings", settings),

  onUpdateAvailable: (callback: (data: { version: string; releaseNotes?: string; releaseDate?: string; autoDownloading: boolean }) => void) => {
    ipcRenderer.on("update-available", (_event, data) => callback(data));
  },
  onUpdateProgress: (callback: (data: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
    ipcRenderer.on("update-progress", (_event, data) => callback(data));
  },
  onUpdateDownloaded: (callback: (data: { version: string }) => void) => {
    ipcRenderer.on("update-downloaded", (_event, data) => callback(data));
  },
  onUpdateError: (callback: (data: { message: string }) => void) => {
    ipcRenderer.on("update-error", (_event, data) => callback(data));
  },
});
