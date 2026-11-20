const systemOpen =
  /<(system-reminder)(?: data-role=(?:"(?:user-context|additional-data)"|'(?:user-context|additional-data)'))?>|<(system-prompt)>/y;
const lineEnd = /[ \t]*(?:\r\n|\n|\r|$)/y;
const queryOpen = "<user_query>";
const queryClose = "</user_query>";

function markerStart(text: string, from: number) {
  const blankLinesAndIndent = /(?:[ \t]*(?:\r\n|\n|\r))* {0,3}/y;
  blankLinesAndIndent.lastIndex = from;
  blankLinesAndIndent.test(text);
  return blankLinesAndIndent.lastIndex;
}

function systemBlockEnd(text: string, from: number, closing: string) {
  const markers =
    /^ {0,3}(`{3,}|~{3,})([^\r\n]*)|<\/system-(?:reminder|prompt)>/gm;
  markers.lastIndex = from;
  let fence: string | undefined;
  for (const match of text.matchAll(markers)) {
    const [token, delimiter, rest] = match;
    if (delimiter) {
      if (!fence) fence = delimiter;
      else if (
        delimiter[0] === fence[0] &&
        delimiter.length >= fence.length &&
        /^[ \t]*$/.test(rest)
      ) {
        fence = undefined;
      }
    } else if (!fence && token === closing) {
      lineEnd.lastIndex = match.index + token.length;
      return lineEnd.test(text) ? lineEnd.lastIndex : undefined;
    }
  }
}

export function cleanNativeUserText(text: string): string {
  let start = 0;
  for (;;) {
    systemOpen.lastIndex = markerStart(text, start);
    const opening = systemOpen.exec(text);
    if (!opening) break;

    const closing = `</${opening[1] ?? opening[2]}>`;
    const end = systemBlockEnd(text, systemOpen.lastIndex, closing);
    if (end === undefined) break;
    start = end;
  }

  const queryStart = markerStart(text, start);
  if (text.startsWith(queryOpen, queryStart)) {
    const queryEnd = text.trimEnd().length - queryClose.length;
    const contentStart = queryStart + queryOpen.length;
    if (queryEnd >= contentStart && text.startsWith(queryClose, queryEnd)) {
      return text.slice(contentStart, queryEnd);
    }
  }

  const remaining = text.slice(start);
  return start && !remaining.trim() ? "" : remaining;
}
