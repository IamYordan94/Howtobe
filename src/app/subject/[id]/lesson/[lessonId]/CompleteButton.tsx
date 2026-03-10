"use client";

import { useState } from "react";

export default function CompleteButton({
    lessonId,
    userId,
    alreadyCompleted,
}: {
    lessonId: string;
    userId: string;
    alreadyCompleted: boolean;
}) {
    const [completed, setCompleted] = useState(alreadyCompleted);
    const [loading, setLoading] = useState(false);

    if (completed) {
        return (
            <div className="flex items-center gap-2 text-[#7ed957] text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                Lesson completed
            </div>
        );
    }

    const handleComplete = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonId, userId }),
            });
            if (res.ok) setCompleted(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleComplete}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-[#7ed957]/30 text-[#7ed957] text-sm rounded hover:bg-[#7ed957]/10 transition-colors disabled:opacity-50"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
            {loading ? "Saving..." : "Mark as Complete"}
        </button>
    );
}
