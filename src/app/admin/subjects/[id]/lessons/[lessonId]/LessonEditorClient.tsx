/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Lesson = {
    id: string;
    subject_id: string;
    title: string;
    level: string;
    grade_num: number | null;
    order_index: number;
    content: string;
    is_published: boolean;
    is_preview: boolean;
    sources: string[];
    last_verified_at: string | null;
    generated_at: string | null;
    generation_model: string | null;
};

type PipelineStep = {
    label: string;
    key: string;
    done: boolean;
    active: boolean;
};

type ResearchSources = {
    perplexity?: { content: string; urls: string[] };
    wikipedia?: { content: string; urls: string[] };
    openstax?: { content: string; urls: string[] };
    khan?: { content: string; urls: string[] };
    gutenberg?: { content: string; urls: string[] };
    pubmed?: { content: string; urls: string[] };
    mit?: { content: string; urls: string[] };
};

export default function LessonEditorClient({
    lesson,
    subjectLabel,
    subjectId,
}: {
    lesson: Lesson;
    subjectLabel: string;
    subjectId: string;
}) {
    const router = useRouter();
    const [form, setForm] = useState(lesson);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Pipeline state
    const [pipelineLevel, setPipelineLevel] = useState(lesson.level || "grade_1");
    const [generating, setGenerating] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
    const [showSources, setShowSources] = useState(false);
    const [researchSources, setResearchSources] = useState<ResearchSources | null>(null);


    // Title suggestion state (set automatically during pipeline)
    const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);


    const defaultSteps = (): PipelineStep[] => [
        { label: "Searching Perplexity...", key: "perplexity", done: false, active: false },
        { label: "Fetching Wikipedia...", key: "wikipedia", done: false, active: false },
        { label: "Fetching Educational Sources...", key: "openstax", done: false, active: false },
        { label: "Claude is writing...", key: "claude", done: false, active: false },
    ];

    const runPipeline = async (forceRefresh = false) => {
        if (forceRefresh) setRegenerating(true);
        else setGenerating(true);
        setMessage(null);
        setShowSources(false);

        const steps = defaultSteps();
        steps[0].active = true;
        setPipelineSteps([...steps]);

        try {
            const endpoint = forceRefresh ? "/api/pipeline/regenerate" : "/api/pipeline/draft";

            // Start both calls in parallel — title suggestion + lesson generation
            const apiCallPromise = fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject_id: subjectId, level: pipelineLevel }),
            });

            const titlePromise = fetch("/api/pipeline/suggest-titles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject_id: subjectId, level: pipelineLevel }),
            }).then((r) => r.json()).catch(() => ({ titles: [] }));

            // Animate steps while waiting
            await new Promise((resolve) => setTimeout(resolve, 1500));
            steps[0].done = true; steps[0].active = false;
            steps[1].active = true;
            setPipelineSteps([...steps]);

            await new Promise((resolve) => setTimeout(resolve, 1200));
            steps[1].done = true; steps[1].active = false;
            steps[2].active = true;
            setPipelineSteps([...steps]);

            await new Promise((resolve) => setTimeout(resolve, 1000));
            steps[2].done = true; steps[2].active = false;
            steps[3].active = true;
            setPipelineSteps([...steps]);

            // Wait for the real API call
            const res = await apiCallPromise;
            const data = await res.json();

            steps[3].done = true; steps[3].active = false;
            setPipelineSteps([...steps]);

            if (!res.ok || data.error) {
                setMessage("Pipeline error: " + (data.error || "unknown"));
                return;
            }

            // Auto-apply title if current one is still a placeholder
            const titleData = await titlePromise;
            const firstTitle = titleData.titles?.[0];
            const isPlaceholder = /—|Introduction|Going Deeper|Mastery|Draft/i.test(form.title);

            // Insert the generated content + auto title into the editor
            setForm((f) => ({
                ...f,
                title: (firstTitle && (isPlaceholder || !f.title.trim())) ? firstTitle : f.title,
                content: data.content,
                sources: data.sources || [],
                generated_at: data.generated_at,
                generation_model: data.generation_model,
            }));
            setSuggestedTitles([]);
            setResearchSources(data.research_sources || null);
            setShowSources(true);
            setMessage("Lesson generated! Review, edit, and save when ready.");
        } catch (e: any) {
            setMessage("Error: " + e.message);
        } finally {
            setGenerating(false);
            setRegenerating(false);
        }
    };

    const save = async () => {
        setSaving(true);
        setMessage(null);
        // Derive grade_num from level string
        const gradeMatch = form.level.match(/^grade_(\d+)$/);
        const grade_num = gradeMatch ? parseInt(gradeMatch[1]) : null;

        const { error } = await supabase
            .from("lessons")
            .update({
                title: form.title,
                level: form.level,
                grade_num,
                order_index: form.order_index,
                content: form.content,
                is_published: form.is_published,
                is_preview: form.is_preview,
                sources: form.sources || [],
                generated_at: form.generated_at,
                generation_model: form.generation_model,
            })
            .eq("id", lesson.id);
        setSaving(false);
        if (error) setMessage("Error: " + error.message);
        else setMessage("Saved!");
    };

    const markVerified = async () => {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from("lessons")
            .update({ last_verified_at: now })
            .eq("id", lesson.id);
        if (!error) {
            setForm((f) => ({ ...f, last_verified_at: now }));
            setMessage("Marked as verified!");
        }
    };

    const deleteLesson = async () => {
        if (!confirm("Delete this lesson? This cannot be undone.")) return;
        await supabase.from("lessons").delete().eq("id", lesson.id);
        router.push(`/admin/subjects/${subjectId}`);
    };

    const needsReview = form.last_verified_at
        ? (Date.now() - new Date(form.last_verified_at).getTime()) > 1000 * 60 * 60 * 24 * 180
        : false;

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Never";

    const isRunning = generating || regenerating;

    return (
        <div>
            {/* Breadcrumb */}
            <div className="text-[var(--muted)] text-sm mb-6">
                <a href={`/admin/subjects/${subjectId}`} className="hover:text-white transition-colors">
                    ← {subjectLabel}
                </a>
            </div>
            <h1 className="font-serif text-3xl mb-8">Edit Lesson</h1>

            {/* Meta + Generate Panel */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-6 mb-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Title</label>
                            <span className="text-[0.65rem] text-[var(--muted)]">Auto-filled when you Generate</span>
                        </div>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#444]"
                            placeholder="Auto-filled when you click Generate Lesson"
                        />
                        {/* Suggested title chips — still shown if manually triggered */}
                        {suggestedTitles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {suggestedTitles.map((t, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setForm((f) => ({ ...f, title: t }));
                                            setSuggestedTitles([]);
                                        }}
                                        className="text-[0.68rem] px-3 py-1.5 rounded-full border border-[#c47fff]/30 text-[#c47fff] hover:bg-[#c47fff]/10 hover:border-[#c47fff]/60 transition-all"
                                    >
                                        {t}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSuggestedTitles([])}
                                    className="text-[0.65rem] text-[var(--muted)] hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)] block mb-2">Grade</label>
                        <select
                            value={form.level}
                            onChange={(e) => {
                                const val = e.target.value;
                                const m = val.match(/^grade_(\d+)$/);
                                setForm((f) => ({ ...f, level: val, ...( m ? { grade_num: parseInt(m[1]) } : {}) }));
                            }}
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none"
                        >
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map((g) => (
                                <option key={g} value={`grade_${g}`}>Grade {g}</option>
                            ))}
                            <option value="beginner">Beginner (legacy)</option>
                            <option value="intermediate">Intermediate (legacy)</option>
                            <option value="advanced">Advanced (legacy)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div>
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)] block mb-2">Order</label>
                        <input
                            type="number"
                            value={form.order_index}
                            onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-3 justify-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_published}
                                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                                className="accent-[#7ed957]"
                            />
                            <span className="text-sm">Published</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_preview}
                                onChange={(e) => setForm((f) => ({ ...f, is_preview: e.target.checked }))}
                                className="accent-[#5cb8ff]"
                            />
                            <span className="text-sm">Free Preview</span>
                        </label>
                    </div>
                    <div className="flex flex-col gap-1 justify-end pb-1 text-[0.7rem] text-[var(--muted)]">
                        <div>Generated: {formatDate(form.generated_at)}</div>
                        <div>Verified: {formatDate(form.last_verified_at)}</div>
                        {form.generation_model && <div className="text-[0.6rem]">{form.generation_model}</div>}
                        {needsReview && (
                            <span className="text-[0.6rem] px-2 py-0.5 bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/20 rounded w-fit">
                                Needs Review
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ⚡ Generate Lesson Panel */}
            <div className="bg-[var(--surface)] border border-[#c47fff]/30 rounded p-6 mb-5">
                <h2 className="text-[0.7rem] uppercase tracking-widest text-[#c47fff] mb-5 pb-3 border-b border-[#c47fff]/20">
                    ⚡ Generate Lesson Pipeline
                </h2>

                <div className="flex flex-wrap items-center gap-3 mb-5">
                    <select
                        value={pipelineLevel}
                        onChange={(e) => setPipelineLevel(e.target.value)}
                        disabled={isRunning}
                        className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none"
                    >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map((g) => (
                            <option key={g} value={`grade_${g}`}>Grade {g}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => runPipeline(false)}
                        disabled={isRunning}
                        className="px-4 py-2 text-sm bg-[#c47fff] text-black font-medium rounded hover:bg-[#d48fff] transition-colors disabled:opacity-50"
                    >
                        {generating ? "Generating..." : "⚡ Generate Lesson"}
                    </button>

                    <button
                        onClick={() => runPipeline(true)}
                        disabled={isRunning}
                        className="px-4 py-2 text-sm border border-[#c47fff]/40 text-[#c47fff] rounded hover:bg-[#c47fff]/10 transition-colors disabled:opacity-50"
                    >
                        {regenerating ? "Regenerating..." : "↺ Regenerate (fresh)"}
                    </button>

                    {researchSources && (
                        <button
                            onClick={() => setShowSources((v) => !v)}
                            className="px-4 py-2 text-sm border border-[var(--border)] text-[var(--muted)] rounded hover:text-[var(--text)] hover:border-[#444] transition-colors"
                        >
                            {showSources ? "Hide Sources ▲" : "View Sources ▼"}
                        </button>
                    )}
                </div>

                {/* Pipeline progress steps */}
                {pipelineSteps.length > 0 && (
                    <div className="space-y-2">
                        {pipelineSteps.map((step, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <span className="w-5 text-center">
                                    {step.done ? (
                                        <span className="text-[#7ed957]">✓</span>
                                    ) : step.active ? (
                                        <span className="text-[#c47fff] animate-pulse">⋯</span>
                                    ) : (
                                        <span className="text-[var(--border)]">○</span>
                                    )}
                                </span>
                                <span
                                    className={
                                        step.done
                                            ? "text-[#7ed957]"
                                            : step.active
                                                ? "text-[var(--text)]"
                                                : "text-[var(--muted)]"
                                    }
                                >
                                    Step {i + 1} — {step.label}
                                    {step.done && " Done"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lesson Content Editor */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-6 mb-5">
                <label className="text-xs uppercase tracking-widest text-[var(--muted)] block mb-2">
                    Content <span className="normal-case text-[0.65rem]">(Markdown)</span>
                </label>
                <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={28}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#444] font-mono resize-y"
                    placeholder="Generate a lesson above, or write content directly in Markdown..."
                />

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={save}
                            disabled={saving}
                            className="px-5 py-2 bg-white text-black font-medium text-sm rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Lesson"}
                        </button>
                        <button
                            onClick={markVerified}
                            className="px-4 py-2 border border-[#7ed957]/40 text-[#7ed957] text-sm rounded hover:bg-[#7ed957]/10 transition-colors"
                        >
                            ✓ Mark as Verified
                        </button>
                        {message && (
                            <span className={`text-sm ${message.startsWith("Error") || message.startsWith("Pipeline") ? "text-red-400" : "text-[#7ed957]"}`}>
                                {message}
                            </span>
                        )}
                    </div>
                    <button onClick={deleteLesson} className="text-red-500/60 hover:text-red-400 text-sm transition-colors">
                        Delete
                    </button>
                </div>
            </div>

            {/* Sources Panel */}
            {showSources && researchSources && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-6">
                    <h2 className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)] mb-5 pb-3 border-b border-[var(--border)]">
                        Research Sources Used
                    </h2>
                    <div className="space-y-6">
                        {Object.entries(researchSources).map(([sourceName, sourceData]: [string, any]) => {
                            if (!sourceData?.content) return null;
                            return (
                                <div key={sourceName}>
                                    <div className="text-[0.65rem] uppercase tracking-widest text-[#c47fff] mb-2">{sourceName}</div>
                                    <p className="text-sm text-[var(--muted)] leading-relaxed mb-2 whitespace-pre-wrap line-clamp-6">
                                        {sourceData.content}
                                    </p>
                                    {sourceData.urls?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {sourceData.urls.map((url: string, i: number) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[0.65rem] text-[#5cb8ff] hover:underline truncate max-w-xs"
                                                >
                                                    {url}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
