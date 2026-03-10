export default function SubjectLoading() {
    return (
        <main className="min-h-screen flex flex-col max-w-4xl mx-auto px-6 py-12 animate-pulse">
            <div className="h-4 w-24 bg-[var(--surface)] rounded mb-8" />
            <div className="h-14 w-2/3 bg-[var(--surface)] rounded mb-4" />
            <div className="h-3 w-24 bg-[var(--surface)] rounded mb-10" />
            <div className="h-8 w-full bg-[var(--surface)] rounded mb-3" />
            <div className="h-8 w-5/6 bg-[var(--surface)] rounded mb-16" />

            <div className="border-y border-[var(--border)] py-12 mb-12 space-y-4">
                <div className="h-3 w-16 bg-[var(--surface)] rounded mb-6" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 w-full bg-[var(--surface)] rounded" />
                ))}
            </div>

            <div className="h-3 w-32 bg-[var(--surface)] rounded mb-6" />
            <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-[var(--surface)] rounded" />
                ))}
            </div>
        </main>
    );
}
