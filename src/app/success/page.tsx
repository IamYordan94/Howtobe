import Link from "next/link";

export default function SuccessPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)] text-center">
            <div className="w-full max-w-md">
                <div className="text-4xl mb-6">🎉</div>
                <h1 className="font-serif text-4xl mb-4 text-[var(--text)]">Welcome.</h1>
                <p className="text-[var(--muted)] leading-relaxed mb-8">
                    Your payment was successful. You now have lifetime access to the complete map and every lesson on How To Be Human.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/map"
                        className="px-6 py-3 bg-[#f0a500] text-black font-medium text-sm rounded hover:bg-[#ffb71a] transition-colors"
                    >
                        Start Learning
                    </Link>
                    <Link
                        href="/account"
                        className="px-6 py-3 bg-transparent border border-[var(--border)] text-[var(--text)] font-medium text-sm rounded hover:bg-white/5 transition-colors"
                    >
                        Go to My Account
                    </Link>
                </div>
            </div>
        </main>
    );
}
