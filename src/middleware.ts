import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    if (!req.nextUrl.pathname.startsWith("/admin")) {
        return res;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    res.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    res.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!session || session.user.email !== adminEmail) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    } catch {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return res;
}

export const config = {
    matcher: ["/admin/:path*"],
};
