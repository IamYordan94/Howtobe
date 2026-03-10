import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-56 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col shrink-0">
                <div className="p-5 border-b border-[var(--border)]">
                    <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-1">Admin</div>
                    <Link href="/admin" className="font-serif text-lg text-[#f0a500]">The Gateway</Link>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
                    >
                        <span>🏠</span> Overview
                    </Link>
                    <Link
                        href="/admin/subjects"
                        className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
                    >
                        <span>📚</span> Subjects
                    </Link>
                </nav>
                <div className="p-4 border-t border-[var(--border)]">
                    <Link
                        href="/"
                        className="text-[0.7rem] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                    >
                        ← Back to site
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-10 overflow-y-auto min-h-screen">
                {children}
            </main>
        </div>
    );
}
