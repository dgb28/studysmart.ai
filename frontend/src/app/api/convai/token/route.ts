import { NextResponse } from "next/server";

/** Must match @elevenlabs/client token request (see WebRTCConnection + sourceInfo). */
const ELEVEN_ORIGIN = "https://api.elevenlabs.io";
const SOURCE = "js_sdk";
const VERSION = "1.0.0";

/**
 * Returns a WebRTC conversation token using server-side ELEVENLABS_API_KEY.
 * Avoids relying on NEXT_PUBLIC_* in the browser and matches official ConvAI auth.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agent_id")?.trim();
  if (!agentId) {
    return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set on the server" },
      { status: 500 }
    );
  }

  const url = `${ELEVEN_ORIGIN}/v1/convai/conversation/token?${new URLSearchParams({
    agent_id: agentId,
    source: SOURCE,
    version: VERSION,
  })}`;

  const res = await fetch(url, {
    headers: { "xi-api-key": apiKey },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      {
        error: `ElevenLabs token request failed (${res.status})`,
        detail: text.slice(0, 800),
      },
      { status: 502 }
    );
  }

  try {
    const data = JSON.parse(text) as { token?: string };
    if (!data.token) {
      return NextResponse.json(
        { error: "No token in ElevenLabs response", detail: text.slice(0, 400) },
        { status: 502 }
      );
    }
    return NextResponse.json({ token: data.token });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON from ElevenLabs", detail: text.slice(0, 400) },
      { status: 502 }
    );
  }
}
