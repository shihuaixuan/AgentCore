import { cleanNativeUserText } from "./nativeUserText";
import type { Fields } from "./qwenWorkAttribution";
import { ImportValidationError } from "./validation";

const contextStart = "<qw-agent-content>";
const contextLine = /^[ \t]*<\/?qw-agent-content>/m;
const envelope =
  /^\s*<(?:system-(?:reminder|prompt)|user_query|command-(?:message|name|args)|local-command-stdout)\b/;
const empty = { text: "", omitted: true, files: false };

function verbatim(part: Fields) {
  return (
    part.literal === true ||
    part.editorBody === "start" ||
    part.editorBody === "continue"
  );
}

function outsideExpertContext(parts: Fields[]) {
  const visible: Fields[] = [];
  let depth = 0;
  let wrapped = false;
  for (const part of parts) {
    const text =
      part.type === "text" && typeof part.text === "string" ? part.text : "";
    if (!depth && (verbatim(part) || !contextLine.test(text))) {
      visible.push(part);
      continue;
    }
    wrapped = true;
    let end = 0;
    for (const marker of text.matchAll(/<\/?qw-agent-content>/g)) {
      const prefix = text.slice(end, marker.index);
      if (!depth && prefix.trim()) visible.push({ type: "text", text: prefix });
      depth += marker[0] === contextStart ? 1 : -1;
      if (depth < 0) return;
      end = marker.index + marker[0].length;
    }
    const tail = text.slice(end);
    if (!depth && tail.trim()) visible.push({ type: "text", text: tail });
  }
  if (!depth) return { visible, wrapped };
}

function editorText(parts: Fields[]) {
  const marked = parts.filter((part) => part.editorBody != null);
  if (!marked.length) return;
  const start = parts.findIndex((part) => part.editorBody === "start");
  if (
    start < 0 ||
    marked.some(
      (part, index) =>
        part !== parts[start + index] ||
        (index > 0 && part.editorBody !== "continue"),
    )
  )
    return empty;
  const text = marked.map((part) => part.text).join("");
  const adjacent = parts.some(
    (part) =>
      part.editorBody == null &&
      String(part.text).trim() &&
      (verbatim(part) || cleanNativeUserText(String(part.text)).trim()),
  );
  return { text, omitted: adjacent, files: !adjacent };
}

export function qwenWorkUserBody(parts: Fields[]) {
  const outside = outsideExpertContext(parts);
  if (!outside) return empty;
  const inline = outside.visible.filter(
    (part) => part.type === "text" || part.type === "link",
  );
  if (inline.some((part) => typeof part.text !== "string"))
    throw new ImportValidationError("conversation");
  const editor = editorText(inline);

  const marked: string[] = [];
  const plain: string[] = [];
  let wrapped = outside.wrapped;
  let uncertain = false;
  for (const part of inline) {
    const text = part.text as string;
    const systemQuery =
      /^\s*<system-(?:reminder|prompt)\b/.test(text) &&
      text.trimEnd().endsWith("</user_query>");
    if ((!verbatim(part) || systemQuery) && envelope.test(text)) {
      wrapped = true;
      const cleaned = cleanNativeUserText(text);
      const query = text
        .trimEnd()
        .endsWith(`<user_query>${cleaned}</user_query>`);
      if (
        cleaned !== text &&
        cleaned.trim() &&
        (query || !envelope.test(cleaned))
      )
        marked.push(cleaned);
      else if (cleaned.trim()) uncertain = true;
    } else plain.push(text);
  }
  if (editor && !marked.length)
    return {
      ...editor,
      files: editor.files && !wrapped,
      omitted: editor.omitted || uncertain,
    };
  if (wrapped) {
    const omitted =
      uncertain || plain.some((text) => text.trim()) || marked.length > 1;
    return {
      text: marked.length === 1 ? marked[0] : "",
      omitted,
      files: false,
    };
  }
  const text = inline.some((part) => verbatim(part) || part.type === "link")
    ? plain.join("")
    : plain.filter((part) => part.trim()).join("\n");
  return { text, omitted: false, files: true };
}
