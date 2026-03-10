import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * /auth/callback
 *
 * Supabase redirects here after:
 *   - Email verification on signup
 *   - Password reset link click
 *
 * Exchanges the code for a session, then redirects the user.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/account";

    if (code) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Something went wrong — send to login with an error hint
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
