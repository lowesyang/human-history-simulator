import { NextResponse } from "next/server";
import { ERA_PRESETS } from "@/data/era-presets";
import fs from "fs";
import path from "path";

export async function GET() {
  const seedDir = path.join(process.cwd(), "src", "data", "seed");
  const eras = ERA_PRESETS.map((era) => ({
    ...era,
    hasPrebuilt: fs.existsSync(path.join(seedDir, `era-${era.id}.json`)),
  }));
  return NextResponse.json({ eras });
}
