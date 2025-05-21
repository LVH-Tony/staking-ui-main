import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.app.trustedstake.ai";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/subnets`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in subnets API:", error);
    return NextResponse.json(
      { error: "Failed to fetch subnets" },
      { status: 500 },
    );
  }
}
