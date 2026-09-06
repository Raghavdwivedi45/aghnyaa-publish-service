import puppeteer, { Browser, LaunchOptions } from "puppeteer";

export const URLGenerator = (type: "USER", endpoint: string) => {
    // endpoint should start with "/"
    switch (type) {
        case "USER":
            return `${process.env.AGHNYAA_USER_SERVICE}${endpoint}`;
        default:
            return "";
    }
}

// Render runs the service as an unprivileged user in a 512MB container:
// - "shell" swaps full Chrome for chrome-headless-shell, a stripped headless-only build that
//   leaves enough headroom to render inside that memory limit
// - the sandbox needs privileges the container doesn't grant, so Chrome won't start without it off
// - /dev/shm is only 64MB there, which crashes page.pdf() on longer articles unless Chrome
//   falls back to /tmp
// Locally none of this applies, so keep the full browser with its sandbox intact.
const launchOptions: LaunchOptions =
    process.env.NODE_ENV === "production"
        ? {
            headless: "shell",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        }
        : {};

export const PDFGenerator = async (htmlContent: string, pdfName: string) => {
    let browser: Browser | undefined;

    try {
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        await page.setContent(htmlContent, { waitUntil: "load" }); // set html content on the browser's page
        const pdf = await page.pdf({ format: "A4", printBackground: false, preferCSSPageSize: true }); // Generate PDF and give me the PDF data.
        // This controls whether CSS backgrounds are included in the PDF. -> (.article-header {background: black; color: white}) -> Without printBackground: true -> the PDF may omit that black background.
        await browser.close();

        return Buffer.from(pdf);
    }
    catch (err) {
        console.log("Error while generating PDF", pdfName, err)
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}

export function generateArticlePdfHtml(title: string, excerpt: string, content: string): string {
    return (`
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <style>
                :root {
                    /* =========================
                    Theme
                    ========================== */

                    --bg: #f7efec;
                    --bg-secondary: #ead6cf;
                    --bg-tertiary: #dfc0b6;
                    --surface: #fffaf7;
                    --card-bg: #f8dfd8;

                    --text: #6a4a3d;
                    --text-secondary: #8a6c61;
                    --text-muted: #ad978d;

                    --h1-color: #4b3027;
                    --h2-color: #493329;
                    --h3-color: #66473a;
                    --h4-color: #7b5949;
                    --h5-color: #94705e;
                    --h6-color: #ad8a79;

                    --accent: #b85a47;
                    --accent-light: #e28e77;
                    --accent-soft: #f1c4bb;

                    --border: #ebaa90;
                    --border-light: #f7d9cf;
                    --border-medium: #f2c4b2;

                    --code-bg: #302621;
                    --code-text: #fdf8f3;

                    --shadow-sm: 0 4px 12px rgba(94, 57, 28, 0.08);
                    --shadow-md: 0 8px 24px rgba(94, 57, 28, 0.12);

                    --font-body: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;

                    --font-heading: Georgia, "Times New Roman", serif;
                }

                /* =========================
                PDF Page
                ========================== */

                @page {
                    size: A4;
                    margin: 20mm 18mm 22mm 18mm;

                    @bottom-right {
                        content: counter(page);
                        font-family: Arial, sans-serif;
                        font-size: 9px;
                        color: var(--text-muted);
                    }
                }

                * {
                    box-sizing: border-box;
                }

                html,
                body {
                    margin: 0;
                    padding: 0;
                }

                body {
                    background: var(--bg);
                    color: var(--text);
                    font-family: var(--font-body);
                    font-size: 11pt;
                    line-height: 1.75;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* =========================
                Document
                ========================== */

                .document {
                    width: 100%;
                    max-width: 850px;
                    margin: 0 auto;
                    border-radius: 8px;
                }

                /* =========================
                Article Header
                ========================== */

                .article-header {
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 34px;
                    padding: 38px 38px 32px;
                    background: linear-gradient( 135deg, rgba(255, 255, 255, 0.78), rgba(248, 223, 216, 0.88));
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    box-shadow: var(--shadow-md);
                }

                .article-title {
                    margin: 0;
                    color: var(--h1-color);
                    font-family: var(--font-heading);
                    font-size: 32pt;
                    font-weight: 700;
                    line-height: 1.18;
                    letter-spacing: -0.02em;
                    overflow-wrap: break-word;
                }

                .article-excerpt {
                    margin: 18px 0 0;
                    color: var(--text-secondary);
                    font-size: 13pt;
                    line-height: 1.65;
                }

                /* =========================
                Article Content
                ========================== */

                .article-content {
                    padding: 0 8px;
                }

                .article-content > *:first-child {
                    margin-top: 0;
                }

                .article-content p {
                    margin: 0 0 18px;
                    color: var(--text);
                    font-size: 11.5pt;
                    line-height: 1.85;
                }

                /* =========================
                Headings
                ========================== */

                .article-content h1,
                .article-content h2,
                .article-content h3,
                .article-content h4,
                .article-content h5,
                .article-content h6 {
                    font-family: var(--font-heading);
                    font-weight: 700;
                    line-height: 1.3;
                    break-after: avoid;
                    page-break-after: avoid;
                }

                .article-content h1 {
                    margin: 34px 0 16px;
                    color: var(--h1-color);
                    font-size: 25pt;
                }

                .article-content h2 {
                    margin: 32px 0 14px;
                    padding-bottom: 8px;
                    color: var(--h2-color);
                    font-size: 20pt;
                    border-bottom: 1px solid var(--border-light);
                }

                .article-content h3 {
                    margin: 26px 0 12px;
                    color: var(--h3-color);
                    font-size: 16pt;
                }

                .article-content h4 {
                    margin: 22px 0 10px;
                    color: var(--h4-color);
                    font-size: 13pt;
                }

                .article-content h5 {
                    margin: 18px 0 8px;
                    color: var(--h5-color);
                    font-size: 11pt;
                }

                .article-content h6 {
                    margin: 16px 0 8px;
                    color: var(--h6-color);
                    font-size: 10pt;
                }

                /* =========================
                Links
                ========================== */

                .article-content a {
                    color: var(--accent);
                    font-weight: 600;
                    text-decoration: none;
                    border-bottom: 1px solid var(--accent-light);
                }

                /* =========================
                Strong / Emphasis
                ========================== */

                .article-content strong,
                .article-content b {
                    color: var(--h3-color);
                    font-weight: 700;
                }

                .article-content em,
                .article-content i {
                    color: var(--text-secondary);
                }

                /* =========================
                Lists
                ========================== */

                .article-content ul,
                .article-content ol {
                    margin: 14px 0 22px;
                    padding-left: 28px;
                }

                .article-content li {
                    margin-bottom: 7px;
                    padding-left: 4px;
                }

                .article-content ul li::marker {
                    color: var(--accent);
                }

                .article-content ol li::marker {
                    color: var(--accent);
                    font-weight: 700;
                }

                /* =========================
                Blockquote
                ========================== */

                .article-content blockquote {
                    margin: 26px 0;
                    padding: 18px 22px;
                    background: var(--card-bg);
                    border-left: 5px solid var(--accent);
                    border-radius: 0 12px 12px 0;
                    color: var(--text-secondary);
                    font-family: var(--font-heading);
                    font-size: 13pt;
                    font-style: italic;
                    box-shadow: var(--shadow-sm);
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .article-content blockquote p {
                    margin-bottom: 0;
                }

                /* =========================
                Inline Code
                ========================== */

                .article-content code {
                    padding: 2px 6px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-light);
                    border-radius: 5px;
                    color: var(--accent);
                    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
                    font-size: 9.5pt;
                }

                /* =========================
                Code Blocks
                ========================== */

                .article-content pre {
                    margin: 24px 0;
                    padding: 20px;
                    background: var(--code-bg);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    color: var(--code-text);
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .article-content pre code {
                    display: block;
                    padding: 0;
                    background: transparent;
                    border: 0;
                    color: inherit;
                    font-size: 9pt;
                    line-height: 1.65;
                    white-space: pre-wrap;
                    overflow-wrap: break-word;
                }

                /* =========================
                Images
                ========================== */

                .article-content img {
                    display: block;
                    max-width: 100%;
                    height: auto;
                    margin: 24px auto;
                    border: 1px solid var(--border-light);
                    border-radius: 12px;
                    box-shadow: var(--shadow-sm);
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .article-content figure {
                    margin: 28px 0;
                    text-align: center;
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .article-content figcaption {
                    margin-top: 8px;
                    color: var(--text-muted);
                    font-size: 9pt;
                    font-style: italic;
                }

                /* =========================
                Tables
                ========================== */

                .article-content table {
                    width: 100%;
                    margin: 24px 0;
                    border-collapse: collapse;
                    background: rgba(255, 255, 255, 0.4);
                    font-size: 10pt;
                    break-inside: auto;
                }

                .article-content th,
                .article-content td {
                    padding: 10px 12px;
                    border: 1px solid var(--border-medium);
                    text-align: left;
                    vertical-align: top;
                }

                .article-content th {
                    background: var(--card-bg);
                    color: var(--h3-color);
                    font-weight: 700;
                }

                .article-content tr {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .article-content tr:nth-child(even) td {
                    background: rgba(255, 255, 255, 0.25);
                }

                /* =========================
                Horizontal Rule
                ========================== */

                .article-content hr {
                    height: 1px;
                    margin: 34px 0;
                    border: 0;
                    background: linear-gradient( 90deg, transparent, var(--border), transparent);
                }

                /* =========================
                Highlight
                ========================== */

                .article-content mark {
                    padding: 1px 4px;
                    background: var(--accent-light);
                    color: var(--h1-color);
                    border-radius: 4px;
                }

                /* =========================
                Video / iframe
                ========================== */

                .article-content iframe {
                    display: block;
                    max-width: 100%;
                    margin: 24px auto;
                    border: 1px solid var(--border-light);
                    border-radius: 12px;
                    break-inside: avoid;
                }

                .article-footer {
                    margin-top: 50px;
                    padding-top: 18px;
                    border-top: 1px solid var(--border-light);
                    color: var(--text-muted);
                    font-size: 8.5pt;
                    text-align: center;
                }

                .article-content h1,
                .article-content h2,
                .article-content h3 {
                    break-inside: avoid;
                }

                .article-content p,
                .article-content li {
                    orphans: 3;
                    widows: 3;
                }
            </style>
        </head>

        <body>

            <div class="document">
                <h2>Aghnyaa</h2>
                
                <header class="article-header">
                    <h1 class="article-title">${title}</h1>
                    <p class="article-excerpt">${excerpt}</p>
                </header>

                <main class="article-content">${content}</main>

                <footer class="article-footer">Aghnyaa © 2026</footer>
            </div>

        </body>
    </html>`.trim());
}