"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GRADES = [1,2,3,4,5,6,7,8,9,10,11,12];

const GRADE_AGES: Record<number, string> = {
    1: "Age 6–7", 2: "Age 7–8",  3: "Age 8–9",  4: "Age 9–10",
    5: "Age 10–11", 6: "Age 11–12", 7: "Age 12–13", 8: "Age 13–14",
    9: "Age 14–15", 10: "Age 15–16", 11: "Age 16–17", 12: "Age 17–18",
};

export default function NewLessonPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [grade, setGrade] = useState(1);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async () => {
        setCreating(true);
        setError(null);

        const level = `grade_${grade}`;

        const res = await fetch("/api/admin/lessons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subject_id: params.id,
                level,
                grade_num: grade,
                order_index: grade,
            }),
        });
        const data = await res.json();

        if (!res.ok || data.error || !data.lesson) {
            setError(data.error || "Failed to create lesson");
            setCreating(false);
            return;
        }

        router.push(`/admin/subjects/${params.id}/lessons/${data.lesson.id}`);
    };

    return (
        <div>
            <div className="text-[var(--muted)] text-sm mb-6">
                <a href={`/admin/subjects/${params.id}`} className="hover:text-white transition-colors">
                    ← Back to Subject
                </a>
            </div>
            <h1 className="font-serif text-3xl mb-2">New Lesson</h1>
            <p className="text-[var(--muted)] text-sm mb-8">
                Pick a grade and create. The title and content will be generated automatically by the pipeline.
            </p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 mb-6 rounded">
                    {error}
                </div>
            )}

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-6 max-w-md">
                <label className="text-xs uppercase tracking-widest text-[var(--muted)] block mb-4">Grade</label>

                <div className="grid grid-cols-4 gap-2 mb-6">
                    {GRADES.map((g) => (
                        <button
                            key={g}
                            onClick={() => setGrade(g)}
                            className={`py-2.5 text-sm rounded border transition-colors flex flex-col items-center gap-0.5 ${
                                grade === g
                                    ? "bg-white text-black border-white font-medium"
                                    : "border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[#444]"
                            }`}
                        >
                            <span>{g}</span>
                            <span className="text-[0.55rem] opacity-60">{GRADE_AGES[g]?.replace("Age ", "")}</span>
                        </button>
                    ))}
                </div>

                <div className="text-[0.7rem] text-[var(--muted)] mb-5 px-1">
                    Grade {grade} — {GRADE_AGES[grade]}
                </div>

                <button
                    onClick={create}
                    disabled={creating}
                    className="w-full py-2.5 bg-[#c47fff] text-black font-medium text-sm rounded hover:bg-[#d48fff] transition-colors disabled:opacity-50"
                >
                    {creating ? "Creating..." : "⚡ Create & Open Editor"}
                </button>
            </div>
        </div>
    );
}
