/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { subjectLabel, category } = await req.json();

        if (!subjectLabel) {
            return NextResponse.json({ error: "Missing subjectLabel" }, { status: 400 });
        }

        const prompt = `You are a writer for "How To Be Human" — a platform that teaches essential life subjects to adults.

Write a compelling 2–3 sentence description for the subject: "${subjectLabel}" (Category: ${category || "General"}).

Guidelines:
- Start with what this subject fundamentally is and why it matters
- Be intellectually engaging but accessible
- Do not use clichés or vague language
- No meta-commentary — write just the description
- Maximum 60 words

Write the description now.`;

        const message = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 200,
            messages: [{ role: "user", content: prompt }],
        });

        const description = (message.content[0] as { type: string; text: string }).text.trim();

        return NextResponse.json({ description });
    } catch (error: any) {
        console.error("AI description draft error:", error);
        return NextResponse.json({ error: error.message || "AI draft failed" }, { status: 500 });
    }
}
