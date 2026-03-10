"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"login" | "reset">("login");
    const router = useRouter();
    const searchParams = useSearchParams();

    // Show error if auth callback failed
    const callbackError = searchParams.get("error");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        } else {
            router.push("/account");
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please enter both email and password to sign up.");
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Check your email — we sent you a confirmation link.");
        }
        setLoading(false);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Enter your email address above.");
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}/auth/callback?next=/account/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Password reset email sent — check your inbox.");
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
            <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded p-8 shadow-2xl">

                <h1 className="font-serif text-3xl mb-6 text-[var(--text)] text-center">
                    {mode === "reset" ? "Reset Password" : "Welcome"}
                </h1>

                {callbackError && mode === "login" && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-[0.8rem] p-3 mb-4 rounded">
                        Something went wrong with your verification link. Please try again.
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-[0.8rem] p-3 mb-4 rounded leading-relaxed">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 text-[0.8rem] p-3 mb-4 rounded leading-relaxed">
                        {message}
                    </div>
                )}

                {mode === "reset" ? (
                    <form onSubmit={handleReset} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#444] transition-colors"
                                required
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-white text-black font-medium text-sm rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode("login"); setError(null); setMessage(null); }}
                            className="text-[0.75rem] text-[var(--muted)] hover:text-white transition-colors text-center"
                        >
                            ← Back to login
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#444] transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs uppercase tracking-widest text-[var(--muted)]">Password</label>
                                <button
                                    type="button"
                                    onClick={() => { setMode("reset"); setError(null); setMessage(null); }}
                                    className="text-[0.7rem] text-[var(--muted)] hover:text-white transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#444] transition-colors"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-white text-black font-medium text-sm rounded hover:bg-gray-200 transition-colors disabled:opacity-50 mt-1"
                        >
                            {loading ? "Loading..." : "Log In"}
                        </button>

                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            className="w-full py-2.5 bg-transparent border border-[var(--border)] text-[var(--text)] font-medium text-sm rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            Create Account
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
