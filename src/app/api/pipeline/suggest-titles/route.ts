/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/pipeline/suggest-titles
 * Given a subject_id and level, returns 5 suggested lesson titles.
 */
export async function POST(req: Request) {
    try {
        const { subject_id, level } = await req.json();
        if (!subject_id || !level) {
            return NextResponse.json({ error: "subject_id and level required" }, { status: 400 });
        }

        const { data: subject } = await supabaseAdmin
            .from("subjects")
            .select("id, label, description, category")
            .eq("id", subject_id)
            .single();

        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        const levelDescriptions: Record<string, string> = {
            beginner: "someone with zero prior knowledge — first encounter with this subject",
            intermediate: "someone who knows the basics and is ready to go deeper",
            advanced: "someone with a solid foundation ready for nuanced, complex material",
        };

        const prompt = `You are naming lessons for an educational platform called "How To Be Human".

Subject: ${subject.label}
${subject.description ? `Description: ${subject.description}` : ""}
Level: ${level} — for ${levelDescriptions[level] || level}

Generate exactly 5 lesson titles for this subject at this level.
Requirements:
- Each title should be concise (3–7 words)
- Titles should feel like the name of a specific, focused lesson — not a general topic
- Use plain language, not academic jargon
- Each title should be distinct — covering a different angle of the subject
- Do NOT start titles with "Introduction to" or "Understanding" or "Overview of"
- Think: what specific question does this lesson answer?

Return ONLY a JSON array of 5 strings. No explanation. No markdown. Just the array.
Example format: ["Title One", "Title Two", "Title Three", "Title Four", "Title Five"]`;

        const message = await client.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 300,
            messages: [{ role: "user", content: prompt }],
        });

        const raw = (message.content[0] as any).text.trim();

        // Parse the JSON array from Claude's response
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) {
            return NextResponse.json({ error: "Failed to parse titles from AI response", raw }, { status: 500 });
        }

        const titles: string[] = JSON.parse(match[0]);

        return NextResponse.json({ titles });
    } catch (error: any) {
        console.error("suggest-titles error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
