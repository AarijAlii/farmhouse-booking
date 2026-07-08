import { createClient } from "@supabase/supabase-js";

// Browser-side client. Uses only the public anon key — it can't touch data
// (RLS allows nothing); it exists purely to sign the admin in and hold the session.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Calls our admin API with the signed-in admin's token.
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session ended. Please sign in again.");

  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
  return body as T;
}
