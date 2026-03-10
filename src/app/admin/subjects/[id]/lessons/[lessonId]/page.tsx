export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import LessonEditorClient from "./LessonEditorClient";

export default async function AdminLessonPage({ params }: { params: { id: string; lessonId: string } }) {
    const supabase = createServerSupabaseClient();

    const [{ data: lesson }, { data: subject }] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", params.lessonId).single(),
        supabase.from("subjects").select("id, label").eq("id", params.id).single(),
    ]);

    if (!lesson || !subject) notFound();

    return <LessonEditorClient lesson={lesson} subjectLabel={subject.label} subjectId={subject.id} />;
}
