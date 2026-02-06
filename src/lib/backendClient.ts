import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Use env-configured backend to avoid mismatches between preview/published environments.
// NOTE: These VITE_* vars are managed by Lovable Cloud and are safe to use on the client.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail fast with a clear message (helps debugging in preview).
  throw new Error(
    "Configuração do backend ausente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage, // Keep session persistent
    persistSession: true,
    autoRefreshToken: true,
  },
});
