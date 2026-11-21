import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  postV2BindExistingQueryKey,
  useGetV2ListBindableQueryKeys,
} from "@/app/api/__generated__/endpoints/mcp/mcp";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import { invalidateConnectionQueries } from "@/lib/react-query/invalidateConnections";
import { parseCatalogQueryCredentialURL } from "../../../CustomMCPConnections/endpointAuth";
import { storeQueryKey } from "../../../CustomMCPConnections/queryKeyRequests";

export function useQueryCredential(
  catalogID: string,
  server: NonNullable<ProviderMetadata["mcp_server"]>,
  onSuccess: (credential: CredentialsMetaResponse) => void,
) {
  const queryClient = useQueryClient();
  const available = useGetV2ListBindableQueryKeys(catalogID, {
    query: { staleTime: 0, gcTime: 0 },
  });
  const choices = available.data?.status === 200 ? available.data.data : [];
  const method =
    server.methods?.find((entry) => entry.auth_type === "query_key") ??
    (server.auth_methods?.includes("query_key")
      ? {
          id: "query_key",
          kind: "user_input" as const,
          label: "API Key URL",
          fields: [
            { id: "url", label: "Complete URL", type: "secret_url" as const },
          ],
          auth_type: "query_key" as const,
          name: "key",
        }
      : undefined);
  const [selectedID, setSelectedID] = useState("");
  const selected = choices.find((row) => row.id === selectedID);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  const parsed = method
    ? parseCatalogQueryCredentialURL(value, server, method)
    : null;

  function change(next: string) {
    setSelectedID("");
    setValue(next);
    setFailed(false);
  }

  function select(id: string) {
    setSelectedID(id);
    setValue("");
    setFailed(false);
  }

  async function save() {
    if ((!selected && !parsed) || active.current || !method) return;
    const controller = new AbortController();
    active.current = controller;
    setSaving(true);
    setFailed(false);
    try {
      const stored = parsed
        ? await storeQueryKey(parsed.serverURL, parsed.token, {
            catalogID,
            authParameter: method.name ?? undefined,
            signal: controller.signal,
          })
        : await postV2BindExistingQueryKey(
            catalogID,
            { credential_id: selectedID },
            { signal: controller.signal, redirect: "error" },
          );
      controller.signal.throwIfAborted();
      if (stored.status !== 200) throw new Error("Connection not saved");
      setValue("");
      setSelectedID("");
      await invalidateConnectionQueries(queryClient);
      if (!controller.signal.aborted) onSuccess(stored.data);
    } catch {
      if (!controller.signal.aborted) {
        setFailed(true);
        if (selected) {
          setSelectedID("");
          void available.refetch();
        }
      }
    } finally {
      active.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  return {
    value,
    change,
    choices,
    selectedID,
    select,
    canBind: !!selected && !saving,
    canSave: !!parsed && !saving,
    save,
    saving,
    failed,
    choicesFailed:
      available.isError || (!!available.data && available.data.status !== 200),
    retryChoices: available.refetch,
  };
}
