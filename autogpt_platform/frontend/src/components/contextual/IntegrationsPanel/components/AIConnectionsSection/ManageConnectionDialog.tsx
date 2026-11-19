"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useState } from "react";
import { useGetV1CodexAccount } from "@/app/api/__generated__/endpoints/integrations/integrations";
import type { AIConnectionOffer } from "@/app/api/__generated__/models/aIConnectionOffer";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

import { useOAuthConnect } from "../ConnectServiceDialog/components/DetailView/useOAuthConnect";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog/DeleteConfirmDialog";
import { useDeleteIntegration } from "../hooks/useDeleteIntegration";
import { microsoftAccessLabels } from "./helpers";

interface Props {
  connection: AIConnectionOffer | null;
  credential?: CredentialsMetaResponse;
  credentialsFailed?: boolean;
  onRetryCredentials?: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Single-account first pass. Deliberately shows no usage figure and no reset
 * window: the only numbers available would be from whenever they were last
 * observed, and a stale window presented as current is worse than none —
 * especially on the reconnect path, where authorization is already invalid.
 */
export function ManageConnectionDialog({
  connection,
  credential,
  credentialsFailed,
  onRetryCredentials,
  onOpenChange,
}: Props) {
  if (connection?.auth_provider === "microsoft_365_copilot") {
    return (
      <Microsoft365CopilotConnectionDialog
        connection={connection}
        credential={credential}
        credentialsFailed={credentialsFailed}
        onRetryCredentials={onRetryCredentials}
        onOpenChange={onOpenChange}
      />
    );
  }

  return (
    <ChatGPTConnectionDialog
      connection={connection}
      credential={credential}
      onOpenChange={onOpenChange}
    />
  );
}

function ChatGPTConnectionDialog({
  connection,
  credential,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();

  const credentialId = connection?.credential_id ?? null;
  const [forceMessage, setForceMessage] = useState<string | null>(null);
  const account = credential?.username ?? undefined;

  // Asked for only while this dialog is open. Reading it leases a runtime
  // against the provider, so it must never run on the list behind — and it
  // means what is shown was true a moment ago rather than whenever the
  // connection was last used.
  const accountQuery = useGetV1CodexAccount(credentialId ?? "", {
    query: {
      enabled: credentialId !== null,
      staleTime: 0,
      retry: false,
      // A window-focus refetch would lease another provider runtime while
      // the same snapshot is already visible. Reopening Manage is the user's
      // explicit refresh boundary.
      refetchOnWindowFocus: false,
    },
  });
  const accountResponse =
    accountQuery.data?.status === 200 ? accountQuery.data.data : undefined;
  const snapshot = accountResponse?.connected ? accountResponse : undefined;
  const requiresReconnect =
    accountResponse !== undefined && !accountResponse.connected;

  function setManageOpen(open: boolean) {
    if (!open) setForceMessage(null);
    onOpenChange(open);
  }

  const { connect, isPending: isReconnecting } = useOAuthConnect({
    provider: "codex",
    onSuccess: () => setManageOpen(false),
  });

  const { remove, isPending: isDisconnecting } = useDeleteIntegration();

  async function disconnect(force = false) {
    if (!credentialId) return;
    const target = {
      id: credentialId,
      provider: "codex",
      name: account ?? "ChatGPT",
    };
    const result = await remove([target], force);
    const confirmation = result.needsConfirmation[0];
    if (confirmation) {
      setForceMessage(confirmation.message);
      return;
    }
    if (result.succeeded.length === 0) return;

    setForceMessage(null);
    setManageOpen(false);
  }

  return (
    <>
      <Dialog
        title="ChatGPT"
        styling={{ maxWidth: "28rem" }}
        controlled={{
          isOpen: connection !== null && forceMessage === null,
          set: (open) => {
            // Opening the force-confirmation dialog intentionally hides this
            // one. Radix reports that controlled close through this callback;
            // keep the connection selected so Cancel can return here.
            if (!open && forceMessage !== null) return;
            setManageOpen(open);
          },
        }}
      >
        <Dialog.Content>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Text variant="small" tone="muted">
                {t("Connected account", "已连接账户")}
              </Text>
              <Text variant="body-medium">
                {snapshot?.email ??
                  account ??
                  t("Your ChatGPT account", "你的 ChatGPT 账户")}
              </Text>
              {accountQuery.isLoading ? (
                <Text variant="small" tone="muted">
                  {t("Checking with ChatGPT…", "正在向 ChatGPT 核实…")}
                </Text>
              ) : accountQuery.isError ? (
                <Text variant="small" tone="muted">
                  {t(
                    "Could not reach ChatGPT to confirm the plan on this account.",
                    "无法连接 ChatGPT 以确认此账户的套餐。",
                  )}
                </Text>
              ) : requiresReconnect ? (
                <Text variant="small" tone="warning">
                  {t(
                    "ChatGPT says this connection needs to be reconnected.",
                    "ChatGPT 提示此连接需要重新连接。",
                  )}
                </Text>
              ) : (
                snapshot?.plan_type && (
                  <span className="mt-1 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-accent-surface px-2 py-0.5 text-body-sm leading-5 font-medium text-accent-strong">
                      {snapshot.plan_type} {t("plan", "套餐")}
                    </span>
                  </span>
                )
              )}
            </div>

            <Text variant="small" tone="muted">
              {t(
                "ChatGPT identifies the workspace behind this connection only by an internal id, so it cannot be named here yet.",
                "ChatGPT 仅提供此连接所属工作区的内部 ID，因此暂时无法在此显示名称。",
              )}
            </Text>

            <Text variant="small" tone="body">
              {connection?.is_default
                ? t(
                    "New chats start on this connection and run on your ChatGPT plan.",
                    "新聊天默认使用此连接，并通过您的 ChatGPT 套餐运行。",
                  )
                : t(
                    "Chats you route here run on your ChatGPT plan instead of AutoGPT credits.",
                    "路由到此连接的聊天通过您的 ChatGPT 套餐运行，无需消耗 AutoGPT 积分。",
                  )}
            </Text>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                size="small"
                onClick={connect}
                loading={isReconnecting}
                disabled={isDisconnecting}
              >
                {t("Reconnect", "重新连接")}
              </Button>
              <Button
                variant="destructive"
                size="small"
                onClick={() => void disconnect()}
                loading={isDisconnecting}
                disabled={isReconnecting}
              >
                {t("Disconnect", "断开连接")}
              </Button>
            </div>

            <Text variant="small" tone="muted">
              {t(
                "Disconnecting stops new chats running on your ChatGPT plan. Your chat history is kept, and your other integrations are unaffected.",
                "断开连接后，新聊天将无法通过您的 ChatGPT 套餐运行。聊天记录将保留，其他集成不受影响。",
              )}
            </Text>
          </div>
        </Dialog.Content>
      </Dialog>

      <DeleteConfirmDialog
        open={forceMessage !== null}
        onOpenChange={(open) => {
          if (!open) setForceMessage(null);
        }}
        itemNames={[account ?? "ChatGPT"]}
        isPending={isDisconnecting}
        onConfirm={() => void disconnect(true)}
        variant="force"
        notice={forceMessage ?? undefined}
      />
    </>
  );
}

interface MicrosoftProps {
  connection: AIConnectionOffer;
  credential?: CredentialsMetaResponse;
  credentialsFailed?: boolean;
  onRetryCredentials?: () => void;
  onOpenChange: (open: boolean) => void;
}

function Microsoft365CopilotConnectionDialog({
  connection,
  credential,
  credentialsFailed,
  onRetryCredentials,
  onOpenChange,
}: MicrosoftProps) {
  const { t } = useTranslation();

  const [forceMessage, setForceMessage] = useState<string | null>(null);
  const { remove, isPending: isDisconnecting } = useDeleteIntegration();
  const credentialId = connection.credential_id;
  const accessLabels = microsoftAccessLabels(credential?.scopes, t);
  const displayName =
    credential?.title && credential.title !== "Microsoft 365 Copilot"
      ? credential.title
      : undefined;

  const accountName = credential?.username ?? "Microsoft 365 Copilot";
  // Copilot now runs on the account's one Microsoft connection; removing it
  // removes mail, calendar and files too. Older Copilot-only connections
  // still disconnect on their own.
  const isFullConnection = credential?.provider === "microsoft";

  function setManageOpen(open: boolean) {
    if (!open) setForceMessage(null);
    onOpenChange(open);
  }

  async function disconnect(force = false) {
    // Copilot may run on the account's whole Microsoft connection, and only
    // the account says which connection a disconnect removes.
    if (!credentialId || !credential) return;
    const target = {
      id: credentialId,
      provider: credential.provider,
      name: accountName,
    };
    const result = await remove([target], force);
    const confirmation = result.needsConfirmation[0];
    if (confirmation) {
      setForceMessage(confirmation.message);
      return;
    }
    if (result.succeeded.length === 0) return;

    setForceMessage(null);
    setManageOpen(false);
  }

  return (
    <>
      <Dialog
        title="Microsoft 365 Copilot"
        styling={{ maxWidth: "32rem" }}
        controlled={{
          isOpen: forceMessage === null,
          set: (open) => {
            if (!open && forceMessage !== null) return;
            setManageOpen(open);
          },
        }}
      >
        <Dialog.Content>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <Text variant="small" tone="muted">
                {t("Connected work account", "已连接的工作账户")}
              </Text>
              <Text variant="body-medium">
                {displayName ??
                  credential?.username ??
                  t(
                    "Microsoft 365 Copilot account",
                    "Microsoft 365 Copilot 账户",
                  )}
              </Text>
              {displayName && credential?.username && (
                <Text variant="small" tone="body">
                  {credential.username}
                </Text>
              )}
              {!credential?.username && (
                <Text variant="small" tone="muted">
                  {t(
                    "Reconnect once to show the signed-in account here.",
                    "重新连接一次，即可在此显示已登录的账户。",
                  )}
                </Text>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Text variant="small-medium" tone="body">
                {t("Access granted", "已授予的权限")}
              </Text>
              {accessLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {accessLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-lg bg-surface-hover px-2 py-0.5 text-body-sm leading-5 font-medium text-foreground-body"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <Text variant="small" tone="muted">
                  {t(
                    "Reconnect once to refresh the access shown here.",
                    "重新连接一次，即可刷新此处显示的权限。",
                  )}
                </Text>
              )}
            </div>

            <Text variant="small" tone="body">
              {t(
                "Microsoft still limits every answer to content this work account can already access in Microsoft 365.",
                "Microsoft 仍会将每次回答限制在此工作账户已可访问的 Microsoft 365 内容范围内。",
              )}
            </Text>

            {!credential && credentialsFailed && (
              <div className="flex items-center justify-between gap-2">
                <Text variant="small" tone="body">
                  {t("Couldn't load this account.", "无法加载此账户。")}
                </Text>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={onRetryCredentials}
                >
                  {t("Try again", "重试")}
                </Button>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                variant="destructive"
                size="small"
                disabled={!credential}
                onClick={() => void disconnect()}
                loading={isDisconnecting}
              >
                {t("Disconnect", "断开连接")}
              </Button>
            </div>

            <Text variant="small" tone="muted">
              {isFullConnection
                ? t(
                    "Disconnecting removes this Microsoft account from AutoGPT, including its mail, calendar and files. Your chat history is kept.",
                    "断开连接会从 AutoGPT 中移除此 Microsoft 账户，包括其邮件、日历和文件的连接。聊天记录将保留。",
                  )
                : t(
                    "Disconnecting stops new chats using this Copilot subscription. Your chat history is kept, and your other integrations are unaffected.",
                    "断开连接后，新聊天将无法使用此 Copilot 订阅。聊天记录将保留，其他集成不受影响。",
                  )}
            </Text>
          </div>
        </Dialog.Content>
      </Dialog>

      <DeleteConfirmDialog
        open={forceMessage !== null}
        onOpenChange={(open) => {
          if (!open) setForceMessage(null);
        }}
        itemNames={[accountName]}
        isPending={isDisconnecting}
        onConfirm={() => void disconnect(true)}
        variant="force"
        notice={forceMessage ?? undefined}
      />
    </>
  );
}
