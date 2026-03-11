import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { apiKey } = body;

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return NextResponse.json(
      { valid: false, error: "API key is required" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return NextResponse.json({ valid: true });
    }

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({
        valid: false,
        error: "Invalid API key",
      });
    }

    const errorText = await response.text();
    let errorMsg = `API returned ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error?.message) errorMsg = parsed.error.message;
    } catch {
      // use default message
    }

    return NextResponse.json({ valid: false, error: errorMsg });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json({ valid: false, error: message });
  }
}
