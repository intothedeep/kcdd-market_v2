/**
 * sanitizeStoryHtml — DOMPurify-backed sanitizer for campaign story HTML.
 *
 * Renders TipTap-authored story bodies safely via dangerouslySetInnerHTML.
 * Allowlist is aligned with the TipTap extensions enabled in the editor:
 * StarterKit + Image, Link, Placeholder, TextAlign, Underline.
 *
 * H5-B (M3): closes XSS-via-story_content by stripping event handlers,
 * <script>, <iframe>, <object>, <embed>, and unsafe href/src schemes.
 *
 * Docs: https://github.com/cure53/DOMPurify
 */

import DOMPurify from 'dompurify'

const STORY_ALLOWED_TAGS = [
  // StarterKit text + block
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'code',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'ul',
  'ol',
  'li',
  'hr',
  // Image extension
  'img',
  // Link extension
  'a',
  // TextAlign extension emits style attr on these — see attrs below
  'span',
  'div',
]

const STORY_ALLOWED_ATTRS = [
  'href',
  'src',
  'alt',
  'title',
  'class',
  'style',
  'target',
  'rel',
  'width',
  'height',
]

const SAFE_URL_SCHEME = /^(https?:|mailto:|\/|#)/i

let hookInstalled = false

function ensureHooksInstalled(): void {
  if (hookInstalled) return
  hookInstalled = true

  // After-sanitize hook: force safe link targets + strip unsafe href/src schemes.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Tag name varies across browser implementations; normalize.
    const tag = node.tagName?.toLowerCase?.()

    if (tag === 'a') {
      const href = node.getAttribute('href')
      if (href && !SAFE_URL_SCHEME.test(href.trim())) {
        node.removeAttribute('href')
      }
      // External link hardening: open in new tab without leaking opener.
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }

    if (tag === 'img') {
      const src = node.getAttribute('src')
      if (src && !SAFE_URL_SCHEME.test(src.trim())) {
        node.removeAttribute('src')
      }
    }
  })
}

export function sanitizeStoryHtml(input: string): string {
  ensureHooksInstalled()
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: STORY_ALLOWED_TAGS,
    ALLOWED_ATTR: STORY_ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
  })
}
