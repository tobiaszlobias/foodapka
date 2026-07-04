import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role klient — obchází RLS. Používat POUZE v serverovém kódu bez
 * uživatelské session (cron joby, webhooky), nikdy v kódu dostupném klientovi.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
