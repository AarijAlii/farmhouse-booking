import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase";

// Hit daily by Vercel cron (see vercel.json) so the free Supabase project never pauses.
export const GET = handle(async () => {
  const { error } = await supabaseAdmin().from("settings").select("key").limit(1);
  if (error) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true });
});
