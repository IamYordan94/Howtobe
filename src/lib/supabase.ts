/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Keep backward compatibility - lazy singleton
let _supabase: ReturnType<typeof getSupabaseClient> | null = null;
export const supabase = new Proxy({} as ReturnType<typeof getSupabaseClient>, {
    get(_, prop) {
        if (!_supabase) {
            _supabase = getSupabaseClient();
        }
        return (_supabase as any)[prop];
    }
});
