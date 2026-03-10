/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { categories } from "@/lib/curriculum-data";

type Subject = {
    id: string;
    label: string;
    category: string;
    description: string;
    is_published: boolean;
    coming_soon: boolean;
};

type Lesson = {
    id: string;
    title: string;
    level: string;
    order_index: number;
    is_published: boolean;
    is_preview: boolean;
};

export default function SubjectEditorClient({ subject, lessons }: { subject: Subject; lessons: Lesson[] }) {
    const [form, setForm] = useState(subject);
    const [saving, setSaving] = useState(false);
    const [draftingDesc, setDraftingDesc] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const catInfo = categories[subject.category] || { label: subject.category, color: "#888" };

    const save = async () => {
        setSaving(true);
        setMessage(null);
        const { error } = await supabase
            .from("subjects")
            .update({
                description: form.description,
                is_published: form.is_published,
                coming_soon: form.coming_soon,
            })
            .eq("id", subject.id);
        if (error) setMessage("Error: " + error.message);
        else setMessage("Saved!");
        setSaving(false);
    };

    const draftDescription = async () => {
        setDraftingDesc(true);
        setMessage(null);
        try {
            const res = await fetch("/api/ai/draft-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subjectLabel: subject.label, category: catInfo.label }),
            });
            const data = await res.json();
            if (data.description) {
                setForm((f) => ({ ...f, description: data.description }));
            } else {
                setMessage("AI draft failed: " + (data.error || "unknown error"));
            }
        } catch (e: any) {
            setMessage("Error: " + e.message);
        }
        setDraftingDesc(false);
    };

    const isGradeModel = lessons.some((l) => l.level?.startsWith("grade_"));
    const gradeOrder = isGradeModel
        ? ["grade_1","grade_2","grade_3","grade_4","grade_5","grade_6",
           "grade_7","grade_8","grade_9","grade_10","grade_11","grade_12"]
        : ["beginner","intermediate","advanced"];
    const gradeLabel = (level: string) => {
        const m = level.match(/^grade_(\d+)$/);
        return m ? `Grade ${m[1]}` : level.charAt(0).toUpperCase() + level.slice(1);
    };
    const grouped = lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
        if (!acc[l.level]) acc[l.level] = [];
        acc[l.level].push(l);
        return acc;
    }, {});

    return (
        <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="w-3 h-3 rounded-full" style={{ background: catInfo.color }} />
                <span className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)]">{catInfo.label}</span>
            </div>
            <h1 className="font-serif text-4xl mb-8" style={{ color: catInfo.color }}>{subject.label}</h1>

            {/* Subject settings */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-6 mb-8">
                <h2 className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)] mb-5 pb-3 border-b border-[var(--border)]">
                    Subject Settings
                </h2>

                <div className="flex gap-6 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_published}
                            onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked, coming_soon: e.target.checked ? false : f.coming_soon }))}
                            className="accent-[#7ed957]"
                        />
                        <span className="text-sm">Published</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.coming_soon}
                            onChange={(e) => setForm(f => ({ ...f, coming_soon: e.target.checked }))}
                            className="accent-[#f0a500]"
                        />
                        <span className="text-sm">Coming Soon</span>
                    </label>
                </div>

                <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Description</label>
                        <button
                            onClick={draftDescription}
                            disabled={draftingDesc}
                            className="text-[0.65rem] uppercase tracking-widest px-3 py-1.5 border border-[#c47fff]/40 text-[#c47fff] rounded hover:bg-[#c47fff]/10 transition-colors disabled:opacity-50"
                        >
                            {draftingDesc ? "AI Drafting..." : "✦ AI Draft"}
                        </button>
                    </div>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={4}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#444] transition-colors resize-none"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={save}
                        disabled={saving}
                        className="px-5 py-2 bg-white text-black font-medium text-sm rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                    {message && (
                        <span className={`text-sm ${message.startsWith("Error") ? "text-red-400" : "text-[#7ed957]"}`}>
                            {message}
                        </span>
                    )}
                </div>
            </div>

            {/* Lessons */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-6">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border)]">
                    <h2 className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)]">Lessons</h2>
                    <a
                        href={`/admin/subjects/${subject.id}/lessons/new`}
                        className="text-[0.65rem] uppercase tracking-widest px-3 py-1.5 border border-[#3ecfcf]/40 text-[#3ecfcf] rounded hover:bg-[#3ecfcf]/10 transition-colors"
                    >
                        + New Lesson
                    </a>
                </div>

                {lessons.length === 0 ? (
                    <p className="text-[var(--muted)] text-sm italic">No lessons yet for this subject.</p>
                ) : (
                    gradeOrder.map((level) => {
                        const lvlLessons = grouped[level];
                        if (!lvlLessons || lvlLessons.length === 0) return null;
                        return (
                            <div key={level} className="mb-6">
                                <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-3">{gradeLabel(level)}</div>
                                <div className="space-y-2">
                                    {lvlLessons
                                        .sort((a, b) => a.order_index - b.order_index)
                                        .map((l) => (
                                            <a
                                                key={l.id}
                                                href={`/admin/subjects/${subject.id}/lessons/${l.id}`}
                                                className="flex justify-between items-center p-3 bg-[var(--bg)] border border-[var(--border)] rounded hover:border-[#444] transition-colors group"
                                            >
                                                <span className="text-sm group-hover:text-white transition-colors">{l.title}</span>
                                                <div className="flex items-center gap-2">
                                                    {l.is_preview && (
                                                        <span className="text-[0.6rem] px-1.5 py-0.5 bg-[#5cb8ff]/10 text-[#5cb8ff] border border-[#5cb8ff]/20 rounded">Preview</span>
                                                    )}
                                                    {l.is_published ? (
                                                        <span className="text-[0.6rem] px-1.5 py-0.5 bg-[#7ed957]/10 text-[#7ed957] border border-[#7ed957]/20 rounded">Live</span>
                                                    ) : (
                                                        <span className="text-[0.6rem] px-1.5 py-0.5 bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] rounded">Draft</span>
                                                    )}
                                                </div>
                                            </a>
                                        ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
