/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export default function SiteHeader() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsAdmin(session?.user?.email === ADMIN_EMAIL);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsAdmin(session?.user?.email === ADMIN_EMAIL);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
        setIsOpen(false);
    };

    const navLinks = (
        <>
            <Link
                href="/map"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium hover:text-white transition-colors text-[var(--muted)]"
            >
                Map
            </Link>

            {user ? (
                <>
                    <Link
                        href="/account"
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-medium hover:text-white transition-colors text-[var(--muted)]"
                    >
                        Account
                    </Link>
                    {isAdmin && (
                        <a
                            href="/admin"
                            onClick={() => setIsOpen(false)}
                            className="text-sm font-medium hover:text-white transition-colors text-[#c47fff]"
                        >
                            Gateway ✦
                        </a>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 border border-[var(--border)] hover:bg-white/5 bg-[var(--surface)] text-[var(--muted)] hover:text-white text-sm rounded transition-colors"
                    >
                        Log Out
                    </button>
                </>
            ) : (
                <>
                    {!loading && (
                        <>
                            <Link
                                href="/unlock"
                                onClick={() => setIsOpen(false)}
                                className="text-sm font-medium hover:text-white transition-colors text-[var(--muted)]"
                            >
                                Unlock
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 border border-[var(--border)] hover:bg-white/5 bg-[var(--surface)] text-[var(--text)] text-sm rounded transition-colors"
                            >
                                Login
                            </Link>
                        </>
                    )}
                </>
            )}
        </>
    );

    return (
        <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <Link href="/" className="font-serif text-xl tracking-tight text-[#f0a500]">
                            How To Be Human
                        </Link>
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navLinks}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-[var(--muted)] hover:text-white p-2"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)]">
                    <div className="px-4 pt-3 pb-4 space-y-2 flex flex-col">
                        {navLinks}
                    </div>
                </div>
            )}
        </header>
    );
}
