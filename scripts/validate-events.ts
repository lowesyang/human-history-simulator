import fs from "fs";
import path from "path";

const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");

interface ValidationResult {
  eventId: string;
  title: string;
  year: number;
  status: "verified" | "unverified" | "date_mismatch";
  wikidataId?: string;
  notes?: string;
}

async function queryWikidata(year: number, margin: number = 50): Promise<unknown[]> {
  const minYear = year - margin;
  const maxYear = year + margin;

  const sparql = `
    SELECT ?event ?eventLabel ?date WHERE {
      ?event wdt:P31/wdt:P279* wd:Q1190554.
      ?event wdt:P585 ?date.
      FILTER(YEAR(?date) >= ${minYear} && YEAR(?date) <= ${maxYear})
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,zh". }
    }
    ORDER BY ?date
    LIMIT 200
  `;

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/sparql-results+json" },
    });
    if (!response.ok) {
      console.warn(`Wikidata query failed for year range ${minYear}-${maxYear}`);
      return [];
    }
    const data = await response.json();
    return data.results?.bindings || [];
  } catch (err) {
    console.warn(`Wikidata fetch error:`, err);
    return [];
  }
}

async function validateEvents(filePath: string): Promise<ValidationResult[]> {
  const raw = fs.readFileSync(filePath, "utf-8");
  const events = JSON.parse(raw);
  const results: ValidationResult[] = [];

  console.log(`Validating ${events.length} events from ${path.basename(filePath)}...`);

  const yearGroups = new Map<number, typeof events>();
  for (const evt of events) {
    const yr = evt.timestamp.year;
    const century = Math.floor(yr / 100) * 100;
    if (!yearGroups.has(century)) yearGroups.set(century, []);
    yearGroups.get(century)!.push(evt);
  }

  for (const [century, groupEvents] of yearGroups) {
    const wikidataEvents = await queryWikidata(century, 75);

    for (const evt of groupEvents) {
      const titleEn = evt.title?.en?.toLowerCase() || "";
      const match = wikidataEvents.find((wd: unknown) => {
        const wdLabel = ((wd as Record<string, Record<string, string>>).eventLabel?.value || "").toLowerCase();
        return (
          wdLabel.includes(titleEn.split(" ").slice(0, 2).join(" ")) ||
          titleEn.includes(wdLabel.split(" ").slice(0, 2).join(" "))
        );
      });

      results.push({
        eventId: evt.id,
        title: evt.title?.en || evt.id,
        year: evt.timestamp.year,
        status: match ? "verified" : "unverified",
        wikidataId: match ? (match as Record<string, Record<string, string>>).event?.value : undefined,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

async function main() {
  const files = fs
    .readdirSync(SEED_DIR)
    .filter((f: string) => f.startsWith("events-") && f.endsWith(".json"));

  const allResults: ValidationResult[] = [];

  for (const file of files) {
    const results = await validateEvents(path.join(SEED_DIR, file));
    allResults.push(...results);
  }

  const verified = allResults.filter((r) => r.status === "verified").length;
  const unverified = allResults.filter((r) => r.status === "unverified").length;

  console.log(`\n=== Validation Summary ===`);
  console.log(`Total events: ${allResults.length}`);
  console.log(`Verified: ${verified} (${((verified / allResults.length) * 100).toFixed(1)}%)`);
  console.log(`Unverified: ${unverified}`);

  const reportPath = path.join(process.cwd(), "data", "validation-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));
  console.log(`\nReport written to ${reportPath}`);
}

main().catch(console.error);
