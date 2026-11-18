import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  deleteV2DeleteConnection,
  getGetV2ListConnectionsQueryKey,
  postV2CreateConnection,
  postV2DiscoverAvailableToolsOnAnMcpServer,
  putV2UpdateConnection,
  useGetV2ListConnections,
} from "@/app/api/__generated__/endpoints/mcp/mcp";
import type { ConnectionInput } from "@/app/api/__generated__/models/connectionInput";
import type { ConnectionResponse } from "@/app/api/__generated__/models/connectionResponse";
import { connectMCPOAuth } from "@/lib/mcp-oauth";
import { getAPIResponseError, getErrorMessage } from "@/lib/mcp-errors";
import { invalidateConnectionQueries } from "@/lib/react-query/invalidateConnections";
import { storeMCPToken } from "../ConnectServiceDialog/components/DetailView/storeMCPToken";

const blank: ConnectionInput = {
  name: "",
  description: "",
  server_url: "",
  auth_type: "none",
  enabled: true,
};

export function useCustomMCPConnections({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const query = useGetV2ListConnections({ query: { enabled } });
  const { t } = useTranslation();
  const [form, setForm] = useState<ConnectionInput>(blank);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<ConnectionResponse | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function create() {
    setForm(blank);
    setEditingID(null);
    setToken("");
    setError(null);
    setOpen(true);
  }

  function edit(connection: ConnectionResponse) {
    setForm({
      name: connection.name,
      description: connection.description,
      server_url: connection.server_url,
      auth_type: connection.auth_type,
      credential_id: connection.credential_id,
      enabled: connection.enabled,
    });
    setEditingID(connection.id);
    setToken("");
    setError(null);
    setOpen(true);
  }

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: getGetV2ListConnectionsQueryKey(),
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const existing =
        query.data?.status === 200
          ? query.data.data.find((connection) => connection.id === editingID)
          : undefined;
      if (
        existing &&
        form.enabled === false &&
        !token &&
        form.server_url === existing.server_url &&
        form.auth_type === existing.auth_type &&
        form.credential_id === existing.credential_id
      ) {
        const response = await putV2UpdateConnection(existing.id, form);
        if (response.status !== 200)
          throw getAPIResponseError(response.status, response.data);
        await refresh();
        setOpen(false);
        return;
      }
      if (!form.server_url.trim().toLowerCase().startsWith("https://")) {
        throw new Error(
          t("Enter an HTTPS server URL.", "请输入 HTTPS 服务器地址。"),
        );
      }
      let credentialID = form.credential_id ?? null;
      const controller = new AbortController();
      if (form.auth_type === "oauth" && !credentialID) {
        const credential = await connectMCPOAuth({
          serverURL: form.server_url,
          signal: controller.signal,
          isolated: true,
        });
        if ("reason" in credential) throw new Error(credential.reason);
        credentialID = credential.id;
      } else if (
        (form.auth_type === "basic" || form.auth_type === "bearer") &&
        token
      ) {
        credentialID = (
          await storeMCPToken(
            form.server_url,
            token,
            form.auth_type,
            controller.signal,
            true,
          )
        ).id;
      }
      if (form.auth_type !== "none" && !credentialID)
        throw new Error(t("A credential is required.", "请输入凭据。"));
      const probe = await postV2DiscoverAvailableToolsOnAnMcpServer({
        server_url: form.server_url,
        credential_id: credentialID,
        use_saved_credentials: false,
      });
      if (probe.status !== 200)
        throw getAPIResponseError(probe.status, probe.data);
      const data = { ...form, credential_id: credentialID };
      const response = editingID
        ? await putV2UpdateConnection(editingID, data)
        : await postV2CreateConnection(data);
      if (response.status !== 200)
        throw getAPIResponseError(response.status, response.data);
      if (form.auth_type !== "none")
        await invalidateConnectionQueries(queryClient);
      await refresh();
      setOpen(false);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const response = await deleteV2DeleteConnection(id);
      if (response.status !== 204)
        throw getAPIResponseError(response.status, response.data);
      await refresh();
      return true;
    } catch (cause) {
      setError(getErrorMessage(cause));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    pendingRemove,
    setPendingRemove,
    isLoading: query.isLoading,
    connections: query.data?.status === 200 ? query.data.data : [],
    listError:
      query.isError || (query.data !== undefined && query.data.status !== 200),
    form,
    setForm,
    token,
    setToken,
    open,
    setOpen,
    busy,
    error,
    create,
    edit,
    save,
    remove,
  };
}
