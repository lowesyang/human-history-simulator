import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { insertEvent, getLatestSnapshot, updateEvent, deleteEvent, getCurrentEraId } from "@/lib/db";
import type { Region } from "@/lib/types";
import { isBlockedEvent } from "@/lib/content-filter";

interface CustomEventBody {
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  affectedRegions: string[];
  category: string;
  timestamp: { year: number; month: number };
}

const VALID_CATEGORIES = new Set([
  "war", "dynasty", "invention", "trade", "religion",
  "disaster", "natural_disaster", "exploration", "diplomacy", "migration", "other",
]);

export async function POST(request: NextRequest) {
  try {
    const body: CustomEventBody = await request.json();

    if (!body.title?.zh && !body.title?.en) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body.description?.zh && !body.description?.en) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (isBlockedEvent({ title: body.title, description: body.description })) {
      return NextResponse.json({ error: "This event topic is not supported" }, { status: 403 });
    }
    if (body.timestamp?.year == null || body.timestamp?.month == null) {
      return NextResponse.json({ error: "Valid timestamp required" }, { status: 400 });
    }
    if (body.timestamp.month < 1 || body.timestamp.month > 12) {
      return NextResponse.json({ error: "Month must be 1-12" }, { status: 400 });
    }

    const latestSnapshot = getLatestSnapshot();
    if (latestSnapshot) {
      const snapshotYear = latestSnapshot.year;
      const snapshotMonth = latestSnapshot.month;
      if (
        body.timestamp.year < snapshotYear ||
        (body.timestamp.year === snapshotYear && body.timestamp.month <= snapshotMonth)
      ) {
        return NextResponse.json(
          { error: "Event time must be after the current simulation time" },
          { status: 400 }
        );
      }
    }

    const regionIds = latestSnapshot
      ? (latestSnapshot.regions as Region[]).map((r) => r.id)
      : [];
    const regionIdSet = new Set(regionIds);

    const filteredRegions = (body.affectedRegions || []).filter((r) => regionIdSet.has(r));
    if (filteredRegions.length === 0 && regionIds.length > 0) {
      filteredRegions.push(regionIds[0]);
    }

    const category = VALID_CATEGORIES.has(body.category) ? body.category : "other";

    const id = `evt-custom-${uuidv4().slice(0, 8)}`;

    insertEvent(
      id,
      body.timestamp.year,
      body.timestamp.month,
      body.title,
      body.description,
      filteredRegions,
      category,
      "pending",
      true,
      getCurrentEraId() ?? undefined
    );

    return NextResponse.json({
      id,
      timestamp: body.timestamp,
      title: body.title,
      description: body.description,
      affectedRegions: filteredRegions,
      category,
      status: "pending",
      isCustom: true,
    });
  } catch (error) {
    console.error("Custom event creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, affectedRegions, category, timestamp } = body;

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }
    if (!title?.zh && !title?.en) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (isBlockedEvent({ title, description })) {
      return NextResponse.json({ error: "This event topic is not supported" }, { status: 403 });
    }
    if (timestamp?.year == null || timestamp?.month == null) {
      return NextResponse.json({ error: "Valid timestamp required" }, { status: 400 });
    }
    if (timestamp.month < 1 || timestamp.month > 12) {
      return NextResponse.json({ error: "Month must be 1-12" }, { status: 400 });
    }

    const latestSnapshot = getLatestSnapshot();
    if (latestSnapshot) {
      if (
        timestamp.year < latestSnapshot.year ||
        (timestamp.year === latestSnapshot.year && timestamp.month <= latestSnapshot.month)
      ) {
        return NextResponse.json(
          { error: "Event time must be after the current simulation time" },
          { status: 400 }
        );
      }
    }

    const regionIds = latestSnapshot
      ? (latestSnapshot.regions as Region[]).map((r) => r.id)
      : [];
    const regionIdSet = new Set(regionIds);
    const filteredRegions = (affectedRegions || []).filter((r: string) => regionIdSet.has(r));
    if (filteredRegions.length === 0 && regionIds.length > 0) {
      filteredRegions.push(regionIds[0]);
    }

    const validCategory = VALID_CATEGORIES.has(category) ? category : "other";

    updateEvent(
      id,
      timestamp.year,
      timestamp.month,
      title,
      description || title,
      filteredRegions,
      validCategory
    );

    return NextResponse.json({
      id,
      timestamp,
      title,
      description: description || title,
      affectedRegions: filteredRegions,
      category: validCategory,
      status: "pending",
      isCustom: true,
    });
  } catch (error) {
    console.error("Custom event update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    deleteEvent(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Custom event delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
