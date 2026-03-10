import Link from "next/link";
import { categories, subjects } from "@/lib/curriculum-data";

export default function HomePage() {
    const categoryEntries = Object.entries(categories);

    return (
        <main className="min-h-screen">

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden">
                {/* Subtle radial glow */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f0a500]/5 blur-[120px]" />
                </div>

                <div className="relative max-w-4xl mx-auto">
                    <div className="inline-block text-[0.65rem] uppercase tracking-[0.2em] text-[#f0a500] border border-[#f0a500]/30 px-4 py-1.5 rounded-full mb-8">
                        50 subjects · Grade 1 to 12 · One payment
                    </div>

                    <h1 className="font-serif text-[clamp(2.8rem,7vw,5.5rem)] leading-[1.05] tracking-tight mb-6">
                        Everything you were<br />
                        <span className="text-[#f0a500]">never taught.</span>
                    </h1>

                    <p className="text-[clamp(1rem,2.5vw,1.3rem)] text-[var(--muted)] font-light leading-relaxed max-w-2xl mx-auto mb-12">
                        A complete school curriculum rebuilt from scratch — honest, clear,
                        and designed to actually stay with you. Every subject,
                        every year, from the very beginning.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/map"
                            className="px-8 py-4 bg-[#f0a500] hover:bg-[#ffb71a] text-black font-medium text-base rounded transition-colors shadow-lg shadow-[#f0a500]/20"
                        >
                            Explore for free →
                        </Link>
                        <Link
                            href="/unlock"
                            className="px-8 py-4 border border-[var(--border)] hover:border-[#444] hover:bg-white/5 text-[var(--muted)] hover:text-white text-base rounded transition-colors"
                        >
                            Unlock everything — €29
                        </Link>
                    </div>

                    <p className="text-[0.7rem] text-[var(--muted)]/50 mt-6 tracking-wide">
                        Grade 1 lessons are always free. No credit card needed to start.
                    </p>
                </div>
            </section>

            {/* ── The Problem ─────────────────────────────────────────────── */}
            <section className="border-t border-[var(--border)] py-24 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="font-serif text-[clamp(1.8rem,4vw,3rem)] mb-6 leading-tight">
                        You studied most of this for years.<br />
                        <span className="text-[var(--muted)]">But do you actually understand it?</span>
                    </h2>
                    <p className="text-[var(--muted)] text-lg leading-relaxed mb-8">
                        Most people leave school having sat through biology, history, economics,
                        and philosophy — but with only a vague memory of the surface. Not because
                        they weren&apos;t paying attention. Because the way it was taught didn&apos;t work.
                    </p>
                    <p className="text-[var(--text)] text-lg leading-relaxed">
                        We rebuilt 50 essential subjects the way they always should have been
                        taught. Starting from the absolute beginning. Going as deep as it goes.
                        Written honestly, without filler, without dumbing down.
                    </p>
                </div>
            </section>

            {/* ── How It Works ───────────────────────────────────────────── */}
            <section className="border-t border-[var(--border)] py-24 px-6 bg-[var(--surface)]/30">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-4">How it works</div>
                        <h2 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)]">Built like real school. Works like it should.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                num: "01",
                                title: "Pick any subject",
                                body: "Browse 50 essential subjects across 8 categories — from Biology and Philosophy to Cooking and Conflict Resolution. Everything a complete person should know.",
                                color: "#f0a500",
                            },
                            {
                                num: "02",
                                title: "Start at Grade 1",
                                body: "Every subject starts at Grade 1 — concrete, clear, no prior knowledge assumed. Each year goes deeper. By Grade 12 you're thinking at near-university level.",
                                color: "#7ed957",
                            },
                            {
                                num: "03",
                                title: "Go as far as you want",
                                body: "Grade 1 is always free. Unlock all 12 grades across every subject for a single one-time payment. No subscription, no hidden tiers, no expiry.",
                                color: "#3ecfcf",
                            },
                        ].map((step) => (
                            <div key={step.num} className="bg-[var(--surface)] border border-[var(--border)] rounded p-8">
                                <div className="font-serif text-4xl mb-4" style={{ color: step.color }}>{step.num}</div>
                                <h3 className="font-serif text-xl mb-3">{step.title}</h3>
                                <p className="text-[var(--muted)] text-sm leading-relaxed">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Sample Lesson ──────────────────────────────────────────── */}
            <section className="border-t border-[var(--border)] py-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-4">What a lesson looks like</div>
                        <h2 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)]">Clear. Honest. Worth reading.</h2>
                    </div>

                    {/* Fake lesson preview */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
                        {/* Lesson header */}
                        <div className="border-b border-[var(--border)] px-8 py-5">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-[0.6rem] uppercase tracking-widest px-2 py-1 bg-[#7ed957]/10 text-[#7ed957] border border-[#7ed957]/20 rounded">Economics · Grade 4</span>
                                <span className="text-[0.6rem] uppercase tracking-widest px-2 py-1 bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/20 rounded">Free Preview</span>
                            </div>
                            <h3 className="font-serif text-2xl">Where Money Comes From</h3>
                        </div>

                        <div className="px-8 py-6 space-y-5 text-sm leading-relaxed text-[var(--muted)]">
                            <div>
                                <div className="text-[0.65rem] uppercase tracking-widest text-[var(--text)] mb-2">What This Is</div>
                                <p>
                                    Money is something you use every day, but most people never stop to ask: what actually is it, and why does it work?
                                    This lesson answers that. Not with economics jargon — with the real story of how humans invented money to solve a practical problem.
                                </p>
                            </div>
                            <div>
                                <div className="text-[0.65rem] uppercase tracking-widest text-[var(--text)] mb-2">The Core Explanation</div>
                                <p>
                                    Before money existed, people traded directly — a farmer might swap eggs for a blacksmith&apos;s nails.
                                    This works fine when two people each have exactly what the other wants. But most of the time, they don&apos;t...
                                </p>
                            </div>
                        </div>

                        <div className="px-8 pb-6">
                            <div className="inline-block px-4 py-2 text-sm text-[#f0a500] border border-[#f0a500]/30 rounded cursor-default">
                                Continue reading in the app →
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Subjects Grid ──────────────────────────────────────────── */}
            <section className="border-t border-[var(--border)] py-24 px-6 bg-[var(--surface)]/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-4">50 subjects</div>
                        <h2 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)]">Everything that matters.</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categoryEntries.map(([catKey, cat]) => {
                            const catSubjects = subjects.filter((s) => s.cat === catKey);
                            return (
                                <div key={catKey} className="bg-[var(--surface)] border border-[var(--border)] rounded p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                                        <span className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">{cat.label}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {catSubjects.map((s) => (
                                            <div key={s.id} className="text-sm text-[var(--text)]">{s.label}</div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-10">
                        <Link href="/map" className="text-sm text-[var(--muted)] hover:text-white transition-colors underline underline-offset-4">
                            See how they all connect on the interactive map →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Pricing ────────────────────────────────────────────────── */}
            <section className="border-t border-[var(--border)] py-24 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-4">Pricing</div>
                    <h2 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] mb-4">Pay once. Learn forever.</h2>
                    <p className="text-[var(--muted)] mb-12 text-lg">
                        No subscription. No tiers. No &quot;upgrade to premium.&quot; You pay once and own everything.
                    </p>

                    <div className="bg-[var(--surface)] border border-[#f0a500]/30 rounded p-8 text-left shadow-2xl shadow-[#f0a500]/5">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <div className="font-serif text-2xl mb-1">Full Access</div>
                                <div className="text-[var(--muted)] text-sm">Everything, forever.</div>
                            </div>
                            <div className="text-right">
                                <div className="font-serif text-4xl text-[#f0a500]">€29</div>
                                <div className="text-[var(--muted)] text-sm line-through">€49</div>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {[
                                "All 50 subjects, all 12 grades",
                                "600+ lessons, written honestly and without filler",
                                "Progress tracking across every subject",
                                "Lifetime access — pay once, yours forever",
                                "All future lessons and updates included",
                                "No subscription, no hidden fees",
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm">
                                    <span className="text-[#7ed957] mt-0.5 shrink-0">✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/unlock"
                            className="block w-full py-4 bg-[#f0a500] hover:bg-[#ffb71a] text-black font-medium text-center rounded transition-colors shadow-lg shadow-[#f0a500]/20 text-base"
                        >
                            Unlock Everything — €29
                        </Link>

                        <p className="text-center text-[0.7rem] text-[var(--muted)] mt-4">
                            Or start for free — Grade 1 of every subject is open to everyone.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Final CTA ──────────────────────────────────────────────── */}
            <section className="border-t border-[var(--border)] py-24 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] mb-6 leading-tight">
                        Start learning.<br />
                        <span className="text-[var(--muted)]">No excuses. No subscription.</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/map"
                            className="px-8 py-4 bg-[#f0a500] hover:bg-[#ffb71a] text-black font-medium rounded transition-colors shadow-lg shadow-[#f0a500]/20"
                        >
                            Explore the map →
                        </Link>
                        <Link
                            href="/login"
                            className="px-8 py-4 border border-[var(--border)] hover:border-[#444] text-[var(--muted)] hover:text-white rounded transition-colors"
                        >
                            Create free account
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="border-t border-[var(--border)] py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="font-serif text-[#f0a500]">How To Be Human</div>
                    <div className="flex items-center gap-6 text-[0.7rem] text-[var(--muted)] uppercase tracking-widest">
                        <Link href="/map" className="hover:text-white transition-colors">Map</Link>
                        <Link href="/unlock" className="hover:text-white transition-colors">Unlock</Link>
                        <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                    </div>
                    <div className="text-[0.65rem] text-[var(--muted)]/50">
                        © {new Date().getFullYear()} How To Be Human
                    </div>
                </div>
            </footer>

        </main>
    );
}
