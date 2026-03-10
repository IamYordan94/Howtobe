"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setDone(true);
            setTimeout(() => router.push("/account"), 2000);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
            <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded p-8 shadow-2xl">
                <h1 className="font-serif text-3xl mb-6 text-center">New Password</h1>

                {done ? (
                    <div className="text-center">
                        <div className="text-[#7ed957] text-2xl mb-3">✓</div>
                        <p className="text-sm text-[var(--muted)]">Password updated. Redirecting you now...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-[0.8rem] p-3 rounded">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#444] transition-colors"
                                required
                                minLength={8}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#444] transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-white text-black font-medium text-sm rounded hover:bg-gray-200 transition-colors disabled:opacity-50 mt-1"
                        >
                            {loading ? "Updating..." : "Set New Password"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
