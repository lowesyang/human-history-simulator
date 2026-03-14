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

The app is packaged as an Electron desktop client. Electron's main process spawns a **Next.js standalone server** (`output: "standalone"` in `next.config.ts`) as a child process, then loads its URL in a `BrowserWindow`. This retains full Next.js features (API routes, SSR, middleware) inside the desktop shell.

Key files:
- `electron/main.ts` — main process (server lifecycle, auto-update, IPC)
- `electron/preload.ts` — contextBridge for renderer
- `electron-builder.yml` — packaging config
- `scripts/after-pack.js` — afterPack hook for pruning and native module rebuild
- `src/lib/paths.ts` — centralized path resolution for packaged vs dev mode

### Build Commands

```bash
npm run electron:build:mac     # macOS (dmg + zip, x64 + arm64)
npm run electron:build:win     # Windows (nsis exe, x64)
npm run electron:build:linux   # Linux (AppImage + deb, x64)
npm run electron:publish       # Build + upload to GitHub Releases
```

Each command runs `electron:prebuild` first, which chains:
1. `npm run build` — Next.js standalone production build
2. `npm run electron:compile` — esbuild bundles `electron/main.ts` and `electron/preload.ts`
3. `npm run electron:compress-geo` — gzip all `public/geojson/snapshots/*.json` → `*.json.gz`

### Size Optimization Rules (MUST follow)

Every decision in the packaging pipeline is designed to minimize installer size. **Do not revert or weaken these without measuring the impact.**

#### 1. Exclude top-level `node_modules` (`!node_modules` in `files`)

The standalone build (`.next/standalone/`) is self-contained — it has its own `node_modules` with only the packages the server actually needs. The project's top-level `node_modules` are **never shipped**.

#### 2. Bundle Electron main process with esbuild

`electron:compile` uses **esbuild** (not tsc) to bundle `electron/main.ts` into a single `electron/dist/main.js` (~566KB). This inlines `electron-updater` and all its transitive dependencies, so the main process has **zero runtime dependency on `node_modules`**.

- `--external:electron` — Electron APIs are provided by the runtime, not bundled.
- If you add a new npm dependency to `electron/main.ts`, esbuild will automatically bundle it. No config changes needed.

#### 3. Gzip GeoJSON snapshots

`electron:compress-geo` gzip-compresses all `public/geojson/snapshots/*.json` files (47 files, ~344MB → ~87MB). The `electron-builder.yml` `extraResources` filter excludes the raw `.json` files and only ships the `.json.gz` versions:

```yaml
extraResources:
  - from: "public"
    to: "public"
    filter:
      - "**/*"
      - "!geojson/snapshots/*.json"   # exclude raw, ship only .gz
```

Runtime loading in `src/lib/geo-snapshots.ts` transparently decompresses with `zlib.gunzipSync`, falling back to raw `.json` for dev mode. **Do not remove the gzip fallback** — it's needed for `npm run dev` where `.gz` files don't exist.

#### 4. afterPack pruning (`scripts/after-pack.js`)

Next.js standalone traces the entire project tree. The afterPack hook removes directories from the unpacked standalone that are already supplied via `extraResources` or not needed at runtime:

- `public/` (already in extraResources — ~432MB saved)
- `src/` (only seed data needed, already in extraResources — ~61MB saved)
- `data/`, `scripts/`, `build/`, `docs/`, `electron/` (~50MB saved)

Total pruning: **~543MB per architecture**.

#### 5. afterPack native module rebuild

`better-sqlite3` contains a native `.node` addon that must match Electron's Node ABI. The afterPack hook finds `better-sqlite3` inside the standalone's `node_modules` and runs `@electron/rebuild` targeting the correct Electron version + CPU architecture. This replaces the system-Node-compiled binary with an Electron-compatible one.

- `npmRebuild: false` in `electron-builder.yml` — we handle rebuilds ourselves in afterPack, not via electron-builder's global mechanism (which would operate on the excluded top-level `node_modules`).

#### 6. asar with selective unpack

```yaml
asar: true
asarUnpack:
  - ".next/standalone/**/*"
```

Everything is packed into `app.asar` except the standalone server, which must be unpacked because Electron spawns it as a separate Node.js process via `process.execPath`.

### Publishing a New Release

1. **Bump version** in `package.json`.
2. **Commit and push** all changes to `main`.
3. **Build all platforms** (must build on macOS for macOS targets; Linux/Windows cross-compile from macOS):
   ```bash
   npm run electron:build:mac
   npx electron-builder --linux --publish never
   npx electron-builder --win --publish never
   ```
4. **Create tag and release:**
   ```bash
   git tag v<VERSION>
   git push origin v<VERSION>
   gh release create v<VERSION> --title "v<VERSION> — <title>" --notes "<notes>" --draft
   ```
5. **Upload assets** (one at a time for large files to avoid timeout):
   ```bash
   gh release upload v<VERSION> dist/latest-mac.yml dist/latest-linux.yml dist/latest.yml dist/*.blockmap
   gh release upload v<VERSION> "dist/<file>.dmg"
   gh release upload v<VERSION> "dist/<file>.exe"
   # ... etc
   ```
6. **Publish:** `gh release edit v<VERSION> --draft=false`

### What NOT to Do

- **Do not set `asar: false`** — without asar, the uncompressed node_modules will explode package size (2GB+ on Linux).
- **Do not set `npmRebuild: true`** — it rebuilds top-level `node_modules` which we exclude; the afterPack hook handles standalone rebuilds.
- **Do not add `node_modules` back to `files`** — standalone is self-contained.
- **Do not remove the `!geojson/snapshots/*.json` filter** — shipping raw JSON adds ~280MB per platform.
- **Do not remove directories from the afterPack prune list** without checking if they're already in extraResources.
- **Do not ship `.env*` files** — API keys must be entered via the frontend UI and stored in `localStorage`.
