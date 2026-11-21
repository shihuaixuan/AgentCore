"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  accountLabel,
  cleanEndpoint,
  expertAccountKey,
  matchesDefinition,
  saveCatalogAccount,
  setExpertAccount,
  type CatalogAccount,
  type CatalogMethod,
  type CatalogServer,
} from "@/lib/mcp-catalog-connections";
import { connectMCPOAuth } from "@/lib/mcp-oauth";
import { getGetV2ListConnectionsQueryKey } from "@/app/api/__generated__/endpoints/mcp/mcp";
import { invalidateConnectionQueries } from "@/lib/react-query/invalidateConnections";
import { useCatalogAccounts } from "./useCatalogAccounts";
import { noPasswordManager } from "../ConnectServiceDialog/components/DetailView/helpers";

type Props = {
  connectorID: string;
  server: CatalogServer & { methods: CatalogMethod[] };
  expertID?: string;
  excludedID?: string | null;
  onDone: (account: CatalogAccount) => void;
};

export function CatalogAccountPanel({
  connectorID,
  server,
  expertID,
  excludedID,
  onDone,
}: Props) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const list = useCatalogAccounts(connectorID, expertID);
  const rows = list.rows.filter(
    (row) =>
      matchesDefinition(row, server) &&
      row.id !== excludedID &&
      (!excludedID || row.credential_id !== excludedID),
  );
  const [create, setCreate] = useState(false);
  const [methodID, setMethodID] = useState(server.methods[0].id);
  const method = server.methods.find((entry) => entry.id === methodID);
  const [values, setValues] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState(server.server_url ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<CatalogAccount>();
  const active = useRef<AbortController | null>(null);
  const id = useId();
  useEffect(() => () => active.current?.abort(), []);

  async function submit(existing?: CatalogAccount) {
    if (!list.known || active.current || !method) return;
    const controller = new AbortController();
    active.current = controller;
    const { signal } = controller;
    setBusy(true);
    setError("");
    let row = existing;
    try {
      if (!row) {
        const fields = method.fields ?? [];
        const hasEndpointTemplate = Boolean(method.endpoint_path);
        const hasCompleteURL = fields.some(
          (field) => field.type === "secret_url",
        );
        const target = cleanEndpoint(endpoint);
        if (!hasEndpointTemplate && !hasCompleteURL && !target) {
          throw new Error("Invalid endpoint");
        }
        let credentialID: string | undefined;
        if (method.kind === "oauth2") {
          const oauthURL = cleanEndpoint(
            endpoint === server.server_url
              ? (server.oauth_server_url ?? endpoint)
              : endpoint,
          );
          if (!oauthURL) throw new Error("Invalid OAuth endpoint");
          const credential = await connectMCPOAuth({
            serverURL: oauthURL,
            toolServerURL:
              server.server_url ?? endpoint,
            signal,
            isolated: true,
            catalog: { connector_id: connectorID, method_id: method.id },
            scopes: server.oauth_scopes ?? undefined,
          });
          if ("reason" in credential || !credential.id)
            throw new Error("OAuth did not complete");
          credentialID = credential.id;
        }
        signal.throwIfAborted();
        row = await saveCatalogAccount(
          {
            connector_id: connectorID,
            method_id: method.id,
            values,
            ...(hasEndpointTemplate || hasCompleteURL
              ? {}
              : { server_url: target }),
            ...(credentialID ? { credential_id: credentialID } : {}),
            name: name.trim() || undefined,
          },
          signal,
        );
        signal.throwIfAborted();
        setValues({});
        setPending(row);
        void client.invalidateQueries({
          queryKey: getGetV2ListConnectionsQueryKey(),
        });
        void invalidateConnectionQueries(client);
      }
      if (expertID && !list.granted.includes(row.id)) {
        await setExpertAccount(expertID, row.id, true, signal);
        void client.invalidateQueries({ queryKey: expertAccountKey(expertID) });
      }
      signal.throwIfAborted();
      onDone(row);
    } catch {
      if (!signal.aborted)
        setError(
          row
            ? t(
                "Account saved, but access was not granted. Retry granting access.",
                "账户已保存，但未授权。请重新授权。",
              )
            : t(
                "Could not save the connection. Check the method and try again.",
                "未能保存连接。请检查连接方式后重试。",
              ),
        );
    } finally {
      if (!signal.aborted) setBusy(false);
      active.current = null;
    }
  }

  const showForm = !pending && (create || (list.known && !rows.length));
  return (
    <div className="grid gap-3">
      {list.failed ? (
        <Button variant="secondary" onClick={list.retry}>
          {t("Retry loading accounts", "重新加载账户")}
        </Button>
      ) : (
        !list.known && (
          <Text variant="small">
            {t("Checking accounts…", "正在检查账户…")}
          </Text>
        )
      )}
      {!showForm &&
        list.known &&
        rows.map((row) => (
          <Button
            key={row.id}
            variant="secondary"
            disabled={busy}
            onClick={() => void submit(row)}
          >
            {list.granted.includes(row.id)
              ? t("Use account", "使用账户")
              : t("Grant access", "授予访问权限")}{" "}
            · {accountLabel(row, rows)}
          </Button>
        ))}
      {!showForm && list.known && (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setPending(undefined);
            setCreate(true);
            setError("");
          }}
        >
          {t("Add another account", "添加其他账户")}
        </Button>
      )}
      {showForm && method && (
        <>
          <Text variant="small">{server.setup_instructions}</Text>
          <div
            role="group"
            aria-label={t("Connection method", "连接方式")}
            className="flex flex-wrap gap-2"
          >
            {server.methods.map((entry) => (
              <Button
                key={entry.id}
                size="small"
                variant={entry.id === method.id ? "primary" : "secondary"}
                aria-pressed={entry.id === method.id}
                disabled={busy}
                onClick={() => {
                  setMethodID(entry.id);
                  setValues({});
                  setError("");
                }}
              >
                {entry.label}
              </Button>
            ))}
          </div>
          <Input
            id={`${id}-name`}
            label={t("Account name (optional)", "账户名称（选填）")}
            value={name}
            maxLength={120}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
          {!!server.server_url_options?.length && (
            <label>
              {t("Server URL", "服务器地址")}
              <select
                disabled={busy}
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
              >
                {[
                  ...new Set([
                    server.server_url,
                    ...server.server_url_options.map((option) => option.url),
                  ]),
                ]
                  .filter((url): url is string => !!cleanEndpoint(url))
                  .map((url) => (
                    <option key={url}>{url}</option>
                  ))}
              </select>
            </label>
          )}
          {(server.allow_custom_url ||
            (!server.server_url &&
              !method.endpoint_path &&
              !server.server_url_options?.length)) && (
            <Input
              id={`${id}-endpoint`}
              label={t("Server URL", "服务器地址")}
              inputMode="url"
              disabled={busy}
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
            />
          )}
          {(method.fields ?? []).map((field) => (
            <Input
              key={`${method.id}:${field.id}`}
              id={`${id}-${field.id}`}
              label={field.label}
              type={field.type === "text" ? "text" : "password"}
              {...noPasswordManager}
              autoComplete={field.type === "text" ? "off" : "new-password"}
              spellCheck={false}
              value={values[field.id] ?? ""}
              disabled={busy}
              onChange={(event) =>
                setValues({ ...values, [field.id]: event.target.value })
              }
            />
          ))}
          <Button
            variant="primary"
            disabled={
              !list.known ||
              busy ||
              !cleanEndpoint(endpoint) ||
              (method.fields ?? []).some((field) => !values[field.id]?.trim())
            }
            onClick={() => void submit()}
          >
            {t("Connect account", "连接账户")}
          </Button>
          {rows.length > 0 && (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setCreate(false)}
            >
              {t("Back to accounts", "返回账户列表")}
            </Button>
          )}
        </>
      )}
      {error && (
        <Text as="p" role="alert" variant="small" tone="error-strong">
          {error}
        </Text>
      )}
    </div>
  );
}
