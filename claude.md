# Project Conventions

## Styling Rules

- **Minimum font size: 12px** — All text in the application must use a font size of at least 12px. Do not use `text-[9px]`, `text-[10px]`, `text-[11px]` or any font-size value below 12px. Use `text-xs` (0.75rem = 12px) as the smallest allowed size class.

## Map / Territory Accuracy Rules

### Data Source

- Historical country boundaries use GeoJSON data from **aourednik/historical-basemaps** (53 snapshots, BC 2000 – AD 2010).
- Raw GeoJSON is downloaded, simplified (`@turf/simplify`, tolerance 0.02), matched to internal region IDs, and stored as per-year JSON files in `public/geojson/snapshots/{year}.json`.
- The build pipeline lives in `scripts/build-geo-snapshots.ts`; run with `npm run build:geo`.

### Region Name Mapping (`scripts/name-mapping.ts`)

- Every `region.id` used in any era seed file (`src/data/seed/era-*.json`) **must** have a corresponding entry in `REGION_NAME_MAP`.
- Each entry is an array of candidate basemap NAME strings tried in order; place the most historically accurate name first, with broader fallbacks after.
- When adding a new region to a seed file, always add its mapping at the same time.
- Avoid duplicate keys — later entries silently overwrite earlier ones.

### Carry-Forward Logic

- The build script processes snapshot years in chronological order. If a region has geometry in an earlier snapshot but no match in a later one, the earlier geometry is **carried forward** automatically.
- This means a mapping only needs to match in **at least one** snapshot year ≤ the target era to provide coverage.

### Runtime Geometry Merge

- At era init (`init-era/route.ts`) and each advance step (`advance/route.ts`), the server calls `mergeSnapshotGeometry(regions, snapshotYear)` to attach real GeoJSON boundaries to `Region` objects.
- `geo-transform.ts` prioritizes `region.geometry` (real boundary) over the legacy `territoryId` / `territoryScale` template system.
- The closest snapshot year is chosen via `findClosestSnapshotYear(simYear)` using a nearest-distance algorithm.

### Coverage Targets

- **All eras should target 100% geometry coverage.** If a newly added region has no match, update `name-mapping.ts` and rebuild snapshots before merging.
- After rebuilding, verify with:
  ```bash
  python3 -c "
  import json, glob, os
  snap_years = [...]  # copy from name-mapping.ts SNAPSHOT_YEARS
  for f in sorted(glob.glob('src/data/seed/era-*.json')):
      era = json.load(open(f)); regions = era['regions']; year = era['timestamp']['year']
      closest = min(snap_years, key=lambda y: abs(y - year))
      snap = json.load(open(f'public/geojson/snapshots/{closest}.json'))
      missing = [r['id'] for r in regions if r['id'] not in snap]
      name = os.path.basename(f).replace('era-','').replace('.json','')
      print(f'{name}: {len(regions)-len(missing)}/{len(regions)}', '✗' if missing else '✓')
  "
  ```

## Desktop Client Packaging (Electron)

### Architecture Overview

The app is packaged as an Electron desktop client. Electron's main process spawns a **Next.js standalone server** (`output: "standalone"` in `next.config.ts`) as a child process using `ELECTRON_RUN_AS_NODE=1`, then loads its URL in a `BrowserWindow`. This retains full Next.js features (API routes, SSR, middleware) inside the desktop shell.

Key files:

- `electron/main.ts` — main process (server lifecycle, loading screen, auto-update, IPC, settings persistence)
- `electron/preload.ts` — contextBridge for renderer (update + settings APIs)
- `electron-builder.yml` — packaging config (files, extraResources, asar, per-platform targets)
- `scripts/after-pack.js` — afterPack hook: prune standalone, copy assets, rebuild native modules
- `next.config.ts` — `outputFileTracingExcludes` to prevent tracing `dist/`, `build/`, large geojson, etc.
- `src/lib/paths.ts` — centralized path resolution (`APP_DATA_DIR`, `APP_RESOURCE_DIR`) for packaged vs dev mode

### Server Startup Flow

1. Electron `app.on("ready")` creates a `BrowserWindow` (hidden) and loads an inline loading page
2. In production (`app.isPackaged`):
   - Finds a free port, sets env vars (`ELECTRON_RUN_AS_NODE=1`, `PORT`, `APP_DATA_DIR`, `APP_RESOURCE_DIR`)
   - Locates `server.js` recursively inside `app.asar.unpacked/.next/standalone/` via `findServerJs()`
   - Spawns `process.execPath` (Electron binary) with `server.js` as argument and `cwd` set to `server.js`'s parent directory
   - Polls `http://localhost:<port>/` until the server responds (60s timeout)
3. In dev mode: connects directly to `http://localhost:3000` (started by `npm run dev`)
4. Once server is ready, navigates the window to the app URL

### Settings Persistence

User settings (API key, model, simulation options) are persisted in **two layers**:

- **Electron IPC** (primary in desktop): `userData/settings.json` — managed by main process via `get-app-settings` / `set-app-settings` IPC handlers
- **localStorage** (fallback / web mode): `hcs-settings` key in browser storage

On save, the settings store (`src/store/useSettingsStore.ts`) writes to both. On load, it reads from Electron IPC first (if available), then falls back to localStorage. This ensures settings survive app restarts in the packaged client.

### Build Commands

```bash
npm run electron:dev             # Dev mode: Next.js dev server + Electron
npm run electron:build:mac       # macOS (dmg + zip, x64 + arm64)
npm run electron:build:win       # Windows (nsis exe, x64)
npm run electron:build:linux     # Linux (AppImage + deb, x64)
npm run electron:publish         # Build + upload to GitHub Releases
```

Each build command runs `electron:prebuild` first, which chains:

1. `npm run build` — Next.js standalone production build
2. `npm run electron:compile` — esbuild bundles `electron/main.ts` and `electron/preload.ts` into `electron/dist/`
3. `npm run electron:compress-geo` — gzip all `public/geojson/snapshots/*.json` → `*.json.gz`

### Packaging Pipeline Detail

#### 1. Next.js `outputFileTracingExcludes`

`next.config.ts` excludes heavy/irrelevant directories from standalone tracing to prevent bloat and cross-architecture contamination:

```typescript
outputFileTracingExcludes: {
  "*": ["./dist/**", "./build/**", "./public/geojson/snapshots/**",
        "./electron/**", "./scripts/**", "./docs/**"],
},
```

**Always clean `dist/` before building** (`rm -rf dist/`) to prevent a previous build's output from being traced into the new standalone.

#### 2. electron-builder `files` and `asar`

```yaml
files:
  - ".next/standalone/**/*"
  - ".next/static/**/*"
  - "electron/dist/**/*"
  - "package.json"
  - "!node_modules" # standalone has its own

asar: true
asarUnpack:
  - ".next/standalone/**/*" # server.js must be on real filesystem for spawn
  - ".next/static/**/*" # CSS/JS assets must be accessible to Next.js server
```

#### 3. `extraResources` (read-only assets alongside app bundle)

```yaml
extraResources:
  - from: "public"
    to: "public"
    filter: ["**/*", "!geojson/snapshots/*.json"] # ship .gz only
  - from: "src/data/seed"
    to: "src/data/seed"
    filter: ["era-*.json"]
```

These end up in `process.resourcesPath/public/` and `process.resourcesPath/src/data/seed/`, accessed via `APP_RESOURCE_DIR` env var at runtime.

#### 4. afterPack hook (`scripts/after-pack.js`)

Runs after electron-builder packs each architecture. Four responsibilities:

**a) Prune standalone** — removes directories traced by Next.js but not needed at runtime: `src/`, `data/`, `public/`, `scripts/`, `build/`, `docs/`, `electron/`. Saves ~110MB per arch.

**b) Copy `.next/static`** — copies from the unpacked asar into the standalone project root so the Next.js server can serve CSS/JS assets.

**c) Copy `public/` assets** — copies small public files (images, SVGs, JSON) into standalone, **excluding** the large `geojson/snapshots/` directory. Explicitly copies `public/geojson/territories.json` (37KB, needed by frontend `WorldMap`).

**d) Rebuild `better-sqlite3`** — the native `.node` addon must match Electron's Node ABI. The hook:

1. Runs `@electron/rebuild` against the **project's** `node_modules/better-sqlite3` (which has `binding.gyp` + source)
2. Copies the rebuilt `.node` file into the standalone's `node_modules` to replace the system-Node-compiled binary

#### 5. Gzip GeoJSON snapshots

`electron:compress-geo` gzip-compresses all `public/geojson/snapshots/*.json` (~344MB → ~87MB). The `extraResources` filter ships only `.gz` files. Runtime loading in `src/lib/geo-snapshots.ts` decompresses with `zlib.gunzipSync`, falling back to raw `.json` for dev mode.

### Publishing a New Release

1. **Bump version** in `package.json`
2. **Update README download links** — update version numbers in both `README.md` and `README.zh-CN.md`: the heading (`### Download (vX.Y.Z)` / `### 下载客户端 (vX.Y.Z)`), all download URLs, and all filenames in the download table. Both files must stay in sync.
3. **Clean** previous build: `rm -rf dist/`
4. **Commit and push** all changes to `main`
5. **Build** (must be on macOS for macOS targets):
   ```bash
   npm run electron:build:mac
   npx electron-builder --linux --publish never
   npx electron-builder --win --publish never
   ```
6. **Create tag and release:**
   ```bash
   git tag v<VERSION>
   git push origin v<VERSION>
   gh release create v<VERSION> --title "v<VERSION> — <title>" --notes "<notes>" --draft
   ```
7. **Upload assets** (one at a time for large files):
   ```bash
   gh release upload v<VERSION> dist/latest-mac.yml dist/latest-linux.yml dist/latest.yml dist/*.blockmap
   gh release upload v<VERSION> "dist/<file>.dmg"
   gh release upload v<VERSION> "dist/<file>.exe"
   ```
8. **Publish:** `gh release edit v<VERSION> --draft=false`

### What NOT to Do

- **Do not set `asar: false`** — without asar, uncompressed node_modules explode package size
- **Do not set `npmRebuild: true`** — the afterPack hook handles standalone rebuilds; electron-builder's mechanism rebuilds the excluded top-level `node_modules`
- **Do not add `node_modules` back to `files`** — standalone is self-contained
- **Do not remove `!geojson/snapshots/*.json` filter** — shipping raw JSON adds ~280MB per platform
- **Do not remove `ELECTRON_RUN_AS_NODE=1`** from the server spawn env — without it, `process.execPath` runs Electron's GUI instead of Node.js
- **Do not remove `outputFileTracingExcludes`** — without it, Next.js traces `dist/` (previous builds) into standalone, causing codesign failures and bloat
- **Do not skip cleaning `dist/` before builds** — stale build outputs get traced into standalone
- **Do not remove `territories.json` from afterPack copy** — frontend `WorldMap` fetches it via `/geojson/territories.json`
- **Do not ship `.env*` files** — API keys are entered via the frontend UI and persisted to `userData/settings.json` (Electron) or `localStorage` (web)
