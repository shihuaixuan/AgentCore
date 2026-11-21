import type { ConnectionResponse } from "@/app/api/__generated__/models/connectionResponse";
import type { MCPMethod } from "@/app/api/__generated__/models/mCPMethod";
import type { MCPServerMetadata } from "@/app/api/__generated__/models/mCPServerMetadata";
import { customMutator } from "@/app/api/mutators/custom-mutator";

export type CatalogMethod = MCPMethod;

export type CatalogServer = MCPServerMetadata & {
  definition_version?: number | string;
  methods?: CatalogMethod[];
};

export type CatalogAccount = ConnectionResponse & {
  connector_id: string;
  method_id: string;
  definition_version?: number | string;
};

export function matchesDefinition(row: CatalogAccount, server: CatalogServer) {
  return (
    (!row.definition_version ||
      row.definition_version === server.definition_version) &&
    server.methods?.some((method) => method.id === row.method_id)
  );
}

export function isCatalogAccount(
  row: ConnectionResponse,
): row is CatalogAccount {
  return (
    "connector_id" in row &&
    typeof row.connector_id === "string" &&
    !!row.connector_id &&
    "method_id" in row &&
    typeof row.method_id === "string" &&
    !!row.method_id
  );
}

export function hasCatalogMethods(
  server?: CatalogServer | null,
): server is CatalogServer & { methods: CatalogMethod[] } {
  return (
    server?.connection_mode === "hosted" &&
    Array.isArray(server.methods) &&
    server.methods.length > 0
  );
}

export function accountLabel(
  row: ConnectionResponse,
  peers: ConnectionResponse[],
) {
  return peers.some((other) => other.id !== row.id && other.name === row.name)
    ? `${row.name} · ${row.id}`
    : row.name;
}

export function cleanEndpoint(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !/[?#]/.test(value)
    )
      return value;
  } catch {
    /* Not a hosted endpoint. */
  }
  return undefined;
}

async function request<T>(
  path: string,
  method: string,
  signal?: AbortSignal,
  body?: unknown,
) {
  const response = await customMutator<{
    status: number;
    data: T;
    headers: Headers;
  }>(
    `/api/mcp/${path}`,
    {
      method,
      signal,
      redirect: "error",
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
    { sensitive: true },
  );
  if (response.status < 200 || response.status >= 300)
    throw new Error("Connection request failed");
  return response.data;
}

export async function saveCatalogAccount(
  body: {
    connector_id: string;
    method_id: string;
    values: Record<string, string>;
    server_url?: string;
    credential_id?: string;
    name?: string;
  },
  signal: AbortSignal,
) {
  const row = await request<CatalogAccount>(
    "catalog-connections",
    "POST",
    signal,
    body,
  );
  if (
    !row?.id ||
    !row.enabled ||
    row.connector_id !== body.connector_id ||
    row.method_id !== body.method_id ||
    (body.credential_id && row.credential_id !== body.credential_id)
  ) {
    throw new Error("Unexpected connection response");
  }
  return row;
}

export const expertAccountKey = (expertID: string) =>
  ["mcp-connection-access", expertID] as const;

export async function listExpertAccounts(
  expertID: string,
  signal: AbortSignal,
) {
  const ids = await request<string[]>(
    `connections/expert/${encodeURIComponent(expertID)}`,
    "GET",
    signal,
  );
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string"))
    throw new Error("Unexpected access list");
  return ids;
}

export function setExpertAccount(
  expertID: string,
  accountID: string,
  grant: boolean,
  signal?: AbortSignal,
) {
  return request(
    `connections/expert/${encodeURIComponent(expertID)}/${encodeURIComponent(accountID)}`,
    grant ? "PUT" : "DELETE",
    signal,
  );
}
