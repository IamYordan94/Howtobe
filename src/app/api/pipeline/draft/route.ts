/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { runResearch, runGenerate } from "@/lib/pipeline-engine";

/**
 * POST /api/pipeline/draft
 * The single button the Gateway calls.
 * Runs research then generation directly — no internal HTTP calls.
 */
export async function POST(req: Request) {
    try {
        const { subject_id, level } = await req.json();
        if (!subject_id || !level) {
            return NextResponse.json({ error: "subject_id and level are required" }, { status: 400 });
        }

        const research = await runResearch(subject_id, level, false);
        const generated = await runGenerate(subject_id, level, research);

        return NextResponse.json({
            content: generated.content,
            sources: generated.sources,
            generation_model: generated.generation_model,
            generated_at: generated.generated_at,
            research_sources: research.sources,
        });
    } catch (error: any) {
        console.error("[pipeline/draft]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
