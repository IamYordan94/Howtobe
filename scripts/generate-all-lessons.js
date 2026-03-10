/**
 * generate-all-lessons.js
 *
 * Reads scripts/curriculum-map.json (output of design-curriculum.js),
 * then generates and saves every lesson to Supabase.
 *
 * Features:
 * - Safe to stop and restart — skips lessons that already exist in Supabase
 * - Grade-aware prompting (age-appropriate depth, vocabulary, and context)
 * - Wikipedia research per subject (fetched once, reused across all grades)
 * - Grade 1 lessons marked is_preview = true (visible to non-paying users)
 * - All lessons saved with level = "grade_X" and grade_num = X
 * - Concurrency: 2 lessons in parallel per subject (avoids rate limits)
 * - Delay between API calls is configurable via DELAY_MS
 *
 * Usage:
 *   node scripts/generate-all-lessons.js
 *
 * Run design-curriculum.js first if curriculum-map.json does not exist.
 */

require('dotenv').config({ path: '.env.local' });

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const CURRICULUM_FILE = path.join(__dirname, 'curriculum-map.json');
const DELAY_MS = 800;           // between lesson API calls within a subject
const SUBJECT_DELAY_MS = 1200;  // between subjects
const MAX_TOKENS = 4000;
const MODEL = 'claude-sonnet-4-6';

// ─── Clients ──────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Grade context (age-appropriate complexity guidance) ──────────────────────
const GRADE_CONTEXT = {
    1:  { age: '6–7',   desc: 'Brand new to this subject. Use only concrete, tangible examples they can see or touch. Very short sentences. No jargon whatsoever. Like explaining to a curious child who asks "but why?" a lot.' },
    2:  { age: '7–8',   desc: 'Building on Grade 1 knowledge. Slightly more detail. Still concrete. Can name things and describe what they do. Two or three new vocabulary words are fine.' },
    3:  { age: '8–9',   desc: 'Starting to categorise and compare. Can follow simple cause-and-effect. Introduce subject vocabulary with clear definitions. Use relatable real-life comparisons.' },
    4:  { age: '9–10',  desc: 'Beginning to think in systems. Can understand how parts relate to a whole. Use more technical vocabulary with explanations. Can handle slightly longer paragraphs.' },
    5:  { age: '10–11', desc: 'Can handle longer explanations. Understands process and sequence. Starting to ask "why" meaningfully. Draw connections between this subject and everyday life.' },
    6:  { age: '11–12', desc: 'Pre-teen. Can think abstractly. Interested in how things connect across subjects. More analytical. Can handle nuance and multiple perspectives.' },
    7:  { age: '12–13', desc: 'Teen. Can hold complex ideas. Interested in history, debate, and real-world relevance. Appreciate that things are not always black-and-white.' },
    8:  { age: '13–14', desc: 'More opinionated. Can evaluate arguments. Wants to understand both sides of an issue. Include some evidence-based reasoning and real examples.' },
    9:  { age: '14–15', desc: 'Can synthesise ideas from multiple angles. Starting to develop a personal framework. Expect them to think critically about what they are told.' },
    10: { age: '15–16', desc: 'Near-adult reasoning. Can read and interpret original sources. Handles nuance and uncertainty well. Can discuss complexity without needing a simple answer.' },
    11: { age: '16–17', desc: 'Advanced analytical thinking. Can critique and compare frameworks. Can make independent arguments backed by evidence. Treat them as near-adults.' },
    12: { age: '17–18', desc: 'Pre-university level. Can conduct research and synthesise across subjects. Argue with evidence. Challenge assumptions. Discuss unresolved debates in the field.' },
};

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the lesson writer for How To Be Human — a platform that teaches every essential human subject honestly, clearly, and with genuine care.

You are writing a SPECIFIC lesson within a structured Grade 1–12 curriculum. Each grade revisits this subject at a new level of depth.

TRUTH:
- Only state what is factually supported. Never invent facts.
- If something is debated or uncertain, say so clearly.
- If the research is insufficient, acknowledge the gap rather than filling it with guesswork.

VOICE:
- Plain, honest, warm. Never patronising. Never academic for its own sake.
- Write as if a brilliant teacher is explaining this exactly once. Make it worth listening to.
- Match the cognitive level of the grade you are writing for.

STRUCTURE — every lesson must contain exactly these sections in this order:

## What This Is
One or two paragraphs. Plain explanation of what this lesson covers and why it matters at this level.

## The Core Explanation
The actual teaching. Thorough, clear, well-organised for this grade's level.
Use sub-headings if the topic has distinct parts.

## Key Concepts
The most important terms or ideas, each with a one-sentence plain-language definition.

## Practical Activity
One concrete thing the learner can do today to practise this in real life. Must be genuinely doable, not hypothetical homework.

## Check Your Understanding
Three questions that reveal whether the learner genuinely understood the core ideas.
Include the answers below each question.

## Sources Used
List every source you drew from. Format: Source name — URL or "General reference"

Do not add sections not listed above.
Do not use marketing language or filler phrases.
Begin directly with the lesson content.`;

// ─── Wikipedia fetch ──────────────────────────────────────────────────────────
function fetchWikipedia(subjectLabel) {
    return new Promise((resolve) => {
        const title = encodeURIComponent(subjectLabel.replace(/ /g, '_'));
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;

        const req = https.get(url, { headers: { 'User-Agent': 'HowToBeHuman/1.0' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.extract || '';
                    const wikiUrl = parsed.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title}`;
                    resolve({ content: content.slice(0, 3000), url: wikiUrl });
                } catch {
                    resolve({ content: '', url: '' });
                }
            });
        });

        req.on('error', () => resolve({ content: '', url: '' }));
        req.setTimeout(8000, () => { req.destroy(); resolve({ content: '', url: '' }); });
    });
}

// ─── Generate one lesson ──────────────────────────────────────────────────────
async function generateLesson({ subjectLabel, gradeNum, gradeFocus, lessonTitle, lessonBrief, wikiContent, wikiUrl }) {
    const gradeCtx = GRADE_CONTEXT[gradeNum];

    const userPrompt = `Write a Grade ${gradeNum} lesson for the subject: "${subjectLabel}"

LESSON TITLE: ${lessonTitle}
LESSON BRIEF: ${lessonBrief}

THIS GRADE'S FOCUS: ${gradeFocus}

LEARNER CONTEXT (Grade ${gradeNum}, Age ${gradeCtx.age}):
${gradeCtx.desc}

--- WIKIPEDIA RESEARCH ---
${wikiContent || 'No Wikipedia content available. Use your knowledge of this topic carefully and note any uncertainty.'}

Wikipedia source URL: ${wikiUrl || 'https://en.wikipedia.org'}

---

Write the complete lesson for this specific title: "${lessonTitle}"
This lesson is one of several in Grade ${gradeNum} of ${subjectLabel} — it covers only what the title and brief describe.
Calibrate depth, vocabulary, and examples to the Grade ${gradeNum} learner profile above.`;

    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
    });

    return message.content[0].text;
}

// ─── Save lesson to Supabase ──────────────────────────────────────────────────
async function saveLesson({ subjectId, title, gradeNum, orderIndex, content, wikiUrl }) {
    const level = `grade_${gradeNum}`;

    const { error } = await supabase.from('lessons').insert({
        subject_id:       subjectId,
        title,
        level,
        grade_num:        gradeNum,
        order_index:      orderIndex,
        content,
        is_published:     true,
        is_preview:       gradeNum === 1,   // Grade 1 lessons are free previews
        sources:          wikiUrl ? [wikiUrl] : [],
        generation_model: MODEL,
        generated_at:     new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
}

// ─── Check which lessons already exist for a subject ─────────────────────────
async function getExistingTitles(subjectId) {
    const { data, error } = await supabase
        .from('lessons')
        .select('title, level')
        .eq('subject_id', subjectId);

    if (error) throw new Error(error.message);
    // Key: "grade_X::Title"
    const set = new Set();
    for (const row of data || []) {
        set.add(`${row.level}::${row.title}`);
    }
    return set;
}

// ─── Process one subject ──────────────────────────────────────────────────────
async function processSubject(subjectId, subjectData) {
    const { label, grades } = subjectData;

    // Check existing
    let existing;
    try {
        existing = await getExistingTitles(subjectId);
    } catch (err) {
        console.log(`  ✗  ${label} — could not fetch existing lessons: ${err.message}`);
        return { generated: 0, skipped: 0, failed: 1 };
    }

    // Fetch Wikipedia once per subject
    let wiki = { content: '', url: '' };
    try {
        wiki = await fetchWikipedia(label);
    } catch {
        // non-fatal — proceed without wiki
    }

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (let gradeNum = 1; gradeNum <= 12; gradeNum++) {
        const gradeKey = `grade_${gradeNum}`;
        const gradeData = grades[gradeKey];
        if (!gradeData || !gradeData.lessons) continue;

        for (let i = 0; i < gradeData.lessons.length; i++) {
            const lesson = gradeData.lessons[i];
            const existKey = `${gradeKey}::${lesson.title}`;

            if (existing.has(existKey)) {
                process.stdout.write(`    ✓  [G${gradeNum}] ${lesson.title.slice(0, 50)} (exists)\n`);
                skipped++;
                continue;
            }

            process.stdout.write(`    ⋯  [G${gradeNum}] ${lesson.title.slice(0, 50)}...`);

            try {
                const content = await generateLesson({
                    subjectLabel: label,
                    gradeNum,
                    gradeFocus: gradeData.focus,
                    lessonTitle: lesson.title,
                    lessonBrief: lesson.brief,
                    wikiContent: wiki.content,
                    wikiUrl: wiki.url,
                });

                await saveLesson({
                    subjectId,
                    title: lesson.title,
                    gradeNum,
                    orderIndex: i,
                    content,
                    wikiUrl: wiki.url,
                });

                process.stdout.write(` ✓  (${content.length} chars)\n`);
                generated++;
                existing.add(existKey); // prevent retry if same title appears twice
            } catch (err) {
                process.stdout.write(` ✗  ERROR: ${err.message}\n`);
                failed++;
            }

            await sleep(DELAY_MS);
        }
    }

    return { generated, skipped, failed };
}

// ─── Parse CLI args: --skip N --limit N ──────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    let skip = 0;
    let limit = Infinity;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--skip'  && args[i + 1]) { skip  = parseInt(args[i + 1]); i++; }
        if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[i + 1]); i++; }
    }
    return { skip, limit };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const { skip, limit } = parseArgs();

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  How To Be Human — Lesson Generator                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    // Validate environment
    const missing = [];
    if (!process.env.ANTHROPIC_API_KEY)          missing.push('ANTHROPIC_API_KEY');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL)    missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)   missing.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missing.length) {
        console.error(`❌  Missing environment variables: ${missing.join(', ')}`);
        console.error('    Make sure .env.local is present and correct.');
        process.exit(1);
    }

    // Load curriculum map
    if (!fs.existsSync(CURRICULUM_FILE)) {
        console.error(`❌  curriculum-map.json not found at: ${CURRICULUM_FILE}`);
        console.error('    Run node scripts/design-curriculum.js first.');
        process.exit(1);
    }

    const curriculumMap = JSON.parse(fs.readFileSync(CURRICULUM_FILE, 'utf8'));
    const allSubjects = Object.entries(curriculumMap);
    const subjects = allSubjects.slice(skip, skip + limit);

    console.log(`  Total subjects in map: ${allSubjects.length}`);
    if (skip > 0 || limit < Infinity) {
        console.log(`  This batch: subjects ${skip + 1}–${skip + subjects.length} (--skip ${skip} --limit ${limit === Infinity ? '∞' : limit})`);
    }
    console.log('');

    let totalGenerated = 0;
    let totalSkipped   = 0;
    let totalFailed    = 0;

    for (let si = 0; si < subjects.length; si++) {
        const [subjectId, subjectData] = subjects[si];
        const globalIndex = skip + si + 1;

        // Count planned lessons for this subject
        let planned = 0;
        for (let g = 1; g <= 12; g++) {
            const gd = subjectData.grades?.[`grade_${g}`];
            if (gd?.lessons) planned += gd.lessons.length;
        }

        console.log(`\n[${globalIndex}/${allSubjects.length}] ${subjectData.label}  (${planned} lessons planned)`);

        const { generated, skipped, failed } = await processSubject(subjectId, subjectData);
        totalGenerated += generated;
        totalSkipped   += skipped;
        totalFailed    += failed;

        console.log(`  → Generated: ${generated}  Skipped: ${skipped}  Failed: ${failed}`);

        if (si < subjects.length - 1) await sleep(SUBJECT_DELAY_MS);
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  Generation Complete                                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`  Generated:  ${totalGenerated} lessons`);
    console.log(`  Skipped:    ${totalSkipped}  lessons (already existed)`);
    console.log(`  Failed:     ${totalFailed}  lessons`);
    console.log('');
    console.log('  All Grade 1 lessons are marked is_preview = true (free to read).');
    console.log('  All other lessons require payment (is_published = true, is_preview = false).');
    console.log('');

    if (totalFailed > 0) {
        console.log('  ⚠️   Some lessons failed. Re-run this script to retry them.');
        console.log('      Already-generated lessons will be skipped automatically.');
        console.log('');
    }
}

main().catch((err) => {
    console.error('\nFatal error:', err);
    process.exit(1);
});
