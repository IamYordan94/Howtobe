/**
 * design-curriculum.js
 *
 * Designs the full Grade 1–12 curriculum for all 50 subjects.
 * Uses Claude Haiku (fast, cheap) to plan what each grade covers per subject.
 * Saves the plan to scripts/curriculum-map.json.
 *
 * Run ONCE before generate-all-lessons.js.
 *
 * Usage:
 *   node scripts/design-curriculum.js
 *
 * Safe to re-run — skips subjects already in curriculum-map.json.
 */

require('dotenv').config({ path: '.env.local' });

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const OUTPUT_FILE = path.join(__dirname, 'curriculum-map.json');
const DELAY_MS = 600; // delay between API calls to be rate-limit safe

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Grade context descriptions ───────────────────────────────────────────────
const GRADE_CONTEXT = {
    1:  'Age 6–7. Brand new to the subject. Totally concrete, sensory, simple. Short words. Real things they can touch or see.',
    2:  'Age 7–8. Building on Grade 1. Slightly more detail. Still very concrete. Can name things and describe what they do.',
    3:  'Age 8–9. Starting to categorise and compare. Can follow simple cause and effect. Introduced to subject vocabulary.',
    4:  'Age 9–10. Beginning to think in systems. Can understand how parts relate to a whole. More technical vocabulary.',
    5:  'Age 10–11. Can handle longer explanations. Understands process and sequence. Starting to ask "why" meaningfully.',
    6:  'Age 11–12. Pre-teen. Can think abstractly. Interested in how things connect across subjects. More analytical.',
    7:  'Age 12–13. Teen. Can hold complex ideas. Interested in history, debate, and real-world relevance.',
    8:  'Age 13–14. More opinionated. Can evaluate arguments. Wants to understand both sides of an issue.',
    9:  'Age 14–15. Can synthesise ideas from multiple lessons. Starting to develop a personal framework.',
    10: 'Age 15–16. Near-adult reasoning. Can read and interpret original sources. Handles nuance.',
    11: 'Age 16–17. Advanced analytical thinking. Can critique, compare frameworks, make independent arguments.',
    12: 'Age 17–18. Pre-university level. Can conduct research, synthesise across subjects, argue with evidence.',
};

// ─── Build the prompt for a grade range ──────────────────────────────────────
function buildPrompt(subjectLabel, category, startGrade, endGrade) {
    const gradeContextBlock = Object.entries(GRADE_CONTEXT)
        .filter(([g]) => parseInt(g) >= startGrade && parseInt(g) <= endGrade)
        .map(([g, ctx]) => `Grade ${g}: ${ctx}`)
        .join('\n');

    const gradeRange = startGrade === endGrade
        ? `Grade ${startGrade}`
        : `Grades ${startGrade} through ${endGrade}`;

    return `You are designing part of the Grade 1–12 school curriculum for the subject: "${subjectLabel}" (Category: ${category}).

This follows the model of a real school: every year students return to ${subjectLabel} and learn something new, going progressively deeper. Each grade builds on the previous one — it never repeats content, it always advances.

Grade context for the grades you are designing:
${gradeContextBlock}

For each grade (${gradeRange}), provide:
- "focus": one sentence describing what this grade covers — the big idea of that year
- "lessons": 3 to 4 specific lesson titles for that grade

Rules for lesson titles:
- Specific and focused, not vague (e.g. "How Photosynthesis Works" not "Plants")
- Never start with "Introduction to", "Overview of", or "Understanding"
- Should feel like a real lesson a student would actually attend
- Each lesson within a grade should cover a distinct, connected aspect of that grade's focus
- Titles should get more complex and analytical as grades increase

Return ONLY valid JSON — no explanation, no markdown, no code fences. Example format:
{
  "grade_${startGrade}": {
    "focus": "one sentence describing this grade's big idea",
    "lessons": [
      { "title": "Specific Lesson Title", "brief": "one sentence on what this lesson covers" }
    ]
  }
}`;
}

// ─── Call Claude for a grade range, parse result ──────────────────────────────
async function callClaude(prompt) {
    const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();

    // Strip markdown code fences if present
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    // Extract the outermost JSON object
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in response');

    return JSON.parse(match[0]);
}

// ─── Design curriculum for one subject (split into two batches) ───────────────
async function designSubjectCurriculum(subjectLabel, category) {
    // Split into two halves to stay well within token limits
    const [half1, half2] = await Promise.all([
        callClaude(buildPrompt(subjectLabel, category, 1, 6)),
        callClaude(buildPrompt(subjectLabel, category, 7, 12)),
    ]);

    return { ...half1, ...half2 };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  How To Be Human — Curriculum Designer                  ║');
    console.log('║  Designing Grade 1–12 plan for all 50 subjects          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('❌  ANTHROPIC_API_KEY not set in .env.local');
        process.exit(1);
    }

    // Load existing map (allows resuming if interrupted)
    let curriculumMap = {};
    if (fs.existsSync(OUTPUT_FILE)) {
        curriculumMap = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        const done = Object.keys(curriculumMap).length;
        console.log(`  Resuming — ${done} subject(s) already designed.\n`);
    }

    // Fetch all subjects
    const { data: subjects, error } = await supabase
        .from('subjects')
        .select('id, label, category')
        .order('label');

    if (error) {
        console.error('❌  Supabase error:', error.message);
        process.exit(1);
    }

    console.log(`  Designing curriculum for ${subjects.length} subjects...\n`);

    let designed = 0;
    let skipped = 0;
    let failed = 0;

    for (const subject of subjects) {
        if (curriculumMap[subject.id]) {
            process.stdout.write(`  ✓  ${subject.label.padEnd(28)} (already done)\n`);
            skipped++;
            continue;
        }

        process.stdout.write(`  ⋯  ${subject.label.padEnd(28)} designing...`);

        try {
            const grades = await designSubjectCurriculum(subject.label, subject.category);

            // Count total lessons planned
            const lessonCount = Object.values(grades).reduce(
                (sum, g) => sum + (g.lessons || []).length,
                0
            );

            curriculumMap[subject.id] = {
                label: subject.label,
                category: subject.category,
                grades,
            };

            // Save after every subject (safe to interrupt)
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(curriculumMap, null, 2));

            process.stdout.write(` ✓  (${lessonCount} lessons planned)\n`);
            designed++;
        } catch (err) {
            process.stdout.write(` ✗  ERROR: ${err.message}\n`);
            failed++;
        }

        await sleep(DELAY_MS);
    }

    // ── Summary ──
    let totalLessons = 0;
    for (const subject of Object.values(curriculumMap)) {
        for (const grade of Object.values(subject.grades || {})) {
            totalLessons += (grade.lessons || []).length;
        }
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  Curriculum Design Complete                             ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`  Designed:       ${designed} subjects`);
    console.log(`  Skipped:        ${skipped} subjects (already done)`);
    console.log(`  Failed:         ${failed} subjects`);
    console.log(`  Total lessons:  ${totalLessons}`);
    console.log(`  Saved to:       ${OUTPUT_FILE}`);
    console.log('');
    console.log('  Next step: node scripts/generate-all-lessons.js');
    console.log('');
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
