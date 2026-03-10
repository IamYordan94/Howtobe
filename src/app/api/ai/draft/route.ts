/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { subjectLabel, lessonTitle, level } = await req.json();

        if (!subjectLabel || !lessonTitle || !level) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const prompt = `You are an expert educator writing for a platform called "How To Be Human" that teaches essential life subjects to adults in a clear, engaging, and thoughtful way.

Write a complete lesson in Markdown format for:
- Subject: ${subjectLabel}
- Lesson Title: ${lessonTitle}
- Level: ${level}

Guidelines:
- Write directly to the reader using "you"
- Be warm, clear, and intellectually stimulating
- Use specific examples, not vague generalities
- Structure with ## headings, bullet points, and callouts where helpful
- Length: 600–900 words
- No intro meta-commentary — start directly with the lesson content
- Do NOT include a title at the top (it's displayed separately)

Begin the lesson now.`;

        const message = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
        });

        const content = (message.content[0] as { type: string; text: string }).text;

        return NextResponse.json({ content });
    } catch (error: any) {
        console.error("AI draft error:", error);
        return NextResponse.json({ error: error.message || "AI draft failed" }, { status: 500 });
    }
}
