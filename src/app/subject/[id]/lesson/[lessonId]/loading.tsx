export default function LessonLoading() {
    return (
        <main className="min-h-screen flex flex-col max-w-3xl mx-auto px-6 py-12 animate-pulse">
            <div className="h-4 w-32 bg-[var(--surface)] rounded mb-10" />
            <div className="h-3 w-20 bg-[var(--surface)] rounded mb-6" />
            <div className="h-12 w-3/4 bg-[var(--surface)] rounded mb-4" />
            <div className="h-12 w-1/2 bg-[var(--surface)] rounded mb-12" />
            <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={`h-5 bg-[var(--surface)] rounded ${i % 3 === 0 ? "w-4/5" : "w-full"}`} />
                ))}
            </div>
        </main>
    );
}
