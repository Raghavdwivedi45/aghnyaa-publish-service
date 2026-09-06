export function generateSlug(title: string) {
    return title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-")         // Replace spaces with hyphens
        .replace(/-+/g, "-")          // Collapse multiple hyphens
        .replace(/^-|-$/g, "");       // Trim leading/trailing hyphens
}

export function calculateReadTime(html: string): number {
    const plainText = html.replace(/<[^>]*>/g, " ");
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    const wordsPerMinute = 200;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function getRedisEncodedKey(type: "RATE", suffix: string): string {
    if (!type || !suffix) return "";

    switch (type) {
        case "RATE": return "RATE" + suffix;
        default: return "";
    }
}