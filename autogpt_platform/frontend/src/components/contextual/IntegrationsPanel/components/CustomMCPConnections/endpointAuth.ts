import type { ConnectionInput } from "@/app/api/__generated__/models/connectionInput";
import type { MCPMethod } from "@/app/api/__generated__/models/mCPMethod";
import type { MethodField } from "@/app/api/__generated__/models/methodField";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import { isDingTalkKeyEndpoint, parseDingTalkKeyURL } from "./dingTalkKeyURL";

export type AuthMethod = ConnectionInput["auth_type"];
export const manualMethods: AuthMethod[] = [
  "none",
  "oauth",
  "bearer",
  "basic",
  "query_key",
];

export type EndpointAuthOption = {
  method: AuthMethod;
  endpoint: string | null;
  authEndpoint?: string | null;
  catalogID?: string;
  methodID?: string;
  fields?: MethodField[];
  fixedParams?: Record<string, string>;
  authParameter?: string;
  authPrefix?: string;
  toolEndpoint?: string | null;
};

export type ServerInput = {
  serverURL: string;
  token: string;
  rejected: boolean;
  catalogID?: string;
  methodID?: string;
  authParameter?: string;
  values?: Record<string, string>;
};

function hasUnsafeURLParts(raw: string) {
  return /[?#@\\]|%(?:25)*(?:3f|23)/i.test(raw);
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

export function readServerInput(
  raw: string,
  providers: ProviderMetadata[] = [],
): ServerInput {
  const input = raw.trim();
  const catalogInput = parseCatalogCredentialURL(input, providers);
  if (catalogInput) return { ...catalogInput, rejected: false };

  const parsed = parseDingTalkKeyURL(input);
  if (parsed) return { ...parsed, rejected: false };

  const generic = parseManualCredentialURL(input);
  if (generic) return { ...generic, rejected: false };

  const rejected = hasUnsafeURLParts(input);
  return { serverURL: rejected ? "" : input, token: "", rejected };
}

export function endpointAuthOptions(
  serverURL: string,
  providers: ProviderMetadata[],
): EndpointAuthOption[] {
  if (!isCleanServerURL(serverURL)) return [];

  for (const { name: catalogID, mcp_server: server } of providers) {
    if (!server) continue;
    const methods = server.methods ?? [];
    const isToolURL =
      server.server_url === serverURL ||
      server.server_url_options?.some((option) => option.url === serverURL);
    const isOAuthURL = server.oauth_server_url === serverURL;
    const pathMethod = methods.find(
      (method) =>
        method.endpoint_path &&
        server.server_url &&
        endpointMatchesPath(serverURL, server.server_url, method.endpoint_path),
    );
    if (!isToolURL && !isOAuthURL && !pathMethod) continue;

    if (methods.length) {
      return methods.map((method) => {
        const toolEndpoint = server.server_url ?? serverURL;
        const endpoint =
          method.auth_type === "oauth"
            ? (server.oauth_server_url ?? serverURL)
            : method.fields?.some((field) => field.type === "secret_url")
              ? pathMethod?.id === method.id
                ? serverURL
                : null
              : isToolURL || pathMethod?.id === method.id
                ? serverURL
                : toolEndpoint;
        return {
          method: method.auth_type,
          endpoint,
          ...(method.auth_type === "oauth"
            ? { authEndpoint: server.oauth_server_url ?? serverURL }
            : {}),
          catalogID,
          methodID: method.id,
          ...(method.fields ? { fields: method.fields } : {}),
          ...(method.fixed_params ? { fixedParams: method.fixed_params } : {}),
          ...(method.name ? { authParameter: method.name } : {}),
          ...(method.auth_prefix ? { authPrefix: method.auth_prefix } : {}),
          toolEndpoint,
        };
      });
    }

    return (server.auth_methods ?? []).map((method) => ({
      method,
      endpoint:
        method === "query_key"
          ? null
          : isToolURL
            ? serverURL
            : (server.server_url ?? serverURL),
      ...(method === "oauth"
        ? { authEndpoint: server.oauth_server_url ?? serverURL }
        : {}),
    }));
  }
  return [];
}

function parseManualCredentialURL(
  raw: string,
): Omit<ServerInput, "rejected"> | null {
  const separator = raw.indexOf("?");
  if (
    separator < 0 ||
    raw.indexOf("?", separator + 1) >= 0 ||
    !/^[\x21-\x7e]+$/.test(raw)
  )
    return null;
  const endpoint = raw.slice(0, separator);
  if (!isCleanServerURL(endpoint)) return null;
  const query = parseQuery(raw.slice(separator + 1));
  if (!query || query.size !== 1) return null;
  const [authParameter, token] = [...query.entries()][0];
  if (
    !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(authParameter) ||
    !isValidSecret(token)
  )
    return null;
  return { serverURL: endpoint, token, authParameter };
}

function parseCatalogCredentialURL(
  raw: string,
  providers: ProviderMetadata[],
): Omit<ServerInput, "rejected"> | null {
  const separator = raw.indexOf("?");
  if (
    separator < 0 ||
    raw.indexOf("?", separator + 1) >= 0 ||
    !/^[\x21-\x7e]+$/.test(raw)
  )
    return null;
  const endpoint = raw.slice(0, separator);
  if (!isCleanServerURL(endpoint)) return null;
  const query = parseQuery(raw.slice(separator + 1));
  if (!query) return null;

  for (const { name: catalogID, mcp_server: server } of providers) {
    for (const method of server?.methods ?? []) {
      const field = method.fields?.find((item) => item.type === "secret_url");
      if (
        method.auth_type !== "query_key" ||
        !field ||
        !method.name ||
        !server ||
        !matchesMethodEndpoint(endpoint, server, method)
      )
        continue;
      const secret = query.get(method.name);
      if (!secret || !isValidSecret(secret)) continue;
      const fixed = method.fixed_params ?? {};
      if (
        new Set([...query.keys()].filter((name) => name !== method.name))
          .size !== Object.keys(fixed).length ||
        [...query].some(
          ([name, value]) => name !== method.name && fixed[name] !== value,
        )
      )
        continue;
      return {
        serverURL: endpoint,
        token: "",
        catalogID,
        methodID: method.id,
        values: { [field.id]: raw },
      };
    }
  }
  return null;
}

function parseQuery(raw: string): Map<string, string> | null {
  if (!raw || raw.includes("#")) return null;
  const result = new Map<string, string>();
  for (const pair of raw.split("&")) {
    const separator = pair.indexOf("=");
    if (separator <= 0 || separator !== pair.lastIndexOf("=")) return null;
    try {
      const name = decodeURIComponent(
        pair.slice(0, separator).replace(/\+/g, " "),
      );
      const value = decodeURIComponent(
        pair.slice(separator + 1).replace(/\+/g, " "),
      );
      if (!name || result.has(name)) return null;
      result.set(name, value);
    } catch {
      return null;
    }
  }
  return result;
}

function isValidSecret(value: string) {
  return /^[!-~]{1,8192}$/.test(value);
}

function matchesMethodEndpoint(
  candidate: string,
  server: NonNullable<ProviderMetadata["mcp_server"]>,
  method: MCPMethod,
) {
  if (
    method.endpoint_path &&
    server.server_url &&
    endpointMatchesPath(candidate, server.server_url, method.endpoint_path)
  )
    return true;
  return (
    candidate === server.server_url ||
    server.server_url_options?.some((option) => option.url === candidate) ||
    false
  );
}

function endpointMatchesPath(
  candidate: string,
  base: string,
  template: string,
): boolean {
  try {
    const candidateURL = new URL(candidate);
    const baseURL = new URL(base);
    if (candidateURL.origin !== baseURL.origin) return false;
    const templateParts = template.split("/").filter(Boolean);
    const pathParts = candidateURL.pathname.split("/").filter(Boolean);
    return (
      templateParts.length === pathParts.length &&
      templateParts.every((part, index) =>
        /^\{[a-z][a-z0-9_]{0,63}\}$/.test(part)
          ? /^[A-Za-z0-9_-]{1,256}$/.test(pathParts[index])
          : part === pathParts[index],
      )
    );
  } catch {
    return false;
  }
}

export function isLegacyDingTalkKeyURL(raw: string) {
  return isDingTalkKeyEndpoint(raw);
}

export function parseCatalogQueryCredentialURL(
  raw: string,
  server: NonNullable<ProviderMetadata["mcp_server"]>,
  method: MCPMethod,
): { serverURL: string; token: string } | null {
  const input = raw.trim();
  const separator = input.indexOf("?");
  if (
    separator < 0 ||
    input.indexOf("?", separator + 1) >= 0 ||
    !/^[\x21-\x7e]+$/.test(input)
  )
    return null;
  const serverURL = input.slice(0, separator);
  if (method.auth_type !== "query_key" || !method.name) return null;
  if (!isCleanServerURL(serverURL)) return null;
  const query = parseQuery(input.slice(separator + 1));
  if (!query) return null;
  const token = query.get(method.name);
  if (!token || !isValidSecret(token)) return null;
  const fixed = method.fixed_params ?? {};
  if (
    new Set([...query.keys()].filter((name) => name !== method.name)).size !==
      Object.keys(fixed).length ||
    [...query].some(
      ([name, value]) => name !== method.name && fixed[name] !== value,
    ) ||
    !matchesMethodEndpoint(serverURL, server, method)
  )
    return null;
  return { serverURL, token };
}
