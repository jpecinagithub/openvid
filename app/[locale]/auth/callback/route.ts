import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = host ? `${protocol}://${host}` : requestUrl.origin;

  return NextResponse.redirect(`${origin}/editor`);
}
