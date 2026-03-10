/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { categories } from "@/lib/curriculum-data";
import type { Metadata } from "next";
import NotifyForm from "./NotifyForm";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const supabase = createServerSupabaseClient();
    const { data: subject } = await supabase
        .from("subjects")
        .select("label, description")
        .eq("id", params.id)
        .single();
    if (!subject) return { title: "How To Be Human" };
    return {
        title: `${subject.label} — How To Be Human`,
        description: subject.description || `Learn ${subject.label} as part of your complete human education.`,
        openGraph: {
            title: `${subject.label} — How To Be Human`,
            description: subject.description || `Learn ${subject.label} as part of your complete human education.`,
        },
    };
}

export default async function SubjectPage({ params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();

    // Fetch subject
    const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", params.id)
        .single();

    if (subjectError || !subject) notFound();

    // Check user access server-side
    const { data: { session } } = await supabase.auth.getSession();
    let hasAccess = false;
    if (session) {
        const { data: userData } = await supabase
            .from("users")
            .select("has_access")
            .eq("id", session.user.id)
            .single();
        hasAccess = userData?.has_access ?? false;
    }

    // Fetch connections
    const { data: connectionsData } = await supabase
        .from("connections")
        .select("*")
        .or(`subject_a.eq.${subject.id},subject_b.eq.${subject.id}`);

    const connectedIds = (connectionsData || []).map((c: any) =>
        c.subject_a === subject.id ? c.subject_b : c.subject_a
    );

    const { data: connectedSubjects } = connectedIds.length
        ? await supabase.from("subjects").select("id, label, category").in("id", connectedIds)
        : { data: [] };

    const connectionMap = new Map((connectedSubjects || []).map((s: any) => [s.id, s]));

    const connections = (connectionsData || []).map((c: any) => {
        const targetId = c.subject_a !== subject.id ? c.subject_a : c.subject_b;
        const targetSubject = connectionMap.get(targetId) as any;
        return {
            id: targetId,
            description: c.description,
            label: targetSubject?.label || targetId,
            category: targetSubject?.category || "core",
        };
    });

    // Fetch published lessons ordered by grade then position
    const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, level, grade_num, order_index, is_preview")
        .eq("subject_id", subject.id)
        .eq("is_published", true)
        .order("grade_num", { ascending: true })
        .order("order_index", { ascending: true });

    // Support both Grade 1-12 and legacy beginner/intermediate/advanced
    const isGradeModel = (lessons || []).some((l: any) => l.level?.startsWith("grade_"));
    const gradeLabels: Record<string, string> = {
        grade_1: "Grade 1", grade_2: "Grade 2", grade_3: "Grade 3",
        grade_4: "Grade 4", grade_5: "Grade 5", grade_6: "Grade 6",
        grade_7: "Grade 7", grade_8: "Grade 8", grade_9: "Grade 9",
        grade_10: "Grade 10", grade_11: "Grade 11", grade_12: "Grade 12",
        beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
    };
    const gradeAges: Record<string, string> = {
        grade_1: "Age 6–7", grade_2: "Age 7–8", grade_3: "Age 8–9",
        grade_4: "Age 9–10", grade_5: "Age 10–11", grade_6: "Age 11–12",
        grade_7: "Age 12–13", grade_8: "Age 13–14", grade_9: "Age 14–15",
        grade_10: "Age 15–16", grade_11: "Age 16–17", grade_12: "Age 17–18",
    };
    const gradeOrder = isGradeModel
        ? ["grade_1","grade_2","grade_3","grade_4","grade_5","grade_6",
           "grade_7","grade_8","grade_9","grade_10","grade_11","grade_12"]
        : ["beginner", "intermediate", "advanced"];

    const grouped: Record<string, typeof lessons> = {};
    (lessons || []).forEach((l: any) => {
        if (!grouped[l.level]) grouped[l.level] = [];
        grouped[l.level]!.push(l);
    });

    const category = categories[subject.category] || categories.core;
    const lockedCount = (lessons || []).filter((l: any) => !l.is_preview).length;

    return (
        <main className="min-h-screen flex flex-col max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10">
                <Link href="/" className="text-[var(--muted)] text-sm hover:text-[var(--text)] transition-colors inline-block mb-6">
                    ← Back to Map
                </Link>

                <h1 className="font-serif text-5xl md:text-6xl mb-2" style={{ color: category.color }}>
                    {subject.label}
                </h1>
                <div className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)] border-b border-[var(--border)] pb-6 mb-8">
                    {category.label}
                </div>

                <div className="text-xl text-[var(--text)] md:text-2xl font-light leading-relaxed font-serif">
                    {subject.description || "We are still formulating the exact summary of this discipline."}
                </div>
            </div>

            {/* Lessons */}
            {subject.coming_soon ? (
                <div className="py-12 border-y border-[var(--border)] mb-12 flex flex-col items-center text-center">
                    <div className="text-[var(--muted)] mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-serif mb-2">Lessons coming soon</h2>
                    <p className="text-[var(--muted)] max-w-md mx-auto mb-6 text-sm">
                        This subject is being built. Enter your email to be notified the moment the first lessons launch.
                    </p>
                    <NotifyForm subjectId={subject.id} />
                </div>
            ) : lessons && lessons.length > 0 ? (
                <div className="py-12 border-y border-[var(--border)] mb-12">
                    <h2 className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)] mb-8">
                        Lessons
                    </h2>

                    <div className="space-y-10">
                        {gradeOrder.map((level) => {
                            const lvlLessons = grouped[level];
                            if (!lvlLessons || lvlLessons.length === 0) return null;
                            return (
                                <div key={level}>
                                    <div className="flex items-baseline gap-3 mb-4">
                                        <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                                            {gradeLabels[level] || level}
                                        </div>
                                        {gradeAges[level] && (
                                            <div className="text-[0.6rem] text-[var(--muted)]/50">
                                                {gradeAges[level]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {(lvlLessons as any[]).map((lesson: any) => {
                                            const accessible = lesson.is_preview || hasAccess;
                                            return (
                                                <Link
                                                    key={lesson.id}
                                                    href={`/subject/${subject.id}/lesson/${lesson.id}`}
                                                    className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded hover:border-[#444] transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {!accessible && (
                                                            <span className="text-[var(--muted)] shrink-0">
                                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                </svg>
                                                            </span>
                                                        )}
                                                        <span className={`font-serif text-base group-hover:text-white transition-colors ${accessible ? "text-[var(--text)]" : "text-[var(--muted)]"}`}>
                                                            {lesson.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                                        {lesson.is_preview && (
                                                            <span className="text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded bg-[#5cb8ff]/10 text-[#5cb8ff] border border-[#5cb8ff]/20">
                                                                Free
                                                            </span>
                                                        )}
                                                        {!accessible && (
                                                            <span className="text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/20">
                                                                Unlock
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Upsell banner for non-paying users */}
                    {!hasAccess && lockedCount > 0 && (
                        <div className="mt-10 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <p className="text-[var(--muted)] text-sm">
                                {lockedCount} lesson{lockedCount !== 1 ? "s" : ""} locked. Unlock once — own it forever.
                            </p>
                            <Link
                                href="/unlock"
                                className="px-5 py-2.5 bg-[#f0a500] hover:bg-[#ffb71a] text-black font-medium text-sm rounded transition-colors shrink-0"
                            >
                                Unlock Everything — €29
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-12 border-y border-[var(--border)] mb-12 text-center">
                    <p className="text-[var(--muted)] text-sm italic">Lessons are being prepared for this subject.</p>
                </div>
            )}

            {/* Connections */}
            {connections.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)] mb-6">
                        Connected Subjects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {connections.map((c) => {
                            const targetCat = categories[c.category] || categories.core;
                            return (
                                <Link
                                    key={c.id}
                                    href={`/subject/${c.id}`}
                                    className="block p-5 border border-[var(--border)] bg-[var(--surface)] hover:border-[#444] transition-colors rounded-sm"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: targetCat.color }} />
                                        <div className="text-lg" style={{ color: targetCat.color }}>{c.label}</div>
                                    </div>
                                    <p className="text-[0.75rem] text-[var(--muted)] leading-relaxed">{c.description}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </main>
    );
}
