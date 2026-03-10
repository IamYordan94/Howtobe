export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import SubjectEditorClient from "./SubjectEditorClient";

export default async function AdminSubjectPage({ params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();

    const [{ data: subject }, { data: lessons }] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", params.id).single(),
        supabase.from("lessons").select("id, title, level, grade_num, order_index, is_published, is_preview").eq("subject_id", params.id).order("grade_num", { ascending: true, nullsFirst: false }).order("order_index", { ascending: true }),
    ]);

    if (!subject) notFound();

    return <SubjectEditorClient subject={subject} lessons={lessons || []} />;
}
