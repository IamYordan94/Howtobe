"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NotifyForm({ subjectId }: { subjectId: string }) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            // Check if the user is logged in
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Logged-in user: add to notify_subjects array
                const { data: userData } = await supabase
                    .from("users")
                    .select("notify_subjects")
                    .eq("id", session.user.id)
                    .single();

                const current: string[] = userData?.notify_subjects || [];
                if (!current.includes(subjectId)) {
                    await supabase
                        .from("users")
                        .update({ notify_subjects: [...current, subjectId] })
                        .eq("id", session.user.id);
                }
            } else {
                // Guest: use the server-side API route to avoid exposing service role key
                const res = await fetch("/api/notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, subjectId }),
                });
                if (!res.ok) throw new Error("Request failed");
            }

            setStatus("done");
        } catch {
            setStatus("error");
        }
    };

    if (status === "done") {
        return (
            <p className="text-[#7ed957] text-sm">
                ✓ You&apos;ll be notified when this subject launches.
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--muted)]"
            />
            <button
                type="submit"
                disabled={status === "loading"}
                className="px-4 py-2 bg-white text-black font-medium text-sm rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
                {status === "loading" ? "..." : "Notify Me"}
            </button>
            {status === "error" && (
                <p className="text-red-400 text-xs mt-1">Something went wrong. Try again.</p>
            )}
        </form>
    );
}
