/**
 * seed_lessons.js
 * Creates 3 lesson stubs (beginner, intermediate, advanced) for every subject
 * that doesn't have lessons yet. Run once with: node scripts/seed_lessons.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LEVELS = [
    { level: "beginner", order_index: 1, label: "Introduction" },
    { level: "intermediate", order_index: 2, label: "Going Deeper" },
    { level: "advanced", order_index: 3, label: "Mastery" },
];

async function seedLessons() {
    console.log("Fetching all subjects...");
    const { data: subjects, error: subjectError } = await supabase
        .from("subjects")
        .select("id, label")
        .order("label");

    if (subjectError) {
        console.error("Error fetching subjects:", subjectError.message);
        process.exit(1);
    }

    console.log(`Found ${subjects.length} subjects. Checking existing lessons...`);

    const { data: existingLessons } = await supabase
        .from("lessons")
        .select("subject_id, level");

    // Build a set of "subject_id:level" that already exist
    const existing = new Set(
        (existingLessons || []).map((l) => `${l.subject_id}:${l.level}`)
    );

    const toInsert = [];
    for (const subject of subjects) {
        for (const { level, order_index, label } of LEVELS) {
            const key = `${subject.id}:${level}`;
            if (!existing.has(key)) {
                toInsert.push({
                    subject_id: subject.id,
                    title: `${subject.label} — ${label}`,
                    level,
                    order_index,
                    content: "",
                    is_published: false,
                    is_preview: false,
                    sources: [],
                });
            }
        }
    }

    if (toInsert.length === 0) {
        console.log("✓ All subjects already have lesson stubs. Nothing to insert.");
        return;
    }

    console.log(`Inserting ${toInsert.length} lesson stubs...`);

    // Insert in batches of 50
    const BATCH = 50;
    for (let i = 0; i < toInsert.length; i += BATCH) {
        const batch = toInsert.slice(i, i + BATCH);
        const { error } = await supabase.from("lessons").insert(batch);
        if (error) {
            console.error(`Batch ${i / BATCH + 1} error:`, error.message);
        } else {
            console.log(`✓ Batch ${i / BATCH + 1} of ${Math.ceil(toInsert.length / BATCH)} inserted`);
        }
    }

    console.log(`\n✅ Done! ${toInsert.length} lesson stubs created.`);
    console.log("Open the Gateway → any subject → any lesson → hit ⚡ Generate Lesson.");
}

seedLessons().catch(console.error);
