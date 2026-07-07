import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_EMAILS: z.string().min(1),
  CNIC_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, "must be 64 hex characters"),
});

let cached: z.infer<typeof schema> | null = null;

// Validated lazily so `next build` doesn't require secrets at compile time.
export function env() {
  if (!cached) {
    const parsed = schema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS,
      CNIC_ENCRYPTION_KEY: process.env.CNIC_ENCRYPTION_KEY,
    });
    if (!parsed.success) {
      throw new Error(
        `Missing or invalid environment variables: ${parsed.error.issues
          .map((i) => i.path.join("."))
          .join(", ")}. See .env.example.`
      );
    }
    cached = parsed.data;
  }
  return cached;
}

export function adminEmails(): string[] {
  return env()
    .ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
