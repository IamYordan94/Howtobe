/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role — bypasses RLS for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject_id, title, level, grade_num, order_index } = body;

        if (!subject_id || !level) {
            return NextResponse.json({ error: "subject_id and level are required" }, { status: 400 });
        }

        // Derive grade_num from level string if not explicitly passed
        const gradeMatch = level.match(/^grade_(\d+)$/);
        const resolvedGradeNum = grade_num ?? (gradeMatch ? parseInt(gradeMatch[1]) : null);

        const defaultTitle = gradeMatch
            ? `Grade ${gradeMatch[1]} Lesson`
            : `New ${level.charAt(0).toUpperCase() + level.slice(1)} Lesson`;

        const { data, error } = await supabaseAdmin
            .from("lessons")
            .insert({
                subject_id,
                title: title || defaultTitle,
                level,
                grade_num: resolvedGradeNum,
                order_index: order_index ?? resolvedGradeNum ?? 1,
                content: "",
                is_published: false,
                is_preview: false,
                sources: [],
            })
            .select()
            .single();

        if (error || !data) {
            return NextResponse.json({ error: error?.message || "Insert failed" }, { status: 500 });
        }

        return NextResponse.json({ lesson: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
