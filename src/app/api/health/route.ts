import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase";
import { sweepOldProofs } from "@/lib/retention";

// Hit daily by Vercel cron (see vercel.json): keeps the free Supabase project
// awake and deletes payment screenshots older than the retention window.
export const GET = handle(async () => {
  const { error } = await supabaseAdmin().from("settings").select("key").limit(1);
  if (error) return NextResponse.json({ ok: false }, { status: 503 });
  const sweptProofs = await sweepOldProofs();
  return NextResponse.json({ ok: true, swept_proofs: sweptProofs });
});
