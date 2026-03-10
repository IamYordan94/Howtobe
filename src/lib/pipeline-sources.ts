/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Source selection map: which educational sources to query based on subject category.
 * Based on the ContentPipelineSpec Section 3.
 */

export const CATEGORY_SOURCES: Record<string, string[]> = {
    core: ["wikipedia", "khan", "openstax"],
    academic: ["wikipedia", "openstax", "khan", "pubmed"],
    practical: ["wikipedia", "perplexity"],
    humanities: ["wikipedia", "gutenberg", "perplexity"],
    stem: ["wikipedia", "openstax", "khan", "mit", "pubmed"],
    social: ["wikipedia", "perplexity", "pubmed"],
    specialized: ["wikipedia", "perplexity"],
    enrichment: ["wikipedia", "perplexity"],
};

/** Fetch Wikipedia summary for a topic */
export async function fetchWikipedia(topic: string): Promise<{ content: string; urls: string[] }> {
    const slug = encodeURIComponent(topic.replace(/ /g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    try {
        const res = await fetch(url, { headers: { "User-Agent": "HowToBeHuman/1.0" } });
        if (!res.ok) return { content: "", urls: [] };
        const data = await res.json();
        return {
            content: data.extract || "",
            urls: [data.content_urls?.desktop?.page || url],
        };
    } catch {
        return { content: "", urls: [] };
    }
}

/** Fetch Perplexity live web research */
export async function fetchPerplexity(
    subjectLabel: string,
    level: string
): Promise<{ content: string; urls: string[] }> {
    const prompt = `You are a research assistant for an educational platform.
Subject: ${subjectLabel}
Lesson level: ${level} (beginner = assume zero prior knowledge, intermediate = some familiarity, advanced = solid foundation)

Provide:
1. A clear, factual explanation of the core concepts at this level
2. The most important things someone at this level must understand
3. Any common misconceptions to address
4. Real-world examples that make this tangible

Be factual. Cite your sources. Do not speculate.`;

    try {
        const res = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-sonar-large-128k-online",
                messages: [{ role: "user", content: prompt }],
            }),
        });
        if (!res.ok) return { content: "", urls: [] };
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        const urls = (data.citations || []) as string[];
        return { content, urls };
    } catch {
        return { content: "", urls: [] };
    }
}

/** Fetch OpenStax books index and find relevant book */
export async function fetchOpenStax(subject: string): Promise<{ content: string; urls: string[] }> {
    try {
        const res = await fetch("https://openstax.org/api/v2/books?format=json", {
            headers: { "User-Agent": "HowToBeHuman/1.0" },
        });
        if (!res.ok) return { content: "", urls: [] };
        const data = await res.json();
        const books = data.items || [];
        const subjectLower = subject.toLowerCase();
        const match = books.find((b: any) =>
            b.title?.toLowerCase().includes(subjectLower) ||
            subjectLower.split(" ").some((w: string) => b.title?.toLowerCase().includes(w))
        );
        if (!match) return { content: "", urls: [] };
        return {
            content: `OpenStax book: "${match.title}". ${match.description || ""}`.slice(0, 800),
            urls: [`https://openstax.org/books/${match.slug}/pages/1-introduction`],
        };
    } catch {
        return { content: "", urls: [] };
    }
}

/** Fetch Khan Academy topic structure */
export async function fetchKhanAcademy(slug: string): Promise<{ content: string; urls: string[] }> {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    try {
        const res = await fetch(`https://www.khanacademy.org/api/v1/topic/${cleanSlug}`, {
            headers: { "User-Agent": "HowToBeHuman/1.0" },
        });
        if (!res.ok) return { content: "", urls: [] };
        const data = await res.json();
        const title = data.title || slug;
        const description = data.description || "";
        const children = (data.children || []).slice(0, 8).map((c: any) => c.title).filter(Boolean);
        const content = `Khan Academy — ${title}: ${description}. Topics covered: ${children.join(", ")}`.slice(0, 600);
        return { content, urls: [`https://www.khanacademy.org/${cleanSlug}`] };
    } catch {
        return { content: "", urls: [] };
    }
}

/** Fetch Project Gutenberg books related to subject */
export async function fetchGutenberg(subject: string): Promise<{ content: string; urls: string[] }> {
    try {
        const res = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(subject)}&languages=en`, {
            headers: { "User-Agent": "HowToBeHuman/1.0" },
        });
        if (!res.ok) return { content: "", urls: [] };
        const data = await res.json();
        const books = (data.results || []).slice(0, 5);
        if (!books.length) return { content: "", urls: [] };
        const list = books.map((b: any) => `"${b.title}" by ${b.authors?.[0]?.name || "Unknown"}`).join("; ");
        const urls = books.map((b: any) => `https://www.gutenberg.org/ebooks/${b.id}`);
        return { content: `Related classic works from Project Gutenberg: ${list}`, urls };
    } catch {
        return { content: "", urls: [] };
    }
}

/** Fetch PubMed abstracts related to subject */
export async function fetchPubMed(subject: string): Promise<{ content: string; urls: string[] }> {
    try {
        const searchRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(subject)}&retmax=3&retmode=json`
        );
        if (!searchRes.ok) return { content: "", urls: [] };
        const searchData = await searchRes.json();
        const ids: string[] = searchData.esearchresult?.idlist || [];
        if (!ids.length) return { content: "", urls: [] };
        const summaryRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`
        );
        if (!summaryRes.ok) return { content: "", urls: [] };
        const summaryData = await summaryRes.json();
        const articles = Object.values(summaryData.result || {}).filter((a: any) => a.uid);
        const titles = (articles as any[]).map((a: any) => a.title).filter(Boolean).slice(0, 3);
        const urls = ids.map((id) => `https://pubmed.ncbi.nlm.nih.gov/${id}/`);
        return { content: `Recent research (PubMed): ${titles.join(" | ")}`, urls };
    } catch {
        return { content: "", urls: [] };
    }
}
