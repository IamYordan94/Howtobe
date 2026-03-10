/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/pipeline/sources/[subjectId]
 * Returns all cached source material for a subject so you can
 * browse what the system found without regenerating.
 */
export async function GET(_req: Request, { params }: { params: { subjectId: string } }) {
    try {
        const { data: cacheEntries } = await supabaseAdmin
            .from("source_cache")
            .select("*")
            .eq("subject_id", params.subjectId)
            .order("source_name");

        return NextResponse.json({ sources: cacheEntries || [] });
    } catch (error: any) {
        console.error("Sources lookup error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
