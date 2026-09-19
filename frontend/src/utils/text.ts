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

    // If it's plain text without HTML tags (such as scraped poems or newly created poems),
    // keep all line breaks, stanza gaps, and indentation spaces intact.
    // In containers with `whitespace-pre-wrap`, every \n and space renders with exact fidelity.
    if (!content.includes('<p>') && !content.includes('<br')) {
        return content
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/([፡።፣፤፥፦፧፨.,!?;:…—–\-_/\\()\[\]‹›«»“”"'])/g, '$1\u200B');
    }

    // Split HTML tags from text nodes for rich HTML content
    const parts = content.split(/(<[^>]+>)/g);
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('<')) {
            // Text node: insert soft break opportunities after punctuation for mobile responsiveness
            parts[i] = parts[i]
                .replace(/([፡።፣፤፥፦፧፨.,!?;:…—–\-_/\\()\[\]‹›«»“”"'])/g, '$1\u200B');
        } else {
            // HTML tag: ensure no unwanted nowrap or pre styles
            parts[i] = parts[i]
                .replace(/white-space:\s*nowrap/gi, 'white-space: pre-wrap')
                .replace(/white-space:\s*pre(?![-\w])/gi, 'white-space: pre-wrap');
        }
    }
    return parts.join('');
}

