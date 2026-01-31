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

export interface ExtractedScripts {
  scripts: string[];
  contentWithoutScripts: string;
}

export interface SanitizeResult {
  sanitized: string;
  scriptCount: number;
}

export const extractScripts = (content: string): ExtractedScripts => {
  const scripts: string[] = [];
  const contentWithoutScripts = content.replace(
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    (match) => {
      scripts.push(match);
      return "";
    },
  );

  return { scripts, contentWithoutScripts };
};

export const sanitizeHtml = (content: string): string =>
  DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS,
  });

export const sanitizeContent = (content: string): SanitizeResult => {
  const { scripts, contentWithoutScripts } = extractScripts(content);
  let sanitized = sanitizeHtml(contentWithoutScripts);

  if (scripts.length > 0) {
    sanitized = sanitized + "\n" + scripts.join("\n");
  }

  return { sanitized, scriptCount: scripts.length };
};
