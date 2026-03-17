# Community Historical Events

This directory contains curated historical seed events contributed by the open-source community. When enabled in settings, these events are automatically injected into the simulation when the timeline reaches the corresponding year.

## How It Works

1. Each JSON file is named by year (e.g., `1939.json`, `-207.json` for 207 BCE)
2. When the simulation advances to a year that has a matching file, the events are merged into the pending event queue
3. Users can toggle this feature on/off via the **Community Preset Events** switch in the event generation dialog
4. When disabled, the simulation relies entirely on AI-generated events

## Event IDs

**Contributors do NOT need to provide an `id` field.** The loader automatically generates a deterministic fingerprint ID for each event at import time, based on:

```
sha256( year | month | title.en | category )  →  ce-{year}-{12-char-hex}
```

For example, an event with year=1939, month=8, title.en="Molotov–Ribbentrop Pact Signed", category="diplomacy" gets the ID `ce-1939-a7b3c9d2e1f4`. The same event always produces the same ID, ensuring stable deduplication across restarts.

## File Naming

```
{year}.json
```

- **CE years**: use the plain number — `1939.json`, `100.json`, `2023.json`
- **BCE years**: use a negative number — `-207.json`, `-500.json`, `-1600.json`
- The number must be an integer with no leading zeros, no padding, no extra characters
- **Every event inside the file must have `timestamp.year` equal to the filename year**

## File Format

Each file is a JSON array of event objects. See [`1939.json`](./1939.json) for a complete working example.

```json
[
  {
    "timestamp": { "year": 1939, "month": 8 },
    "title": {
      "zh": "苏德互不侵犯条约签订",
      "en": "Molotov–Ribbentrop Pact Signed"
    },
    "description": {
      "zh": "苏联与纳粹德国签署互不侵犯条约，秘密议定书划分了东欧势力范围，为德国入侵波兰扫清了障碍。",
      "en": "The Soviet Union and Nazi Germany signed a non-aggression pact with secret protocols dividing Eastern Europe into spheres of influence, clearing the path for Germany's invasion of Poland."
    },
    "affectedRegions": ["soviet_union_1939", "germany_1939", "poland_1939"],
    "category": "diplomacy",
    "source": "https://en.wikipedia.org/wiki/Molotov%E2%80%93Ribbentrop_Pact",
    "contributor": "community"
  }
]
```

### Required Fields

| Field             | Type                              | Description                                                                                                                                                                                        |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamp`       | `{ year: number, month: number }` | `year` **must equal** the filename year; `month` must be 1–12                                                                                                                                      |
| `title`           | `{ zh: string, en: string }`      | Bilingual title — both `zh` and `en` are required and must be non-empty                                                                                                                            |
| `description`     | `{ zh: string, en: string }`      | Bilingual description — both `zh` and `en` are required and must be non-empty                                                                                                                      |
| `affectedRegions` | `string[]`                        | Non-empty array of region IDs affected by this event                                                                                                                                               |
| `category`        | `string`                          | One of: `war`, `dynasty`, `invention`, `trade`, `religion`, `disaster`, `natural_disaster`, `exploration`, `diplomacy`, `migration`, `technology`, `finance`, `political`, `announcement`, `other` |
| `source`          | `string`                          | **HTTP/HTTPS URL** to a reference (Wikipedia, academic paper, reputable archive, etc.)                                                                                                             |

### Optional Fields

| Field         | Type     | Description          |
| ------------- | -------- | -------------------- |
| `contributor` | `string` | Your GitHub username |

> **Note**: The `id` field is auto-generated and should NOT be included in the JSON.

## Validation Rules

The loader and CI validator check the following. **Events that fail are skipped** (a warning is logged):

1. Filename must match `{integer}.json` — other filenames are ignored
2. File root must be a JSON array with at least one event
3. `timestamp.year` must equal the filename year
4. `timestamp.month` must be 1–12
5. `title.zh`, `title.en`, `description.zh`, `description.en` must all be non-empty strings
6. `affectedRegions` must be a non-empty array
7. `category` must be one of the allowed values
8. `source` must be a valid HTTP/HTTPS URL
9. No duplicate events (same year + month + English title + category)

## Region IDs

Region IDs vary by era. To find valid region IDs for a specific era, check the corresponding seed file in `src/data/seed/era-*.json`. Each region has an `id` field.

For example:

- **Qin-Rome era** (~221 BCE): `qin_empire_221_bce`, `rome_republic_221_bce`, `maurya_empire_221_bce`
- **World War era** (1939): `germany_1939`, `united_kingdom_1939`, `soviet_union_1939`, `united_states_1939`
- **Cold War era** (1962): Look in `era-cold-war.json`

> **Tip**: Region IDs typically follow the pattern `{civilization}_{year_suffix}`.

## Contributing Guidelines

1. **One file per year** — create a new JSON file named `{year}.json`
2. **No `id` field** — IDs are auto-generated from event content; do not include them
3. **Historical accuracy** — events should be real, documented historical events
4. **Source URL required** — every event must include a `source` field with a valid HTTP/HTTPS link (Wikipedia, academic papers, reputable archives)
5. **Bilingual** — both Chinese (`zh`) and English (`en`) fields are required and non-empty
6. **Year consistency** — `timestamp.year` must equal the filename year
7. **Valid region IDs** — ensure `affectedRegions` uses IDs from the corresponding era seed file
8. **Appropriate categories** — choose the most fitting category for each event
9. **Concise descriptions** — keep descriptions informative but focused (2-4 sentences)
10. **No duplicates** — each combination of year + month + English title + category must be unique

## Submitting Events

1. Fork the repository
2. Add your event file(s) to `public/community-events/`
3. Run the validator locally to catch issues before pushing:
   ```bash
   npm run validate:events
   ```
4. Submit a Pull Request with a brief description of the events added

> **CI check**: A GitHub Actions workflow validates all files in `public/community-events/` on every push and PR. The PR cannot be merged if validation fails.

### PR Checklist

- [ ] Filename is `{year}.json` (integer, negative for BCE)
- [ ] JSON is valid and the root is a non-empty array
- [ ] No `id` field in the event objects (auto-generated)
- [ ] `timestamp.year` matches the filename year
- [ ] `month` is 1–12
- [ ] Both `zh` and `en` translations are present for title and description
- [ ] `affectedRegions` contains valid region IDs from the era seed data
- [ ] `category` is one of the allowed values
- [ ] `source` is a valid HTTP/HTTPS URL to a reputable reference
- [ ] No duplicate events (same year + month + title + category)
