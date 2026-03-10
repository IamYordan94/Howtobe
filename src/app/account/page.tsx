/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RemoveNotifyButton from "./RemoveNotifyButton";

export default async function AccountPage() {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) redirect("/login");

    const { data: userData } = await supabase
        .from("users")
        .select("has_access, notify_subjects")
        .eq("id", session.user.id)
        .single();

    const hasAccess = userData?.has_access ?? false;
    const notifySubjectIds: string[] = userData?.notify_subjects ?? [];

    // Fetch subject names for any notify subscriptions
    const { data: notifySubjectData } = notifySubjectIds.length
        ? await supabase.from("subjects").select("id, label").in("id", notifySubjectIds)
        : { data: [] };

    const notifySubjects = (notifySubjectData || []) as { id: string; label: string }[];

    // Fetch progress with lesson + subject info
    const { data: progressData } = await supabase
        .from("progress")
        .select("lesson_id, completed_at, lessons(title, subject_id, subjects(label))")
        .eq("user_id", session.user.id)
        .order("completed_at", { ascending: false });

    return (
        <main className="min-h-screen max-w-4xl mx-auto px-6 py-12">
            <h1 className="font-serif text-4xl mb-8">My Account</h1>

            {/* Status card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-6 mb-8">
                <div className="text-[var(--muted)] text-[0.65rem] uppercase tracking-widest mb-1">Email</div>
                <div className="text-lg mb-6">{session.user.email}</div>

                <div className="text-[var(--muted)] text-[0.65rem] uppercase tracking-widest mb-3">Access</div>
                {hasAccess ? (
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#f0a500]/15 text-[#f0a500] border border-[#f0a500]/30 font-medium text-sm">
                            ★ Full Access Unlocked
                        </span>
                        <span className="text-[var(--muted)] text-xs">All 50 subjects · All 12 grades</span>
                    </div>
                ) : (
                    <div>
                        <span className="inline-flex items-center px-3 py-1.5 rounded bg-[var(--bg)] text-[var(--muted)] border border-[var(--border)] text-sm mb-4">
                            Free Tier — Grade 1 only
                        </span>
                        <div className="mt-4">
                            <Link
                                href="/unlock"
                                className="inline-block px-6 py-3 bg-[#f0a500] hover:bg-[#ffb71a] text-black font-medium text-sm rounded transition-colors"
                            >
                                Unlock Everything — €29
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Completed lessons */}
                <div>
                    <h2 className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] border-b border-[var(--border)] pb-3 mb-4">
                        Completed Lessons
                    </h2>
                    {!progressData || progressData.length === 0 ? (
                        <p className="text-[var(--muted)] text-sm italic">No completed lessons yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {progressData.slice(0, 20).map((p) => {
                                const lesson: any = Array.isArray(p.lessons) ? p.lessons[0] : p.lessons;
                                const subject: any = lesson?.subjects
                                    ? (Array.isArray(lesson.subjects) ? lesson.subjects[0] : lesson.subjects)
                                    : null;
                                return (
                                    <li key={p.lesson_id} className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded">
                                        <div className="text-sm mb-0.5">{lesson?.title || "Unknown Lesson"}</div>
                                        <div className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider">
                                            {subject?.label && <span className="mr-2">{subject.label}</span>}
                                            {new Date(p.completed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                        </div>
                                    </li>
                                );
                            })}
                            {progressData.length > 20 && (
                                <p className="text-[0.65rem] text-[var(--muted)] pt-1">
                                    + {progressData.length - 20} more completed
                                </p>
                            )}
                        </ul>
                    )}
                </div>

                {/* Notifications */}
                <div>
                    <h2 className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] border-b border-[var(--border)] pb-3 mb-4">
                        Coming Soon Notifications
                    </h2>
                    {notifySubjects.length === 0 ? (
                        <p className="text-[var(--muted)] text-sm italic">
                            Not watching any subjects. Visit a subject page and click &quot;Notify me&quot; to get notified when it launches.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {notifySubjects.map((s) => (
                                <li key={s.id} className="flex justify-between items-center bg-[var(--surface)] border border-[var(--border)] p-3 rounded">
                                    <span className="text-sm">{s.label}</span>
                                    <RemoveNotifyButton userId={session.user.id} subjectId={s.id} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </main>
    );
}
