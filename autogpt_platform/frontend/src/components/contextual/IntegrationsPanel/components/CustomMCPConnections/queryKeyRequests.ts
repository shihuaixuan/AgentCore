import {
  getPostV2DiscoverAvailableToolsOnAnMcpServerUrl,
  getPostV2StoreABearerTokenForAnMcpServerUrl,
  type postV2DiscoverAvailableToolsOnAnMcpServerResponse,
  type postV2StoreABearerTokenForAnMcpServerResponse,
} from "@/app/api/__generated__/endpoints/mcp/mcp";
import type { DiscoverToolsRequest } from "@/app/api/__generated__/models/discoverToolsRequest";
import type { MCPStoreTokenRequest } from "@/app/api/__generated__/models/mCPStoreTokenRequest";
import { customMutator } from "@/app/api/mutators/custom-mutator";

export function storeQueryKey(
  serverURL: string,
  token: string,
  options?: {
    catalogID?: string;
    authParameter?: string;
    signal?: AbortSignal;
  },
) {
  const body: MCPStoreTokenRequest = {
    server_url: serverURL,
    token,
    auth_type: "query_key",
    ...(options?.catalogID
      ? { catalog_id: options.catalogID }
      : { isolated: true }),
    ...(options?.authParameter
      ? { auth_parameter: options.authParameter }
      : {}),
  };
  return customMutator<postV2StoreABearerTokenForAnMcpServerResponse>(
    getPostV2StoreABearerTokenForAnMcpServerUrl(),
    {
      method: "POST",
      body: JSON.stringify(body),
      redirect: "error",
      signal: options?.signal,
    },
    { sensitive: true },
  );
}

export function probeWithQueryKey(body: DiscoverToolsRequest) {
  return customMutator<postV2DiscoverAvailableToolsOnAnMcpServerResponse>(
    getPostV2DiscoverAvailableToolsOnAnMcpServerUrl(),
    { method: "POST", body: JSON.stringify(body), redirect: "error" },
    { sensitive: true },
  );
}
