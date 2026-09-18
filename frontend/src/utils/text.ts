/**
 * Normalizes poem content before rendering.
 * Replaces non-breaking spaces (&nbsp;, &amp;nbsp;, \u00A0) with standard spaces so that
 * the browser line-breaking engine can wrap long lines at word boundaries.
 * Also appends a zero-width space (\u200B) after Ethiopic word separators (፡) and punctuation (።፣፤፥፦፧፨)
 * so that browsers running Unicode Line Breaking Algorithms can cleanly wrap long lines of
 * Ethiopic poetry at word and clause boundaries without overflowing the mobile viewport.
 */
export function formatPoemContent(content: string | undefined | null): string {
    if (!content) return '';
    return content
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ')
        // Ensure line-break opportunities after Ethiopic word separator and punctuation
        .replace(/([፡።፣፤፥፦፧፨])/g, '$1\u200B')
        .replace(/white-space:\s*nowrap/gi, 'white-space: pre-wrap')
        .replace(/white-space:\s*pre(?![-\w])/gi, 'white-space: pre-wrap');
}
