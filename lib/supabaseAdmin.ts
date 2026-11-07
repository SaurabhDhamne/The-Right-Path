import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "Warning: SUPABASE_URL or SUPABASE_SECRET_KEY missing. Admin operations will be disabled."
  );
}

// Server-side admin client that bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Checks whether an email is in the configured ADMIN_EMAILS environment variable.
 * Case-insensitive, trims whitespace.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminList = process.env.ADMIN_EMAILS || "";
  const emails = adminList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return emails.includes(email.trim().toLowerCase());
}
