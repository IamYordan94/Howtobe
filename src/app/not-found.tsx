import Link from "next/link";

export default function NotFound() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <div className="text-[var(--muted)] text-sm uppercase tracking-widest mb-4">404</div>
            <h1 className="font-serif text-5xl mb-4">Page not found</h1>
            <p className="text-[var(--muted)] text-base mb-10 max-w-sm leading-relaxed">
                This subject or lesson doesn&apos;t exist, or hasn&apos;t been published yet.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-white text-black font-medium text-sm rounded hover:bg-gray-200 transition-colors"
            >
                ← Back to the Map
            </Link>
        </main>
    );
}
