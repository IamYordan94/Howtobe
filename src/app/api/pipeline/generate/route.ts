/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { runGenerate } from "@/lib/pipeline-engine";

/**
 * POST /api/pipeline/generate
 * Runs just the Claude generation step given pre-fetched research.
 * Useful if you already have research and just want a new draft.
 */
export async function POST(req: Request) {
    try {
        const { subject_id, level, research } = await req.json();
        if (!subject_id || !level || !research) {
            return NextResponse.json(
                { error: "subject_id, level, and research are required" },
                { status: 400 }
            );
        }

        const result = await runGenerate(subject_id, level, research);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[pipeline/generate]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
