/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { categories } from "@/lib/curriculum-data";

export default async function AdminSubjectsPage() {
    const supabase = createServerSupabaseClient();

    const { data: subjects } = await supabase
        .from("subjects")
        .select("id, label, category, is_published, coming_soon")
        .order("label");

    // Get lesson counts per subject
    const { data: lessonCounts } = await supabase
        .from("lessons")
        .select("subject_id");

    const countMap: Record<string, number> = {};
    (lessonCounts || []).forEach((l: any) => {
        countMap[l.subject_id] = (countMap[l.subject_id] || 0) + 1;
    });

    const grouped: Record<string, any[]> = {};
    (subjects || []).forEach((s: any) => {
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category]!.push(s);
    });

    return (
        <div>
            <h1 className="font-serif text-4xl mb-2">Subjects</h1>
            <p className="text-[var(--muted)] text-sm mb-10">Click any subject to edit it or manage its lessons.</p>

            {Object.entries(grouped).map(([cat, subs]) => {
                const catInfo = categories[cat] || { label: cat, color: "#888" };
                return (
                    <div key={cat} className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: catInfo.color }} />
                            <h2 className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)]">{catInfo.label}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {(subs || []).map((s: any) => (
                                <Link
                                    key={s.id}
                                    href={`/admin/subjects/${s.id}`}
                                    className="flex justify-between items-center bg-[var(--surface)] border border-[var(--border)] rounded p-4 hover:border-[#444] transition-colors group"
                                >
                                    <div>
                                        <div className="font-serif text-base mb-1 group-hover:text-white transition-colors">{s.label}</div>
                                        <div className="text-[0.7rem] text-[var(--muted)]">
                                            {countMap[s.id] || 0} lessons
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        {s.is_published ? (
                                            <span className="text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded bg-[#7ed957]/10 text-[#7ed957] border border-[#7ed957]/20">
                                                Published
                                            </span>
                                        ) : s.coming_soon ? (
                                            <span className="text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/20">
                                                Coming Soon
                                            </span>
                                        ) : (
                                            <span className="text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--bg)] text-[var(--muted)] border border-[var(--border)]">
                                                Draft
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
