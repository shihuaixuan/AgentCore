import type { ConnectionInput } from "@/app/api/__generated__/models/connectionInput";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import {
  dingTalkMailURL,
  isDingTalkKeyEndpoint,
  parseDingTalkKeyURL,
} from "./dingTalkKeyURL";

export type AuthMethod = ConnectionInput["auth_type"];
export const manualMethods: AuthMethod[] = ["none", "oauth", "bearer", "basic"];

function hasUnsafeURLParts(raw: string) {
  return /[?#@\\]|%(?:25)*(?:3f|23)|(?:[;&/]|^)key=/i.test(raw);
}

export function isCleanServerURL(raw: string) {
  if (
    !/^https:\/\/[^/]/i.test(raw) ||
    hasUnsafeURLParts(raw) ||
    /\s/.test(raw) ||
    Array.from(raw).some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    )
  )
    return false;
  try {
    const url = new URL(raw);
    return Boolean(url.hostname) && url.port !== "0";
  } catch {
    return false;
  }
}

export function readServerInput(raw: string) {
  const parsed = parseDingTalkKeyURL(raw);
  if (parsed) return { ...parsed, rejected: false };
  const rejected = hasUnsafeURLParts(raw);
  return { serverURL: rejected ? "" : raw.trim(), token: "", rejected };
}

type Option = { method: AuthMethod; endpoint: string | null };

export function endpointAuthOptions(
  serverURL: string,
  providers: ProviderMetadata[],
): Option[] {
  if (!isCleanServerURL(serverURL)) return [];
  if (serverURL === dingTalkMailURL) {
    return [
      { method: "oauth", endpoint: serverURL },
      { method: "query_key", endpoint: null },
    ];
  }
  if (isDingTalkKeyEndpoint(serverURL))
    return [{ method: "query_key", endpoint: serverURL }];

  for (const { mcp_server: server } of providers) {
    if (!server) continue;
    const isToolURL =
      server.server_url === serverURL ||
      server.server_url_options?.some((option) => option.url === serverURL);
    if (!isToolURL && server.oauth_server_url !== serverURL) continue;
    return server.auth_methods.map((method) => ({
      method,
      endpoint:
        method === "oauth" && server.oauth_server_url
          ? server.oauth_server_url
          : isToolURL
            ? serverURL
            : (server.server_url ?? null),
    }));
  }
  return [];
}
