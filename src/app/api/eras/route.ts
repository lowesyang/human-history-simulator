import { NextResponse } from "next/server";
import { ERA_PRESETS } from "@/data/era-presets";
import { getSeedDir, getUserSeedDir } from "@/lib/paths";
import fs from "fs";
import path from "path";

export async function GET() {
  const builtinDir = getSeedDir();
  const userDir = getUserSeedDir();
  const eras = ERA_PRESETS.map((era) => ({
    ...era,
    hasPrebuilt:
      fs.existsSync(path.join(userDir, `era-${era.id}.json`)) ||
      fs.existsSync(path.join(builtinDir, `era-${era.id}.json`)),
  }));
  return NextResponse.json({ eras });
}
