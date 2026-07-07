import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api";
import { adminEmails, env } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

// Service-role client. Server only — bypasses RLS.
export function supabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(env().NEXT_PUBLIC_SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

// Verifies the caller's Supabase Auth token and that their email is allowlisted.
export async function requireAdmin(req: Request): Promise<{ email: string }> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new ApiError(401, "Missing Authorization bearer token");

  const anon = createClient(env().NEXT_PUBLIC_SUPABASE_URL, env().NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user?.email) throw new ApiError(401, "Invalid or expired session");

  const email = data.user.email.toLowerCase();
  if (!adminEmails().includes(email)) throw new ApiError(403, "Not an admin account");
  return { email };
}
