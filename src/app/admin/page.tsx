/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function GatewayDashboard() {
    const supabase = createServerSupabaseClient();

    const [{ count: subjectCount }, { count: lessonCount }, { count: userCount }] = await Promise.all([
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }),
    ]);

    const stats = [
        { label: "Total Subjects", value: subjectCount ?? 0, color: "#f0a500", href: "/admin/subjects" },
        { label: "Total Lessons", value: lessonCount ?? 0, color: "#3ecfcf", href: "/admin/subjects" },
        { label: "Registered Users", value: userCount ?? 0, color: "#7ed957", href: "#" },
    ];

    return (
        <div>
            <h1 className="font-serif text-4xl mb-2">The Gateway</h1>
            <p className="text-[var(--muted)] text-sm mb-10">Content management for How To Be Human.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {stats.map((s) => (
                    <Link
                        key={s.label}
                        href={s.href}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded p-6 hover:border-[#444] transition-colors"
                    >
                        <div className="text-4xl font-serif mb-2" style={{ color: s.color }}>
                            {s.value}
                        </div>
                        <div className="text-xs uppercase tracking-widest text-[var(--muted)]">{s.label}</div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/admin/subjects"
                    className="flex items-center gap-4 bg-[var(--surface)] border border-[var(--border)] rounded p-6 hover:border-[#444] transition-colors"
                >
                    <div className="text-[#f0a500] text-2xl">📚</div>
                    <div>
                        <div className="font-serif text-lg mb-1">Manage Subjects</div>
                        <div className="text-xs text-[var(--muted)]">Edit descriptions, publish or hide subjects</div>
                    </div>
                </Link>
                <Link
                    href="/admin/subjects"
                    className="flex items-center gap-4 bg-[var(--surface)] border border-[var(--border)] rounded p-6 hover:border-[#444] transition-colors"
                >
                    <div className="text-[#3ecfcf] text-2xl">✍️</div>
                    <div>
                        <div className="font-serif text-lg mb-1">Write Lessons</div>
                        <div className="text-xs text-[var(--muted)]">Create, edit, and AI-draft lessons for any subject</div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
