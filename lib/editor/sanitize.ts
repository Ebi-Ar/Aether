import DOMPurify from 'dompurify';

// Element content is user-controlled and travels inside share links, so it is
// cleaned (scripts, event handlers and javascript: URLs removed) before it
// reaches the DOM. DOMPurify can't run on the server, where it would return its
// input unchanged, so nothing is rendered there; element content only exists
// on the client anyway.
export function sanitizeHtml(html: string): string {
    if (typeof window === 'undefined' || !DOMPurify.isSupported) return '';
    return DOMPurify.sanitize(html);
}
