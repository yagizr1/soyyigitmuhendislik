import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "h4", "a", "blockquote"],
  allowedAttributes: {
    a: ["href", "rel", "target"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const safeRelative = href.startsWith("/") && !href.startsWith("//");
      const next = { ...attribs };
      if (!safeRelative && !/^(https?:|mailto:|tel:)/i.test(href)) {
        delete next.href;
      }
      if (next.target === "_blank") {
        next.rel = "noopener noreferrer";
      }
      return { tagName, attribs: next };
    },
  },
};

export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, OPTIONS).trim();
}

export function plainText(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
