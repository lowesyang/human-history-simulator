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
