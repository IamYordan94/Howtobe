/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/notify
 * Saves a guest email notification request for a coming-soon subject.
 * Requires a `notify_emails` table: (id, email, subject_id, created_at)
 * with a unique constraint on (email, subject_id).
 */
export async function POST(req: Request) {
    try {
        const { email, subjectId } = await req.json();
        if (!email || !subjectId) {
            return NextResponse.json({ error: "email and subjectId required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("notify_emails")
            .upsert({ email, subject_id: subjectId }, { onConflict: "email,subject_id" });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * DELETE /api/notify
 * Removes a subject from the user's notify_subjects array.
 */
export async function DELETE(req: Request) {
    try {
        const { user_id, subject_id } = await req.json();
        if (!user_id || !subject_id) {
            return NextResponse.json({ error: "user_id and subject_id required" }, { status: 400 });
        }

        // Fetch current array, remove the subject, update
        const { data: userData } = await supabaseAdmin
            .from("users")
            .select("notify_subjects")
            .eq("id", user_id)
            .single();

        const current: string[] = userData?.notify_subjects ?? [];
        const updated = current.filter((id: string) => id !== subject_id);

        const { error } = await supabaseAdmin
            .from("users")
            .update({ notify_subjects: updated })
            .eq("id", user_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
