import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/hume/access-token
 * Fetches an access token from Hume AI using OAuth2 client credentials flow.
 */
export async function GET() {
  try {
    const apiKey = process.env.HUME_API_KEY;
    const secretKey = process.env.HUME_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "Hume API credentials not configured" },
        { status: 500 }
      );
    }

    const authString = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

    const response = await fetch("https://api.hume.ai/oauth2-cc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authString}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Hume OAuth error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.access_token) {
      return NextResponse.json(
        { error: "No access token received" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    });
  } catch (error) {
    console.error("[Hume Token] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get access token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
