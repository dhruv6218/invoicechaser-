import { createBrowserClient } from '@supabase/ssr';

export function createBrowserClientSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for client-side use
let browserClient: ReturnType<typeof createBrowserClientSupabase> | null = null;

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createBrowserClientSupabase();
  }
  return browserClient;
}
