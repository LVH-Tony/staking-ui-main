import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 },
    );
  }

  try {
    // TODO: Replace with actual API call to your staking service
    const response = await fetch(
      `YOUR_STAKING_API_ENDPOINT?address=${address}`,
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching staking data:", error);
    return NextResponse.json(
      { error: "Failed to fetch staking data" },
      { status: 500 },
    );
  }
}
