"use client";

import { useState } from "react";
import CurriculumMap from "@/components/CurriculumMap";
import { categories } from "@/lib/curriculum-data";

export default function MapPage() {
    const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

    return (
        <main className="min-h-screen flex flex-col">
            <header className="pt-8 pb-4 px-8 text-center border-b border-[var(--border)] shrink-0">
                <h1 className="font-serif text-[clamp(1.4rem,3.5vw,2.2rem)] tracking-tight">
                    Curriculum Map
                </h1>
                <p className="text-[var(--muted)] text-sm tracking-wide mt-1.5">
                    Click any subject to explore it — see how everything connects
                </p>
            </header>

            {/* Category filters */}
            <div className="flex flex-wrap justify-center gap-2 py-3 px-6 border-b border-[var(--border)] shrink-0">
                <button
                    onClick={() => setActiveCategory(undefined)}
                    className={`flex items-center gap-1.5 text-xs tracking-wide uppercase px-3 py-1.5 rounded-full border transition-all ${
                        activeCategory === undefined
                            ? "border-white/30 text-white bg-white/10"
                            : "border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-white/20"
                    }`}
                >
                    All
                </button>
                {Object.entries(categories).map(([key, cat]) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(activeCategory === key ? undefined : key)}
                        className={`flex items-center gap-1.5 text-xs tracking-wide uppercase px-3 py-1.5 rounded-full border transition-all ${
                            activeCategory === key
                                ? "text-white"
                                : "border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-white/20"
                        }`}
                        style={
                            activeCategory === key
                                ? { borderColor: cat.color, background: cat.color + "22", color: cat.color }
                                : {}
                        }
                    >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                        {cat.label}
                    </button>
                ))}
            </div>

            <CurriculumMap activeCategory={activeCategory} />
        </main>
    );
}
