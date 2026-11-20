export const dingTalkMailURL = "https://mcp-gw.dingtalk.com/oauth/server/mail";

export function isDingTalkKeyEndpoint(serverURL: string): boolean {
  const origin = /^https:\/\/mcp-gw\.dingtalk\.com(?::443)?(?=\/)/i.exec(
    serverURL,
  );
  return (
    !!origin &&
    /^\/server\/[A-Za-z0-9_-]+$/.test(serverURL.slice(origin[0].length))
  );
}

export function isValidQueryKey(token: string): boolean {
  return /^[!-~]{1,8192}$/.test(token);
}

export function parseDingTalkKeyURL(
  raw: string,
): { serverURL: string; token: string } | null {
  const input = raw.trim();
  const separator = input.indexOf("?");
  if (separator < 0) return null;
  const serverURL = input.slice(0, separator);
  const key = /^key=([^&;#?\s]+)$/.exec(input.slice(separator + 1));
  if (!isDingTalkKeyEndpoint(serverURL) || !key) return null;
  try {
    const token = decodeURIComponent(key[1].replace(/\+/g, " "));
    if (!isValidQueryKey(token)) return null;
    return { serverURL, token };
  } catch {
    return null;
  }
}
