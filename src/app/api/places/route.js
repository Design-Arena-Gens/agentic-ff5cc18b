import { NextResponse } from "next/server";

const GOOGLE_TEXT_SEARCH_URL =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";

const sanitizeQueryParam = (value) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const query = sanitizeQueryParam(body.query);
  const location = sanitizeQueryParam(body.location);
  const radius = Number.parseInt(body.radius, 10) || 1500;

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required." },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: "Missing Google Places API key on the server." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    query,
    key: process.env.GOOGLE_PLACES_API_KEY,
  });

  if (location) {
    params.set("location", location);
    params.set("radius", radius.toString());
  }

  const response = await fetch(`${GOOGLE_TEXT_SEARCH_URL}?${params.toString()}`);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Unable to reach Google Places API." },
      { status: 502 }
    );
  }

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      { error: data.error_message || `Google API error (${data.status}).` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    results: Array.isArray(data.results) ? data.results : [],
    nextPageToken: data.next_page_token || null,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pageToken = sanitizeQueryParam(searchParams.get("pageToken"));
  const query = sanitizeQueryParam(searchParams.get("query"));
  const location = sanitizeQueryParam(searchParams.get("location"));
  const radius = Number.parseInt(searchParams.get("radius"), 10) || 1500;

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required." },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: "Missing Google Places API key on the server." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    key: process.env.GOOGLE_PLACES_API_KEY,
  });

  if (pageToken) {
    params.set("pagetoken", pageToken);
  } else {
    params.set("query", query);
    if (location) {
      params.set("location", location);
      params.set("radius", radius.toString());
    }
  }

  const response = await fetch(`${GOOGLE_TEXT_SEARCH_URL}?${params.toString()}`);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Unable to reach Google Places API." },
      { status: 502 }
    );
  }

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      { error: data.error_message || `Google API error (${data.status}).` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    results: Array.isArray(data.results) ? data.results : [],
    nextPageToken: data.next_page_token || null,
  });
}
