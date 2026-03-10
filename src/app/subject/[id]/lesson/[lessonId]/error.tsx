"use client";

import Link from "next/link";

export default function LessonError({ reset }: { reset: () => void }) {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <h1 className="font-serif text-4xl mb-4">Something went wrong</h1>
            <p className="text-[var(--muted)] text-sm mb-8 max-w-sm">
                This lesson couldn&apos;t load. It might be a temporary issue.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="px-5 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                >
                    Try Again
                </button>
                <Link
                    href="/"
                    className="px-5 py-2 border border-[var(--border)] text-[var(--muted)] text-sm rounded hover:text-white transition-colors"
                >
                    Back to Map
                </Link>
            </div>
        </main>
    );
}
