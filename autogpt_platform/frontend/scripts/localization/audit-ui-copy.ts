import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const DISPLAY_ATTRIBUTES = new Set([
  "placeholder",
  "title",
  "aria-label",
  "alt",
  "label",
  "description",
  "emptyMessage",
  "loadingText",
  "errorMessage",
  "hint",
  "tooltip",
]);
const TECHNICAL_COPY = new Set([
  "AutoGPT",
  "AutoPilot",
  "Copilot",
  "Otto",
  "ChatGPT",
  "Claude",
  "OpenAI",
  "Anthropic",
  "Google",
  "Microsoft",
  "Microsoft 365",
  "Work IQ",
  "OneDrive",
  "Teams",
  "Discord",
  "Telegram",
  "Slack",
  "WhatsApp",
  "GitHub",
  "Stripe",
  "YouTube",
  "Notion",
  "Linear",
  "PostHog",
  "Pro",
  "Max",
  "MCP",
  "API",
  "JSON",
  "CSV",
  "HTML",
  "CSS",
  "XML",
  "PDF",
  "URL",
  "HTTP",
  "HTTPS",
  "OAuth",
  "OAuth 2.0",
  "UTC",
  "GMT",
  "SQL",
  "JWT",
  "ID",
  "IP",
  "AI",
  "UTF-8",
  "N/A",
  "reCAPTCHA",
  "Mac",
  "Windows",
  "Linux",
  "ChatGPT / Codex",
  "True",
  "False",
  "null",
  "undefined",
  "NaN",
  "Infinity",
  "Cmd",
  "Ctrl",
  "Enter",
  "Esc",
  "esc",
  "Microsoft 365 Copilot",
  "Authorization",
  "Bearer",
  "sk-...",
]);

export interface CopyFinding {
  file: string;
  line: number;
  kind: string;
  text: string;
}

function isTechnical(text: string) {
  return (
    TECHNICAL_COPY.has(text) ||
    /^(?:https?:\/\/|www\.|mailto:|[\w.+-]+@[\w.-]+\.)/.test(text) ||
    /^(?:\/[\w.[\]/-]+|[\w.-]+\.(?:json|csv|txt|md|ts|tsx|js|py|png|svg|com))$/.test(
      text,
    ) ||
    /^[A-Z][A-Z\d_./+ -]*$/.test(text) ||
    /^[a-z]+(?:_[a-z\d]+)+$/.test(text) ||
    /^[a-z]+(?:[A-Z][a-z\d]*)+$/.test(text) ||
    /^(?:GET|POST|PATCH|PUT|DELETE) \/[\w/-]+$/.test(text)
  );
}

function hasUntranslatedWords(text: string) {
  const brands = [...TECHNICAL_COPY].sort(
    (first, second) => second.length - first.length,
  );
  let remainder = text.replaceAll("{value}", "");
  for (const brand of brands) {
    remainder = remainder.replaceAll(brand, "");
  }
  return /[A-Za-z]{2,}/.test(remainder);
}

function isLocalizedBranch(node: ts.ConditionalExpression) {
  return (
    /\b(?:locale|language|chinese|isChinese)\b/.test(
      node.condition.getText(),
    ) &&
    /[\u3400-\u9fff]/.test(node.whenTrue.getText() + node.whenFalse.getText())
  );
}

function isCode(node: ts.Node) {
  let parent: ts.Node | undefined = node.parent;
  while (parent) {
    if (
      ts.isJsxElement(parent) &&
      ["code", "pre", "script", "style"].includes(
        parent.openingElement.tagName.getText(),
      )
    )
      return true;
    parent = parent.parent;
  }
  return false;
}

export function auditUICopy(
  sourceText: string,
  file = "component.tsx",
): CopyFinding[] {
  const scriptKind = file.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const findings: CopyFinding[] = [];
  function add(node: ts.Node, text: string, kind: string) {
    const normalized = text
      .replace(/&(?:apos|quot|nbsp|ldquo|rdquo|lsquo|rsquo|amp|middot);/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (
      !hasUntranslatedWords(normalized) ||
      isTechnical(normalized) ||
      isCode(node)
    )
      return;
    findings.push({
      file,
      line:
        source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      kind,
      text: normalized,
    });
  }
  function expression(node: ts.Expression) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      add(node, node.text, "expression");
    else if (ts.isTemplateExpression(node))
      add(
        node,
        [
          node.head.text,
          ...node.templateSpans.map((span) => span.literal.text),
        ].join("{value}"),
        "template",
      );
    else if (ts.isConditionalExpression(node) && !isLocalizedBranch(node)) {
      expression(node.whenTrue);
      expression(node.whenFalse);
    } else if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.QuestionQuestionToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.AmpersandAmpersandToken,
      ].includes(node.operatorToken.kind)
    )
      expression(node.right);
  }
  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) add(node, node.text, "text");
    if (
      ts.isJsxAttribute(node) &&
      DISPLAY_ATTRIBUTES.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    )
      add(
        node,
        node.initializer.text,
        `attribute:${node.name.getText(source)}`,
      );
    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      (!ts.isJsxAttribute(node.parent) ||
        DISPLAY_ATTRIBUTES.has(node.parent.name.getText(source)))
    )
      expression(node.expression);
    if (
      ts.isCallExpression(node) &&
      /^(?:toast|(?:sonnerToast|toast)\.(?:success|error|warning|info))$/.test(
        node.expression.getText(source),
      )
    ) {
      for (const argument of node.arguments) {
        if (ts.isObjectLiteralExpression(argument)) {
          for (const property of argument.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              ["title", "description"].includes(property.name.getText(source))
            )
              expression(property.initializer);
          }
        } else if (node.expression.getText(source) !== "toast")
          expression(argument);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return findings;
}

export function auditDirectory(root: string): CopyFinding[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (
      [
        "__tests__",
        "__generated__",
        "playwright",
        "mocks",
        "tests",
        "styleguide",
      ].includes(entry.name)
    )
      return [];
    const filename = path.join(root, entry.name);
    if (entry.isDirectory()) return auditDirectory(filename);
    return /\.tsx?$/.test(entry.name) &&
      !/\.(?:test|spec|stories)\.tsx?$/.test(entry.name)
      ? auditUICopy(fs.readFileSync(filename, "utf8"), filename)
      : [];
  });
}
