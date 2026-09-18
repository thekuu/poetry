/**
 * Normalizes poem content before rendering.
 * 1. Replaces non-breaking spaces (&nbsp;, &amp;nbsp;, \u00A0, \u202F, etc.) with standard spaces
 *    so that the browser line-breaking engine can freely wrap long lines.
 * 2. Appends zero-width spaces (\u200B) after punctuation (both Ethiopic and standard) and within
 *    unbroken runs of characters. This is essential for mobile browsers (particularly WebKit / Safari on iOS)
 *    which do not apply `word-break: break-all` to non-Latin scripts like Ethiopic.
 * 3. Operates strictly on text nodes outside HTML tags to preserve HTML structure and attributes.
 */
export function formatPoemContent(content: string | undefined | null): string {
    if (!content) return '';

    // Split HTML tags from text nodes
    const parts = content.split(/(<[^>]+>)/g);
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('<')) {
            // Text node: normalize spaces and insert break opportunities
            parts[i] = parts[i]
                .replace(/&nbsp;/gi, ' ')
                .replace(/&amp;nbsp;/gi, ' ')
                .replace(/&#160;/gi, ' ')
                .replace(/[\u00A0\u202F\u2007\u2060\uFEFF]/g, ' ')
                .replace(/[\u2000-\u200A\u205F\u3000]/g, ' ')
                // Replace tabs and runs of spaces with a single space
                .replace(/[ \t]+/g, ' ')
                // Ensure break opportunities after Ethiopic and standard punctuation
                .replace(/([፡።፣፤፥፦፧፨.,!?;:…—–\-_/\\()\[\]‹›«»“”"'])/g, '$1\u200B')
                // Break long continuous unbroken characters (e.g. Ethiopic lines or long words)
                .replace(/([^\s\u200B]{4})/g, '$1\u200B');
        } else {
            // HTML tag: ensure no unwanted nowrap or pre styles
            parts[i] = parts[i]
                .replace(/white-space:\s*nowrap/gi, 'white-space: pre-wrap')
                .replace(/white-space:\s*pre(?![-\w])/gi, 'white-space: pre-wrap');
        }
    }
    return parts.join('');
}

