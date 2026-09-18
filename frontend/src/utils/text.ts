/**
 * Normalizes poem content before rendering.
 * Replaces non-breaking spaces (&nbsp; or \u00A0) with standard spaces so that the browser
 * line-breaking engine can wrap long lines at word boundaries.
 * In combination with CSS white-space: pre-wrap, consecutive spaces and stanza line breaks
 * are preserved visually while allowing wrapping instead of overflowing.
 */
export function formatPoemContent(content: string | undefined | null): string {
    if (!content) return '';
    return content
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/white-space:\s*nowrap/gi, 'white-space: pre-wrap')
        .replace(/white-space:\s*pre(?![-\w])/gi, 'white-space: pre-wrap');
}
