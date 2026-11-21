"use client";

import { useListExpertCredentials } from "@/app/api/__generated__/endpoints/experts/experts";
import {
  getGetV1ListCredentialsQueryKey,
  useGetV1ListCredentials,
  useGetV1ListProviders,
} from "@/app/api/__generated__/endpoints/integrations/integrations";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import {
  postV2DiscoverAvailableToolsOnAnMcpServer,
  postV2StoreABearerTokenForAnMcpServer,
} from "@/app/api/__generated__/endpoints/mcp/mcp";
import { okData } from "@/app/api/helpers";
import type { SetupRequirementsResponse } from "@/app/api/__generated__/models/setupRequirementsResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { MCPPresetPanel } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/components/DetailView/MCPPresetPanel";
import { MCPAuthSchemeField } from "@/components/contextual/MCPAuthSchemeField/MCPAuthSchemeField";
import {
  mcpAuthTokenHint,
  mcpAuthTokenLabel,
  mcpAuthTokenPlaceholder,
} from "@/components/contextual/MCPAuthSchemeField/helpers";
import { useMCPAuthScheme } from "@/components/contextual/MCPAuthSchemeField/useMCPAuthScheme";
import { isKey } from "@/lib/keyboard";
import {
  detectMCPAuthScheme,
  prepareMCPAuthCredential,
  validateMCPAuthCredential,
  type MCPAuthScheme,
} from "@/lib/mcp-auth";
import { getErrorMessage } from "@/lib/mcp-errors";
import { normalizeMcpUrl } from "@/lib/mcp-url";
import { connectMCPOAuth } from "@/lib/mcp-oauth";
import { CredentialsProvidersContext } from "@/providers/agent-credentials/credentials-provider";
import { grantToExpert } from "@/services/experts/grant-to-expert";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { useCopilotChatActions } from "../../../../components/CopilotChatActionsProvider/useCopilotChatActions";
import { ContentMessage } from "../../../../components/ToolAccordion/AccordionContent";
import { ChainActionsContext } from "../../../../components/ToolChain/chainActions";
import { CredentialRejectionNotice } from "../../../../components/CredentialRejectionNotice/CredentialRejectionNotice";
import { coerceExpertGrant } from "../../../../components/SetupRequirementsCard/helpers";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { hasCatalogMethods } from "@/lib/mcp-catalog-connections";
import { CatalogAccountCard } from "./CatalogAccountCard";

interface Props {
  output: SetupRequirementsResponse;
  /**
   * Message sent to the chat after a successful connection.
   * Defaults to a generic "credentials connected, please retry" message.
   */
  retryInstruction?: string;
}

async function storeManualToken(
  serverUrl: string,
  token: string,
  t: ReturnType<typeof useTranslation>["t"],
) {
  // Probe before storing so a rejected credential never shows as Connected.
  const probe = await postV2DiscoverAvailableToolsOnAnMcpServer({
    server_url: serverUrl,
    auth_token: token,
  });
  if (probe.status !== 200) {
    const probeDetail =
      probe.data && typeof probe.data === "object" && "detail" in probe.data
        ? probe.data.detail
        : null;
    throw new Error(
      typeof probeDetail === "string"
        ? probeDetail
        : t(
            "This server did not accept the credential.",
            "此服务器未接受该凭据。",
          ),
    );
  }

  const res = await postV2StoreABearerTokenForAnMcpServer({
    server_url: serverUrl,
    token,
  });
  if (!(res.status >= 200 && res.status < 300)) {
    const detail =
      res.data && typeof res.data === "object" && "detail" in res.data
        ? res.data.detail
        : null;
    throw new Error(
      typeof detail === "string"
        ? detail
        : t("Failed to store token", "保存令牌失败"),
    );
  }
  return res.status === 200 ? res.data.id : undefined;
}

/**
 * Credential setup card for MCP servers — replaces the generic
 * SetupRequirementsCard (which uses the standard integration OAuth route)
 * with the MCP-specific OAuth flow (`/api/v2/mcp/oauth/*`).
 *
 * OAuth flow: initiate login → popup → exchange code for tokens.
 * Fallback: if the server doesn't support MCP OAuth (400), prompts the user
 * to provide an API credential manually.
 */
export function MCPSetupCard(props: Props) {
  const info = props.output.setup_info;
  const expertGrant = Object.values(
    info.user_readiness?.missing_credentials ?? {},
  )
    .map((entry) =>
      coerceExpertGrant((entry as { expert_grant?: unknown }).expert_grant),
    )
    .find(Boolean);
  const expertId = info.mcp_expert_id ?? expertGrant?.expertId;
  const key = JSON.stringify([
    info.agent_id,
    info.mcp_catalog_id,
    expertId,
    props.output.rejection,
  ]);
  return info.mcp_catalog_id ? (
    <CatalogSetupCard key={key} {...props} expertId={expertId} />
  ) : (
    <ConnectionCard key={key} {...props} expertId={expertId} />
  );
}

type ScopedProps = Props & { expertId?: string };

function CatalogSetupCard(props: ScopedProps) {
  const info = props.output.setup_info;
  const { data: providers } = useGetV1ListProviders({
    query: { select: (response) => okData(response) ?? [] },
  });
  const preset = providers?.find(
    (provider) =>
      provider.name === info.mcp_catalog_id &&
      (hasCatalogMethods(provider.mcp_server) || provider.mcp_server?.auth_methods?.includes("query_key")) &&
      provider.mcp_server.connection_mode === "hosted" &&
      !!provider.mcp_server.server_url &&
      normalizeMcpUrl(provider.mcp_server.server_url) ===
        normalizeMcpUrl(info.agent_id),
  );
  if (preset && hasCatalogMethods(preset.mcp_server)) {
    return <CatalogAccountCard key={`${preset.name}:${preset.mcp_server.definition_version}`} {...props} server={preset.mcp_server} connectorID={preset.name} />;
  }
  return <ConnectionCard {...props} preset={preset} />;
}

function ConnectionCard({
  output,
  retryInstruction,
  expertId,
  preset,
}: ScopedProps & { preset?: ProviderMetadata }) {
  const { t } = useTranslation();
  const { onSend } = useCopilotChatActions();
  const queryClient = useQueryClient();
  const allProviders = useContext(CredentialsProvidersContext);
  const chainActions = useContext(ChainActionsContext);
  const actionId = useId();
  const manualTokenInputId = `${actionId}-manual-auth-token`;
  const manualTokenHintId = `${actionId}-manual-auth-hint`;

  // setup_info.agent_id is set to the server_url in the backend
  const serverUrl = output.setup_info.agent_id;
  // agent_name is computed by the backend as the display name for the service
  const service = output.setup_info.agent_name;
  const rejection = output.rejection ?? null;
  const catalogId = output.setup_info.mcp_catalog_id;
  const [dialogOpen, setDialogOpen] = useState(false);

  const initiallyConnected = Boolean(
    output.setup_info?.user_readiness?.has_all_credentials,
  );

  const normalizedServer = normalizeMcpUrl(serverUrl);
  const {
    data: liveCredsRes,
    isFetching: liveCredsFetching,
    isFetchedAfterMount: liveCredsFetched,
    isError: liveCredsError,
  } = useGetV1ListCredentials({
    query: {
      select: (res) => (res.status === 200 ? res.data : null),
      // No staleTime — when this card mounts (e.g. immediately after the
      // backend's ``invalidate_mcp_credential`` deleted a stale row),
      // we want a fresh fetch.  A non-zero staleTime would let the
      // previously-cached "cred exists" override the post-invalidation
      // truth, briefly rendering "Connected" on a card whose
      // ``has_all_credentials=false`` snapshot is the authoritative
      // post-invalidation state.
      refetchOnMount: "always",
    },
  });
  // Tri-state, because "we don't know yet" must fall back to the persisted
  // snapshot rather than to disconnected. Unknown covers: this mount's fetch
  // hasn't landed (React Query keeps serving the previous cache until it
  // does, and that cache still lists rows the backend just invalidated), the
  // refetch settled but errored (stale data is still served), and a non-200
  // that ``select`` mapped to null.
  //
  // ``isFetchedAfterMount`` rather than ``isFetching``: this query key is
  // app-wide, so ``isFetching`` also goes true on window focus and on every
  // credential mutation elsewhere, blanking a genuinely connected card.
  // On an expert's card the account's own credential is not enough: only one
  // granted to the expert counts, so an ungranted one still offers Grant
  // access. The grant list follows the same tri-state rule as the cred list.
  const {
    data: expertGrants,
    isFetching: expertGrantsFetching,
    isFetchedAfterMount: expertGrantsFetched,
    isError: expertGrantsError,
  } = useListExpertCredentials(expertId ?? "", {
    query: {
      enabled: Boolean(expertId),
      refetchOnMount: "always",
      select: (res) => okData(res) ?? null,
    },
  });
  const grantedIds = expertId
    ? new Set((expertGrants ?? []).map((grant) => grant.credential_id))
    : null;
  function matches(credential: CredentialsMetaResponse) {
    return (
      credential.provider === "mcp" &&
      ((typeof credential.host === "string" &&
        normalizeMcpUrl(credential.host) === normalizedServer) ||
        (!!preset &&
          credential.service ===
            (preset.service || preset.name.replace(/^mcp_/, ""))))
    );
  }
  const serverCredentials =
    (catalogId && !preset) || !Array.isArray(liveCredsRes)
      ? []
      : liveCredsRes.filter(matches);
  const liveCredential = serverCredentials.find(
    (c) => !grantedIds || grantedIds.has(c.id),
  );
  const grantsUnknown =
    Boolean(expertId) &&
    (!expertGrantsFetched ||
      expertGrantsFetching ||
      expertGrantsError ||
      !Array.isArray(expertGrants));
  const liveHasCred: boolean | "unknown" =
    !liveCredsFetched ||
    ((expertId || catalogId) && liveCredsFetching) ||
    liveCredsError ||
    !Array.isArray(liveCredsRes) ||
    grantsUnknown
      ? "unknown"
      : Boolean(liveCredential);
  const storedManualAuthScheme: MCPAuthScheme =
    (liveCredential ?? serverCredentials[0])?.mcp_auth_scheme === "basic"
      ? "basic"
      : "bearer";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const {
    scheme: manualAuthScheme,
    selectScheme,
    detectSchemeFrom,
  } = useMCPAuthScheme(storedManualAuthScheme, manualToken);
  // ``localConnected`` is set ONLY when the user successfully completes
  // OAuth / manual-token in this component instance.  It is NOT seeded
  // from ``initiallyConnected`` — that path is handled via ``liveSays``
  // below.  Seeding from the persisted snapshot would shadow a later
  // ``liveHasCred=false`` (e.g. cred revoked) and keep the Connected
  // pill stuck.
  const [localConnected, setLocalConnected] = useState(false);
  // When Reconnect fails (or any in-card flow errors out), force the
  // not-connected branch even though the live cred row still exists —
  // otherwise ``liveHasCred=true`` would keep the pill rendered and the
  // user couldn't see the error banner or the manual-token input.  Reset
  // on the next attempt so the user can retry.
  const [forceDisconnected, setForceDisconnected] = useState(false);
  const oauthRequest = useRef<AbortController | null>(null);
  const [granting, setGranting] = useState(false);
  const grantInFlight = useRef(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [failedGrantId, setFailedGrantId] = useState<string | null>(null);
  const liveGrantableId =
    !rejection && expertId && liveHasCred === false
      ? serverCredentials[0]?.id
      : null;
  const grantableId = liveGrantableId ?? (!catalogId ? failedGrantId : null);
  const legacyPersonal = !expertId && !catalogId;
  const liveSays =
    liveHasCred === "unknown"
      ? legacyPersonal && initiallyConnected
      : liveHasCred;
  const connected =
    !forceDisconnected &&
    ((localConnected && legacyPersonal) ||
      ((!rejection || localConnected) && liveSays));
  const setConnected = setLocalConnected;

  useEffect(() => () => oauthRequest.current?.abort(), []);

  async function finish(credentialId: string | undefined, newlyStored = false) {
    if (expertId) {
      if (!credentialId) {
        setGrantError(
          t(
            "No credential was returned to grant. Please reconnect.",
            "未返回可授权的凭据，请重新连接。",
          ),
        );
        setForceDisconnected(true);
        return;
      }
      if (grantInFlight.current) return;
      grantInFlight.current = true;
      setGranting(true);
      setGrantError(null);
      const ok = await grantToExpert(
        queryClient,
        expertId,
        credentialId,
      ).finally(() => {
        grantInFlight.current = false;
        setGranting(false);
      });
      if (!ok) {
        setFailedGrantId(credentialId);
        setForceDisconnected(true);
        setGrantError(
          t(
            "Connected, but could not grant access. Try Grant access again.",
            "已连接，但无法授予访问权限。请再次点击“授予访问权限”。",
          ),
        );
        return;
      }
      if (newlyStored && !catalogId) {
        await queryClient.invalidateQueries({
          queryKey: getGetV1ListCredentialsQueryKey(),
        });
      }
    }
    setFailedGrantId(null);
    setForceDisconnected(false);
    setConnected(true);
    onSend(retryInstruction ?? "I've connected. Please retry.");
  }

  function handleGrantExisting() {
    if (grantableId) void finish(grantableId);
  }

  async function handleConnect() {
    if (loading || oauthRequest.current) return;
    if (catalogId) {
      if (preset) {
        setError(null);
        setDialogOpen(true);
      } else {
        setError(
          t(
            "The requested connection preset is unavailable. Please try again.",
            "请求的连接预设不可用，请重试。",
          ),
        );
        setForceDisconnected(true);
      }
      return;
    }
    const controller = new AbortController();
    oauthRequest.current = controller;
    const { signal } = controller;
    setError(null);
    setGrantError(null);
    setShowManualToken(false);
    setLoading(true);
    await connectOAuth(signal).finally(() => {
      if (oauthRequest.current === controller) {
        oauthRequest.current = null;
        if (!signal.aborted) setLoading(false);
      }
    });
  }

  async function connectOAuth(signal: AbortSignal) {
    const exchange = allProviders?.mcp?.mcpOAuthCallback;
    try {
      const credential = await connectMCPOAuth({
        serverURL: serverUrl,
        signal,
        exchange,
      });
      signal.throwIfAborted();
      if ("reason" in credential) {
        setConnected(false);
        setForceDisconnected(true);
        if (credential.noOAuth) setShowManualToken(true);
        setError(credential.reason);
        return;
      }
      setForceDisconnected(false);
      await finish(credential.id, true);
    } catch (error: unknown) {
      if (signal.aborted) return;
      setConnected(false);
      setForceDisconnected(true);
      const message = getErrorMessage(
        error,
        t(
          "Failed to complete sign-in. Please try again.",
          "无法完成登录。请重试。",
        ),
      );
      setError(
        message === "OAuth flow timed out"
          ? t(
              "OAuth sign-in timed out. Please try again.",
              "OAuth 登录超时。请重试。",
            )
          : message,
      );
    }
  }

  async function handleManualToken(tokenArg?: string) {
    // Re-entrancy guard first — mirrors ``handleConnect`` so both flows
    // present the same shape to readers.  See the comment on
    // ``handleConnect``'s guard for the double-click race this prevents.
    if (loading) return;
    // Chain rows pass an already-prepared value; do not prepare it again.
    const token =
      tokenArg === undefined
        ? prepareMCPAuthCredential(manualToken, manualAuthScheme)
        : tokenArg.trim();
    if (!token) return;

    const invalid = validateMCPAuthCredential(
      token,
      detectMCPAuthScheme(token) ?? manualAuthScheme,
      t,
    );
    if (invalid) {
      setForceDisconnected(true);
      setError(invalid);
      return;
    }

    setLoading(true);
    setError(null);
    setGrantError(null);
    try {
      const credentialId = await storeManualToken(serverUrl, token, t);
      // Only clear the force-disconnect override AFTER the API confirms
      // the token was stored.  Clearing it before the await would let
      // ``liveHasCred=true`` (from an existing stale cred) re-render the
      // Connected pill while the request is still in flight, briefly
      // showing a false "Connected" state to the user.
      setForceDisconnected(false);
      await finish(credentialId, true);
    } catch (e: unknown) {
      // Keep the force-disconnect override on so the not-connected
      // branch (error banner + manual-token input) stays visible — an
      // existing ``liveHasCred=true`` would otherwise re-render the
      // Connected pill.
      setForceDisconnected(true);
      const err = e as Record<string, unknown>;
      setError(
        (typeof err?.message === "string" ? err.message : null) ||
          t(
            "Failed to save token. Please try again.",
            "保存令牌失败。请重试。",
          ),
      );
    }
    setLoading(false);
  }

  const handleConnectRef = useRef(handleConnect);
  const handleManualTokenRef = useRef(handleManualToken);
  const handleGrantRef = useRef(handleGrantExisting);

  useEffect(() => {
    handleConnectRef.current = handleConnect;
    handleManualTokenRef.current = handleManualToken;
    handleGrantRef.current = handleGrantExisting;
  });

  // Inside a tool chain the card renders nothing itself — it registers an
  // MCP row with the chain's connectors table and stays mounted (hidden)
  // as the state machine driving that row's callbacks.
  useEffect(() => {
    if (!chainActions) return;
    chainActions.register(actionId, {
      id: actionId,
      ready: connected,
      buildMessage: () => null,
      mcp: {
        id: actionId,
        expertId,
        service,
        serverUrl,
        connected,
        loading,
        error: error ?? grantError ?? rejection?.detail ?? null,
        showManualToken,
        authScheme: manualAuthScheme,
        grantable: Boolean(grantableId),
        granting,
        onConnect: () => void handleConnectRef.current(),
        onUseToken: (token) => {
          setManualToken(token);
          void handleManualTokenRef.current(token);
        },
        onGrant: () => handleGrantRef.current(),
      },
    });
    return () => chainActions.unregister(actionId);
  }, [
    chainActions,
    actionId,
    connected,
    loading,
    error,
    grantError,
    expertId,
    rejection?.detail,
    grantableId,
    granting,
    showManualToken,
    manualAuthScheme,
    serverUrl,
    service,
  ]);

  const dialog =
    dialogOpen && preset?.mcp_server ? (
      <Dialog
        title={service}
        controlled={{ isOpen: dialogOpen, set: setDialogOpen }}
      >
        <Dialog.Content>
          <MCPPresetPanel
            catalogID={preset.name}
            serviceName={service}
            server={preset.mcp_server}
            onSuccess={(credential) => {
              setDialogOpen(false);
              if (!credential?.id || !matches(credential)) {
                setError(
                  t(
                    "The new connection does not match this service.",
                    "新连接与此服务不匹配。",
                  ),
                );
                setForceDisconnected(true);
                return;
              }
              void finish(credential.id);
            }}
          />
        </Dialog.Content>
      </Dialog>
    ) : null;

  if (chainActions) return dialog;

  // Already-connected state.  Shown when the backend reports
  // ``has_all_credentials=true`` (model called with
  // ``surface_connect_card=true`` and creds already exist), or after the
  // user just completed a Connect flow in this component instance.  Always
  // expose Reconnect so the user can swap accounts.
  if (connected) {
    // No error banner here — any caught error flips ``forceDisconnected``
    // to true which forces ``connected=false``, so an error inside the
    // connected branch is unreachable.  The not-connected branch below
    // owns the error display.
    return (
      <div className="mt-2 grid gap-2">
        {dialog}
        <div className="rounded-lg border border-success/40 bg-success-surface px-3 py-2 text-body text-success-foreground">
          {t(`Connected to ${service}.`, `已连接 ${service}。`)}{" "}
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="ml-1 underline underline-offset-2 hover:no-underline disabled:opacity-60"
          >
            {loading
              ? t("Reconnecting…", "正在重新连接…")
              : t("Reconnect", "重新连接")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 grid gap-2">
      {dialog}
      {(!initiallyConnected || rejection || legacyPersonal) && (
        <ContentMessage>{output.message}</ContentMessage>
      )}

      {rejection && <CredentialRejectionNotice rejection={rejection} />}

      <div className="rounded-2xl border bg-canvas p-4">
        {grantableId ? (
          <Button
            variant="primary"
            size="small"
            onClick={handleGrantExisting}
            disabled={granting || loading}
            className="mr-2"
          >
            {granting
              ? t("Granting…", "正在授权…")
              : t("Grant access", "授予访问权限")}
          </Button>
        ) : null}
        <Button
          variant={grantableId ? "secondary" : "primary"}
          size="small"
          onClick={handleConnect}
          disabled={loading || granting}
        >
          {loading
            ? t("Connecting…", "正在连接…")
            : t(`Connect ${service}`, `连接 ${service}`)}
        </Button>

        {(error || grantError) && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-2 rounded-lg border border-error/30 bg-error-surface px-3 py-2 text-body text-error-foreground"
          >
            {error ?? grantError}
          </div>
        )}

        {showManualToken && (
          <div className="mt-3 grid gap-2">
            <MCPAuthSchemeField
              value={manualAuthScheme}
              onChange={selectScheme}
              disabled={loading}
              nameSuffix={service}
              className="grid gap-1"
              labelClassName="text-caption font-medium text-foreground-body"
              selectClassName="rounded border bg-canvas px-2 py-1.5 text-body"
            />
            <Text
              variant="small-medium-tight"
              as="label"
              tone="body"
              htmlFor={manualTokenInputId}
            >
              {t(
                `${mcpAuthTokenLabel(manualAuthScheme)} for ${service}`,
                `${service} 的${mcpAuthTokenLabel(manualAuthScheme, t)}`,
              )}
            </Text>
            <Text variant="small-tight" tone="muted" id={manualTokenHintId}>
              {mcpAuthTokenHint(manualAuthScheme, t)}
            </Text>
            <div className="flex gap-2">
              <input
                id={manualTokenInputId}
                aria-describedby={manualTokenHintId}
                type="password"
                placeholder={mcpAuthTokenPlaceholder(manualAuthScheme, t)}
                value={manualToken}
                onChange={(e) => {
                  const nextToken = e.target.value;
                  setManualToken(nextToken);
                  detectSchemeFrom(nextToken);
                }}
                onKeyDown={(e) =>
                  isKey(e, "Enter") && !loading && handleManualToken()
                }
                className="flex-1 rounded border px-2 py-1 text-body"
              />
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleManualToken()}
                disabled={loading || !manualToken.trim()}
              >
                {loading
                  ? t("Verifying…", "正在验证…")
                  : t("Use Token", "使用令牌")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
