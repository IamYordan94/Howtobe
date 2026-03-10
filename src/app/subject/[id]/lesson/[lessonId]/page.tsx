/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";
import CompleteButton from "./CompleteButton";

export async function generateMetadata({ params }: { params: { id: string; lessonId: string } }): Promise<Metadata> {
    const supabase = createServerSupabaseClient();
    const [{ data: lesson }, { data: subject }] = await Promise.all([
        supabase.from("lessons").select("title").eq("id", params.lessonId).single(),
        supabase.from("subjects").select("label").eq("id", params.id).single(),
    ]);
    if (!lesson || !subject) return { title: "How To Be Human" };
    return {
        title: `${lesson.title} — ${subject.label} — How To Be Human`,
        description: `${lesson.title}: a lesson in ${subject.label}.`,
        openGraph: {
            title: `${lesson.title} — ${subject.label} — How To Be Human`,
            description: `${lesson.title}: a lesson in ${subject.label}.`,
        },
    };
}

export default async function LessonPage({ params }: { params: { id: string; lessonId: string } }) {
    const supabase = createServerSupabaseClient();

    // Fetch lesson
    const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", params.lessonId)
        .single();

    if (lessonError || !lesson) notFound();

    // Fetch subject
    const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .select("id, label, category")
        .eq("id", params.id)
        .single();

    if (subjectError || !subject) notFound();

    // Check user access server-side — locked content is never sent to the browser
    const { data: { session } } = await supabase.auth.getSession();
    let hasAccess = false;
    let alreadyCompleted = false;
    if (session) {
        const { data: userData } = await supabase
            .from("users")
            .select("has_access")
            .eq("id", session.user.id)
            .single();
        hasAccess = userData?.has_access ?? false;

        if (hasAccess) {
            const { data: progressRow } = await supabase
                .from("progress")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("lesson_id", lesson.id)
                .maybeSingle();
            alreadyCompleted = !!progressRow;
        }
    }

    const canRead = lesson.is_preview || hasAccess;

    // Adjacent lessons for prev/next navigation (published only)
    const { data: allLessons } = await supabase
        .from("lessons")
        .select("id, title, order_index")
        .eq("subject_id", params.id)
        .eq("level", lesson.level)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

    const currentIndex = allLessons?.findIndex((l: any) => l.id === lesson.id) ?? -1;
    const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null;
    const nextLesson = currentIndex !== -1 && currentIndex < (allLessons?.length ?? 0) - 1
        ? allLessons?.[currentIndex + 1]
        : null;

    return (
        <main className="min-h-screen flex flex-col max-w-3xl mx-auto px-6 py-12">
            <div className="mb-10">
                <Link
                    href={`/subject/${subject.id}`}
                    className="text-[var(--muted)] text-sm hover:text-[var(--text)] transition-colors inline-block mb-8"
                >
                    ← Back to {subject.label}
                </Link>

                <div className="flex items-center gap-3 mb-4">
                    <span className="px-2.5 py-1 text-xs uppercase tracking-widest border border-[var(--border)] rounded text-[var(--muted)]">
                        {lesson.level}
                    </span>
                    {lesson.is_preview && (
                        <span className="px-2.5 py-1 text-xs uppercase tracking-widest border border-[#5cb8ff]/30 rounded text-[#5cb8ff]">
                            Free Preview
                        </span>
                    )}
                </div>

                <h1 className="font-serif text-4xl md:text-5xl mb-8 text-[var(--text)]">
                    {lesson.title}
                </h1>

                {canRead ? (
                    /* Full lesson content — only rendered server-side for authorised users */
                    <div className="text-[var(--muted)] leading-relaxed">
                        <ReactMarkdown
                            components={{
                                h1: ({ children }) => <h1 className="text-3xl font-serif text-[var(--text)] mb-6 mt-10">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-2xl font-serif text-[var(--text)] mt-10 mb-4">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-xl font-serif text-[var(--text)] mt-8 mb-3">{children}</h3>,
                                p: ({ children }) => <p className="mb-6 leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-2">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                strong: ({ children }) => <strong className="text-[var(--text)] font-medium">{children}</strong>,
                                a: ({ href, children }) => <a href={href} className="text-[#5cb8ff] underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                blockquote: ({ children }) => <blockquote className="border-l-2 border-[var(--border)] pl-4 text-[var(--muted)] italic my-6">{children}</blockquote>,
                                code: ({ children }) => <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-sm font-mono text-[#c47fff]">{children}</code>,
                                hr: () => <hr className="border-[var(--border)] my-10" />,
                            }}
                        >
                            {lesson.content || "*(Lesson content coming soon)*"}
                        </ReactMarkdown>
                    </div>
                ) : (
                    /* Locked state — no content sent to browser */
                    <div>
                        <p className="text-[var(--muted)] leading-relaxed mb-10">
                            This lesson is part of the full {subject.label} curriculum. Unlock once to read this and every other lesson on the platform — forever.
                        </p>
                        <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
                            {/* Blurred placeholder content */}
                            <div className="p-6 opacity-20 pointer-events-none select-none blur-sm">
                                <p className="text-sm mb-3">There is something essential here. Something you have probably thought about but never been given the proper tools to understand.</p>
                                <p className="text-sm mb-3">This lesson starts from the beginning — no assumptions, no jargon. Just the truth about {lesson.title.toLowerCase()}, explained clearly.</p>
                                <p className="text-sm">By the end you will have a practical framework you can use today.</p>
                            </div>
                            {/* Lock overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[var(--bg)]/70">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <Link
                                    href="/unlock"
                                    className="px-6 py-3 bg-[#f0a500] hover:bg-[#ffb71a] text-black font-medium text-sm rounded transition-colors"
                                >
                                    Unlock Everything — €29 one-time
                                </Link>
                                {!session && (
                                    <Link href="/login" className="text-[var(--muted)] text-xs hover:text-[var(--text)] transition-colors">
                                        Already unlocked? Log in
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mark as Complete — only for logged-in users with access */}
            {canRead && session && (
                <div className="mb-8">
                    <CompleteButton
                        lessonId={lesson.id}
                        userId={session.user.id}
                        alreadyCompleted={alreadyCompleted}
                    />
                </div>
            )}

            {/* Prev / Next navigation */}
            <div className="flex justify-between items-center py-8 border-t border-[var(--border)]">
                {prevLesson ? (
                    <Link
                        href={`/subject/${subject.id}/lesson/${(prevLesson as any).id}`}
                        className="flex flex-col text-left group"
                    >
                        <span className="text-xs uppercase tracking-widest text-[var(--muted)] mb-1 group-hover:text-[var(--text)] transition-colors">Previous</span>
                        <span className="font-serif text-[var(--text)]">{(prevLesson as any).title}</span>
                    </Link>
                ) : <div />}

                {nextLesson ? (
                    <Link
                        href={`/subject/${subject.id}/lesson/${(nextLesson as any).id}`}
                        className="flex flex-col text-right group"
                    >
                        <span className="text-xs uppercase tracking-widest text-[var(--muted)] mb-1 group-hover:text-[var(--text)] transition-colors">Next</span>
                        <span className="font-serif text-[var(--text)]">{(nextLesson as any).title}</span>
                    </Link>
                ) : <div />}
            </div>
        </main>
    );
}
