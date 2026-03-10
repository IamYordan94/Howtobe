"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UnlockPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCheckout = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push("/login");
            return;
        }

        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Could not start checkout session. Please try again later.");
            }
        } catch (err) {
            console.error(err);
            alert("Error starting checkout");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen max-w-2xl mx-auto px-6 py-16 text-center">
            <h1 className="font-serif text-5xl mb-6">Unlock Everything</h1>
            <p className="text-xl text-[var(--muted)] font-light leading-relaxed mb-12">
                Pay once. Own it. Learn everything. Forever.
            </p>

            <div className="bg-[var(--surface)] border border-[#f0a500]/30 rounded p-8 mb-12 text-left shadow-2xl shadow-[#f0a500]/5">
                <h2 className="text-[0.7rem] uppercase tracking-widest text-[var(--muted)] mb-6 border-b border-[var(--border)] pb-3">
                    What you get
                </h2>
                <ul className="space-y-4 mb-8 text-[var(--text)]">
                    <li className="flex items-start gap-3">
                        <span className="text-[#7ed957]">✓</span>
                        <span>All 50 essential subjects — Grade 1 through Grade 12</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-[#7ed957]">✓</span>
                        <span>600+ lessons, each written honestly and without filler</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-[#7ed957]">✓</span>
                        <span>Progress tracking — see how far you&apos;ve come in each subject</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-[#7ed957]">✓</span>
                        <span>Lifetime access — all future lessons and updates included</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-[#7ed957]">✓</span>
                        <span>No subscription, no hidden fees, no expiry. Ever.</span>
                    </li>
                </ul>

                <div className="border-t border-[var(--border)] pt-6 flex items-center justify-between mb-8">
                    <div className="text-[var(--muted)] text-sm">One-time payment</div>
                    <div className="text-right">
                        <div className="text-3xl font-serif text-[#f0a500]">€29</div>
                        <div className="text-sm text-gray-500 line-through">€49</div>
                    </div>
                </div>

                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full py-4 bg-[#f0a500] hover:bg-[#ffb71a] text-black font-medium rounded transition-colors disabled:opacity-50 text-lg shadow-lg"
                >
                    {loading ? "Preparing Checkout..." : "Unlock Everything"}
                </button>
            </div>
        </main>
    );
}
