import { NextResponse } from "next/server";
import { montarUrlLoginSteam } from "@/lib/steam.ts";

export async function GET(request: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(montarUrlLoginSteam(site));
}