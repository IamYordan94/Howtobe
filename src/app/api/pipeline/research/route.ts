/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { runResearch } from "@/lib/pipeline-engine";

/**
 * POST /api/pipeline/research
 * Runs just the research step (cached).
 * Useful for pre-fetching or inspecting what sources returned.
 */
export async function POST(req: Request) {
    try {
        const { subject_id, level, force_refresh } = await req.json();
        if (!subject_id || !level) {
            return NextResponse.json({ error: "subject_id and level are required" }, { status: 400 });
        }

        const result = await runResearch(subject_id, level, !!force_refresh);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[pipeline/research]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
