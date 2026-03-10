/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pipeline-engine.ts
 *
 * Core content pipeline logic — called directly by API routes.
 * No HTTP self-calls. No fragile URL dependencies.
 *
 * Two main functions:
 *   runResearch(subject_id, level, force_refresh?) → ResearchResult
 *   runGenerate(subject_id, level, research)       → GenerateResult
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import {
    CATEGORY_SOURCES,
    fetchWikipedia,
    fetchPerplexity,
    fetchOpenStax,
    fetchKhanAcademy,
    fetchGutenberg,
    fetchPubMed,
} from "./pipeline-sources";

// ─── Supabase admin client (service role — bypasses RLS) ─────────────────────
function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ─── Anthropic client ─────────────────────────────────────────────────────────
function getAnthropic() {
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type SourceEntry = { content: string; urls: string[] };
export type ResearchSources = Record<string, SourceEntry>;

export type ResearchResult = {
    subject: { id: string; label: string; category: string };
    sources: ResearchSources;
};

export type GenerateResult = {
    content: string;
    sources: string[];
    generation_model: string;
    generated_at: string;
};

// ─── Cache helpers ────────────────────────────────────────────────────────────
const CACHE_TTL_DAYS = 30;

/**
 * Level key:
 *   - Perplexity results are level-specific → use the actual level string
 *   - All other sources are not level-specific → use "all"
 * This avoids NULL in the unique constraint (NULLs are never equal in SQL).
 */
function cacheLevel(sourceName: string, level: string): string {
    return sourceName === "perplexity" ? level : "all";
}

async function getCached(
    subject_id: string,
    source_name: string,
    level: string
): Promise<SourceEntry | null> {
    const admin = getAdmin();
    const { data } = await admin
        .from("source_cache")
        .select("content, source_urls, fetched_at")
        .eq("subject_id", subject_id)
        .eq("source_name", source_name)
        .eq("level", level)
        .maybeSingle();

    if (!data) return null;
    const ageInDays =
        (Date.now() - new Date(data.fetched_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > CACHE_TTL_DAYS) return null;
    return { content: data.content, urls: data.source_urls };
}

async function saveCache(
    subject_id: string,
    source_name: string,
    level: string,
    content: string,
    source_urls: string[]
): Promise<void> {
    const admin = getAdmin();
    await admin.from("source_cache").upsert(
        {
            subject_id,
            source_name,
            level,
            content,
            source_urls,
            fetched_at: new Date().toISOString(),
        },
        { onConflict: "subject_id,source_name,level" }
    );
}

// ─── runResearch ──────────────────────────────────────────────────────────────
/**
 * Fetches research from all relevant sources for a subject + level.
 * Checks the source_cache first (30 day TTL).
 * Returns only sources that returned content — never empty entries.
 */
export async function runResearch(
    subject_id: string,
    level: string,
    force_refresh = false
): Promise<ResearchResult> {
    const admin = getAdmin();

    const { data: subject, error } = await admin
        .from("subjects")
        .select("id, label, category")
        .eq("id", subject_id)
        .single();

    if (error || !subject) throw new Error(`Subject not found: ${subject_id}`);

    // Determine which sources to use for this category
    const rawSources: string[] = CATEGORY_SOURCES[subject.category] || CATEGORY_SOURCES["core"];

    // Skip Perplexity if no API key — graceful degradation to free sources only
    const hasPerplex = !!process.env.PERPLEXITY_API_KEY;
    const activeSources = rawSources.filter((s) => s !== "perplexity" || hasPerplex);

    const results: ResearchSources = {};

    await Promise.all(
        activeSources.map(async (source) => {
            const lvlKey = cacheLevel(source, level);

            // Try cache first
            if (!force_refresh) {
                const cached = await getCached(subject_id, source, lvlKey);
                if (cached && cached.content) {
                    results[source] = cached;
                    return;
                }
            }

            // Fetch fresh
            let fetched: SourceEntry = { content: "", urls: [] };
            try {
                switch (source) {
                    case "wikipedia":
                        fetched = await fetchWikipedia(subject.label);
                        break;
                    case "perplexity":
                        fetched = await fetchPerplexity(subject.label, level);
                        break;
                    case "openstax":
                        fetched = await fetchOpenStax(subject.label);
                        break;
                    case "khan":
                        fetched = await fetchKhanAcademy(subject.label);
                        break;
                    case "gutenberg":
                        fetched = await fetchGutenberg(subject.label);
                        break;
                    case "pubmed":
                        fetched = await fetchPubMed(subject.label);
                        break;
                }
            } catch (err) {
                console.warn(`[pipeline] ${source} fetch failed for "${subject.label}":`, err);
            }

            // Cache whatever we got (even empty, so we don't retry constantly)
            if (fetched.content) {
                await saveCache(subject_id, source, lvlKey, fetched.content, fetched.urls);
            }

            results[source] = fetched;
        })
    );

    return { subject, sources: results };
}

// ─── Grade context for age-appropriate depth ─────────────────────────────────
const GRADE_CONTEXT: Record<number, { age: string; desc: string }> = {
    1:  { age: "6–7",   desc: "Brand new to this subject. Use only concrete, tangible examples they can see or touch. Very short sentences. No jargon whatsoever." },
    2:  { age: "7–8",   desc: "Building on Grade 1. Slightly more detail. Still concrete. Can name things and describe what they do. Two or three new vocabulary words are fine." },
    3:  { age: "8–9",   desc: "Starting to categorise and compare. Can follow simple cause-and-effect. Introduce subject vocabulary with clear definitions." },
    4:  { age: "9–10",  desc: "Beginning to think in systems. Can understand how parts relate to a whole. More technical vocabulary with explanations." },
    5:  { age: "10–11", desc: "Can handle longer explanations. Understands process and sequence. Draw connections between this subject and everyday life." },
    6:  { age: "11–12", desc: "Pre-teen. Can think abstractly. Interested in how things connect. More analytical. Can handle nuance and multiple perspectives." },
    7:  { age: "12–13", desc: "Teen. Can hold complex ideas. Interested in history, debate, and real-world relevance. Not everything is black-and-white." },
    8:  { age: "13–14", desc: "More opinionated. Can evaluate arguments. Wants to understand both sides of an issue. Include some evidence-based reasoning." },
    9:  { age: "14–15", desc: "Can synthesise ideas from multiple angles. Starting to develop a personal framework. Thinks critically about what they are told." },
    10: { age: "15–16", desc: "Near-adult reasoning. Can read original sources. Handles nuance and uncertainty. Can discuss complexity without a simple answer." },
    11: { age: "16–17", desc: "Advanced analytical thinking. Can critique and compare frameworks. Makes independent arguments backed by evidence." },
    12: { age: "17–18", desc: "Pre-university level. Synthesises across subjects. Argues with evidence. Challenges assumptions. Discusses unresolved debates." },
};

function gradeNumFromLevel(level: string): number | null {
    const m = level.match(/^grade_(\d+)$/);
    return m ? parseInt(m[1], 10) : null;
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the lesson writer for How To Be Human — a platform that teaches every essential human subject with honesty, clarity, and genuine care.

Your job is to take research provided to you and turn it into a complete, structured lesson that feels like a brilliant, patient teacher explaining something for the first time.

VOICE:
- Plain and honest. Never patronising. Never academic for its own sake.
- Warm but not soft. Direct but not cold.
- Write as if you are talking to an intelligent person at exactly the right age and level. Respect them.

TRUTH:
- Only state what the research provided to you supports.
- If something is debated or uncertain, say so clearly.
- Never invent facts. Never speculate without labelling it as such.
- If the research is insufficient to write a full lesson, say so rather than filling gaps with guesswork.

STRUCTURE — every lesson must contain exactly these sections:

## What This Is
One paragraph. Plain explanation of the topic. Why it matters.

## The Core Explanation
The actual teaching. Thorough, clear, well-organised.
Use sub-headings if the topic has distinct parts.

## Key Concepts
A list of the most important terms or ideas, each with a one-sentence definition in plain language.

## Practical Activity
One concrete thing the learner can do today to practise or experience this subject in real life. Not homework. Real life.

## Check Your Understanding
Three questions. Not trick questions. Questions that reveal whether the learner genuinely understood the core ideas.
Include the answers below each question.

## Sources Used
List every source provided to you that you drew from.
Format: Source name — URL or reference

Do not add any sections not listed above.
Do not use marketing language.
Do not say 'Great question' or any filler phrase.
Begin directly with the lesson content.`;

// ─── runGenerate ──────────────────────────────────────────────────────────────
const MODEL = "claude-sonnet-4-6";

/**
 * Sends research to Claude and returns a fully structured lesson.
 */
export async function runGenerate(
    subject_id: string,
    level: string,
    research: ResearchResult
): Promise<GenerateResult> {
    const admin = getAdmin();
    const client = getAnthropic();

    // Get full subject description
    const { data: subject } = await admin
        .from("subjects")
        .select("label, description")
        .eq("id", subject_id)
        .single();

    // Get connected subjects for contextual references
    const { data: connections } = await admin
        .from("connections")
        .select("subject_a, subject_b")
        .or(`subject_a.eq.${subject_id},subject_b.eq.${subject_id}`);

    const connectedIds = (connections || []).map((c: any) =>
        c.subject_a === subject_id ? c.subject_b : c.subject_a
    );

    const { data: connectedSubjects } = connectedIds.length
        ? await admin.from("subjects").select("label").in("id", connectedIds)
        : { data: [] };

    const connectedLabels = (connectedSubjects || [])
        .map((s: any) => s.label)
        .join(", ");

    const src = research.sources;

    // Grade-aware context
    const gradeNum = gradeNumFromLevel(level);
    const gradeCtx = gradeNum ? GRADE_CONTEXT[gradeNum] : null;
    const learnerContext = gradeCtx
        ? `This is a Grade ${gradeNum} lesson (Age ${gradeCtx.age}). ${gradeCtx.desc}`
        : `This is a ${level} level lesson. Calibrate depth accordingly.`;

    // Build the dynamic user prompt from all research sources
    const userPrompt = `Generate a lesson for the subject: ${research.subject.label}
Level: ${level}

LEARNER CONTEXT:
${learnerContext}

Subject description: ${subject?.description || "No description available."}

Connected subjects (mention connections where natural, do not force them):
${connectedLabels || "None listed"}

--- RESEARCH FROM PERPLEXITY ---
${src.perplexity?.content || "Not available (Perplexity API not configured)."}

Sources from Perplexity:
${(src.perplexity?.urls || []).join("\n") || "No URLs"}

--- WIKIPEDIA SUMMARY ---
${src.wikipedia?.content || "No Wikipedia summary available."}

--- OPENSTAX EXCERPT (if available) ---
${src.openstax?.content || "Not available for this subject."}

--- ADDITIONAL SOURCE MATERIAL ---
Khan Academy: ${src.khan?.content || "Not available."}
Project Gutenberg: ${src.gutenberg?.content || "Not available."}
PubMed: ${src.pubmed?.content || "Not available."}
MIT OCW: ${src.mit?.content || "Not available."}

Using the research above as your factual foundation, write the lesson.
Do not go beyond what the research supports.
Calibrate vocabulary, depth, and examples to the learner context described above.`;

    const message = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        temperature: 0.3 as any,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
    });

    const content = (message.content[0] as any).text;

    // Collect all source URLs from all sources
    const allSourceUrls: string[] = [];
    Object.values(src).forEach((s) => {
        if (s?.urls?.length) allSourceUrls.push(...s.urls);
    });

    return {
        content,
        sources: allSourceUrls,
        generation_model: MODEL,
        generated_at: new Date().toISOString(),
    };
}
