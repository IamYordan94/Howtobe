/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { lessonId, userId } = await req.json();
        if (!lessonId || !userId) {
            return NextResponse.json({ error: "lessonId and userId are required" }, { status: 400 });
        }

        // Upsert so duplicate calls are safe
        const { error } = await supabaseAdmin
            .from("progress")
            .upsert(
                { user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() },
                { onConflict: "user_id,lesson_id" }
            );

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
