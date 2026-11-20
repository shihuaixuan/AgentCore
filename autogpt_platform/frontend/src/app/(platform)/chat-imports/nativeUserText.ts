const systemOpen =
  /<(system-reminder)(?: data-role=(?:"(?:user-context|additional-data)"|'(?:user-context|additional-data)'))?>|<(system-prompt)>/y;
const workBuddyOpen =
  /<(system-reminder)(?:\s+data-role\s*=\s*(?:"[\w-]+"|'[\w-]+'))?\s*>|<(system-prompt)\s*>/y;
const lineEnd = /[ \t]*(?:\r\n|\n|\r|$)/y;
const queryOpen = "<user_query>";
const queryClose = "</user_query>";

function markerStart(text: string, from: number) {
  const blankLinesAndIndent = /(?:[ \t]*(?:\r\n|\n|\r))* {0,3}/y;
  blankLinesAndIndent.lastIndex = from;
  blankLinesAndIndent.test(text);
  return blankLinesAndIndent.lastIndex;
}

function* closingMarkers(text: string, from: number) {
  const markers =
    /^ {0,3}(`{3,}|~{3,})([^\r\n]*)|<\/(?:system-reminder|system-prompt|user_query)>/gm;
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
    } else if (!fence) yield { token, end: match.index + token.length };
  }
}

function systemBlockEnd(
  text: string,
  from: number,
  closing: string,
  adjacent: boolean,
) {
  for (const { token, end } of closingMarkers(text, from)) {
    if (token !== closing) continue;
    lineEnd.lastIndex = end;
    if (lineEnd.test(text)) return lineEnd.lastIndex;
    if (
      adjacent &&
      /^(?:<system-reminder\b|<system-prompt>|<user_query>)/.test(
        text.slice(end),
      )
    )
      return end;
    return;
  }
}

function afterReminders(text: string, start: number, workBuddy: boolean) {
  const marker = workBuddy ? workBuddyOpen : systemOpen;
  for (;;) {
    marker.lastIndex = markerStart(text, start);
    const opening = marker.exec(text);
    if (!opening) break;

    const closing = `</${opening[1] ?? opening[2]}>`;
    const end = systemBlockEnd(text, marker.lastIndex, closing, workBuddy);
    if (end === undefined) break;
    start = end;
  }
  return start;
}

function userEnvelope(text: string, workBuddy: boolean) {
  const start = afterReminders(text, 0, workBuddy);
  const queryStart = markerStart(text, start);
  if (text.startsWith(queryOpen, queryStart)) {
    const queryEnd = text.trimEnd().length - queryClose.length;
    const contentStart = queryStart + queryOpen.length;
    if (workBuddy) {
      for (const { token, end } of closingMarkers(text, contentStart)) {
        if (token !== queryClose) continue;
        const next = markerStart(text, end);
        if (
          text.startsWith(queryOpen, next) ||
          text.startsWith("<system-", next)
        ) {
          const suffixEnd = afterReminders(text, end, true);
          if (suffixEnd > end && !text.slice(suffixEnd).trim()) {
            return {
              query: true,
              text: text.slice(contentStart, end - queryClose.length),
            };
          }
          return { query: false, text: "", uncertain: true };
        }
      }
    }
    if (queryEnd >= contentStart && text.startsWith(queryClose, queryEnd)) {
      return { query: true, text: text.slice(contentStart, queryEnd) };
    }
  }

  const remaining = text.slice(start);
  const uncertain =
    workBuddy &&
    ((start > 0 && /^\s*<\/?[\w-]+\b/.test(remaining)) ||
      /^(?:<system-reminder\s+data-role\b|<\/(?:system-reminder|system-prompt)>)/.test(
        text.slice(queryStart),
      ) ||
      /^<(user[-_](?:question|query))\b[^>]*>[\s\S]*<\/\1>\s*$/.test(
        text.slice(queryStart),
      ));
  return {
    query: false,
    text: start && !remaining.trim() ? "" : remaining,
    uncertain,
  };
}

export function cleanNativeUserText(text: string): string {
  return userEnvelope(text, false).text;
}

export function readWorkBuddyUserText(text: string) {
  const envelope = userEnvelope(text, true);
  if (envelope.query) return envelope;
  const body = envelope.text.slice(markerStart(envelope.text, 0));
  if (!body.startsWith("<channel ")) return envelope;
  const channel = /^<channel\s+([^<>]+)>([^<]*)<\/channel>\s*$/.exec(body);
  if (!channel || !/(?:^|\s)source="[^"<>]+"(?:\s|$)/.test(channel[1])) {
    return { query: false, text: "", uncertain: true };
  }
  return {
    query: true,
    text: channel[2]
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&")
      .trim(),
  };
}
