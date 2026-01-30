import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "button",
  "input",
  "form",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "header",
  "footer",
  "nav",
  "main",
  "section",
  "article",
  "aside",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "br",
  "hr",
  "label",
  "select",
  "option",
  "textarea",
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "style",
];

const ALLOWED_ATTR = [
  "style",
  "class",
  "id",
  "href",
  "src",
  "alt",
  "title",
  "type",
  "name",
  "value",
  "placeholder",
  "disabled",
  "readonly",
  "width",
  "height",
  "viewBox",
  "fill",
  "stroke",
  "stroke-width",
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "for",
  "rows",
  "cols",
  "target",
  "rel",
];

const FORBID_TAGS = ["iframe", "object", "embed"];

export function extractScripts(content) {
  const scripts = [];
  const contentWithoutScripts = content.replace(
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    (match) => {
      scripts.push(match);
      return "";
    }
  );

  return { scripts, contentWithoutScripts };
}

export function sanitizeHtml(content) {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS,
  });
}

export function sanitizeContent(content) {
  const { scripts, contentWithoutScripts } = extractScripts(content);
  let sanitized = sanitizeHtml(contentWithoutScripts);

  if (scripts.length > 0) {
    sanitized = sanitized + "\n" + scripts.join("\n");
  }

  return { sanitized, scriptCount: scripts.length };
}
