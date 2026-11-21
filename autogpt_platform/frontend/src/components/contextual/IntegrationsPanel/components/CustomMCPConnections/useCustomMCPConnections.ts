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
import { useCustomMCPForm } from "./useCustomMCPForm";
import { probeWithQueryKey, storeQueryKey } from "./queryKeyRequests";
import { saveCatalogAccount } from "@/lib/mcp-catalog-connections";

export function useCustomMCPConnections({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const query = useGetV2ListConnections({ query: { enabled } });
  const { t } = useTranslation();
  const [editingID, setEditingID] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<ConnectionResponse | null>(
    null,
  );
  const [open, showDialog] = useState(false);
  const editor = useCustomMCPForm(open);
  const { token } = editor;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setOpen(open: boolean) {
    if (!open) editor.reset();
    showDialog(open);
  }

  function create() {
    editor.reset();
    setEditingID(null);
    setError(null);
    setOpen(true);
  }

  function edit(connection: ConnectionResponse) {
    editor.reset(connection);
    setEditingID(connection.id);
    setError(null);
    setOpen(true);
  }

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: getGetV2ListConnectionsQueryKey(),
    });
  }

  async function save() {
    if (busy || !editor.canSave || !editor.form.auth_type) return;
    const form: ConnectionInput = {
      ...editor.form,
      auth_type: editor.form.auth_type,
    };
    if (form.auth_type === "query_key" && !token) {
      setError(
        t("Enter a valid query credential.", "请输入有效的查询参数凭据。"),
      );
      return;
    }
    if (
      form.auth_type !== "none" &&
      form.auth_type !== "oauth" &&
      !form.credential_id &&
      !token
    ) {
      setError(t("A credential is required.", "请输入凭据。"));
      return;
    }
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
      let credentialID = form.credential_id ?? null;
      const controller = new AbortController();
      const catalogMethod = editor.catalogID && editor.methodID;
      if (catalogMethod) {
        let credentialID: string | undefined = form.credential_id ?? undefined;
        if (form.auth_type === "oauth") {
          const credential = await connectMCPOAuth({
            serverURL: editor.authEndpoint ?? form.server_url,
            toolServerURL: editor.toolEndpoint,
            signal: controller.signal,
            isolated: true,
            catalog: {
              connector_id: editor.catalogID!,
              method_id: editor.methodID!,
            },
          });
          if ("reason" in credential) throw new Error(credential.reason);
          credentialID = credential.id;
        }
        await saveCatalogAccount(
          {
            connector_id: editor.catalogID!,
            method_id: editor.methodID!,
            values: editor.fieldValues,
            ...(editor.usesCompleteURL
              ? {}
              : { server_url: editor.toolEndpoint }),
            ...(credentialID ? { credential_id: credentialID } : {}),
            name: form.name,
          },
          controller.signal,
        );
        await refresh();
        setOpen(false);
        return;
      }
      if (!credentialID && form.auth_type === "oauth") {
        const credential = await connectMCPOAuth({
          serverURL: editor.authEndpoint ?? form.server_url,
          toolServerURL: editor.toolEndpoint,
          signal: controller.signal,
          isolated: true,
          ...(editor.catalogID && editor.methodID
            ? {
                catalog: {
                  connector_id: editor.catalogID,
                  method_id: editor.methodID,
                },
              }
            : {}),
        });
        if ("reason" in credential) throw new Error(credential.reason);
        credentialID = credential.id;
      } else if (
        !credentialID &&
        form.auth_type === "query_key" &&
        token &&
        !catalogMethod
      ) {
        const stored = await storeQueryKey(form.server_url, token, {
          authParameter: editor.authParameter,
        });
        if (stored.status !== 200)
          throw getAPIResponseError(stored.status, stored.data);
        credentialID = stored.data.id;
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
      } else if (form.auth_type === "header" && token) {
        credentialID = (
          await storeMCPToken(
            form.server_url,
            token,
            "bearer",
            controller.signal,
            true,
            {
              authType: "header",
              authParameter: editor.authParameter,
              authPrefix: editor.authPrefix,
            },
          )
        ).id;
      }
      if (form.auth_type !== "none" && !credentialID)
        throw new Error(t("A credential is required.", "请输入凭据。"));
      const discover =
        form.auth_type === "query_key"
          ? probeWithQueryKey
          : postV2DiscoverAvailableToolsOnAnMcpServer;
      const probe = await discover({
        server_url: editor.toolEndpoint ?? form.server_url,
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
      setError(
        form.auth_type === "query_key"
          ? t(
              "Could not save this connection. Check the server URL and key, then try again.",
              "无法保存此连接。请检查服务器地址和密钥后重试。",
            )
          : getErrorMessage(cause),
      );
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
    ...editor,
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
