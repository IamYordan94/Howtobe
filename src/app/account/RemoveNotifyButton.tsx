"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveNotifyButton({
    userId,
    subjectId,
}: {
    userId: string;
    subjectId: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const remove = async () => {
        setLoading(true);
        await fetch("/api/notify", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, subject_id: subjectId }),
        });
        router.refresh();
    };

    return (
        <button
            onClick={remove}
            disabled={loading}
            className="text-[var(--muted)] hover:text-red-400 text-xs uppercase tracking-widest transition-colors disabled:opacity-40"
        >
            {loading ? "..." : "Remove"}
        </button>
    );
}
