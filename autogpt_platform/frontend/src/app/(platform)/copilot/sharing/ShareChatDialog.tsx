"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useShareChatDialog } from "./useShareChatDialog";
import {
  Copy01Icon,
  Share03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareChatDialog({ sessionId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const state = useShareChatDialog({ sessionId, open });

  return (
    <Dialog
      title={t("Share this chat", "分享此对话")}
      controlled={{ isOpen: open, set: onOpenChange }}
    >
      <Dialog.Content>
        <div className="space-y-4">
          <div className="space-y-2 rounded-md border border-warning-border bg-warning-surface p-3">
            <Text tone="warning" variant="small">
              {t(
                "Anyone with the link will see this conversation. Don't share if it contains secrets you pasted, personal details, or credentials you wouldn't want public.",
                "任何持有链接的人都能查看此对话。如果其中包含你粘贴的机密、个人信息或不希望公开的凭据，请勿分享。",
              )}
            </Text>
            <Text tone="warning" variant="small">
              {t("Sharing is ", "共享会")}
              <strong>{t("live", "实时更新")}</strong>
              {t(
                ": new messages, workflow runs, and files added after you enable sharing become visible too. Stop sharing to revoke access.",
                "：开启共享后新增的消息、工作流运行记录和文件也会公开。停止共享即可撤销访问权限。",
              )}
            </Text>
          </div>

          {!state.isLoadingState && (
            // Consent disclosure — exact numbers from the server's
            // share-state snapshot.  Shown both before enable (so the
            // owner knows what they're about to expose) and after
            // enable (so they can audit what the public viewer sees
            // right now).
            <div className="rounded-md border border-border-base bg-surface-muted p-3">
              <Text variant="small-medium" tone="primary">
                {state.isShared
                  ? t("Currently sharing", "正在共享")
                  : t("About to share", "即将共享")}
              </Text>
              <ul className="mt-1 list-disc pl-5 text-caption text-foreground-body">
                <li>
                  {t(
                    `${state.messageCount} ${state.messageCount === 1 ? "message" : "messages"}`,
                    `${state.messageCount} 条消息`,
                  )}
                </li>
                {state.autoShareExecutions && (
                  <li>
                    {t(
                      `${state.linkedRunCount} workflow ${state.linkedRunCount === 1 ? "run" : "runs"}`,
                      `${state.linkedRunCount} 次工作流运行`,
                    )}
                  </li>
                )}
                <li>
                  {t(
                    `${state.fileCount} workspace ${state.fileCount === 1 ? "file" : "files"}`,
                    `${state.fileCount} 个工作区文件`,
                  )}
                </li>
              </ul>
            </div>
          )}

          {/* Global execution-sharing toggle.  When ON, every agent
              run in this chat — past and future — is included in the
              share automatically.  Locked while shared so the toggle
              state always matches what the viewer sees. */}
          <div className="flex items-center justify-between gap-3 rounded border border-border-base px-3 py-2.5">
            <div className="min-w-0">
              <Text variant="body-medium">
                {t(
                  "Share workflow runs in this chat",
                  "共享此对话中的工作流运行记录",
                )}
              </Text>
              <Text variant="small" tone="muted">
                {t(
                  "Includes every run from this conversation, including ones that happen after you share.",
                  "包括此对话中的所有运行记录，以及开启共享后产生的运行记录。",
                )}
              </Text>
            </div>
            <Switch
              checked={state.autoShareExecutions}
              onCheckedChange={state.setAutoShareExecutions}
              disabled={state.isShared || state.isLoadingState}
              aria-label={t(
                "Share workflow runs from this chat",
                "共享此对话中的工作流运行记录",
              )}
            />
          </div>

          {state.isShared && state.shareUrl && (
            <div className="space-y-2">
              <Text variant="small-medium">{t("Share link", "分享链接")}</Text>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={state.shareUrl}
                  className="flex-1 rounded border border-border-base bg-surface-muted px-2 py-1.5 font-mono text-caption"
                />
                <Button
                  size="small"
                  variant="secondary"
                  onClick={state.copyShareUrl}
                  leftIcon={
                    state.copied ? (
                      <Icon icon={Tick02Icon} size={14} />
                    ) : (
                      <Icon icon={Copy01Icon} size={14} />
                    )
                  }
                >
                  {state.copied ? t("Copied", "已复制") : t("Copy", "复制")}
                </Button>
              </div>
            </div>
          )}
        </div>
        <Dialog.Footer>
          {state.isShared ? (
            // Two-step destructive confirmation.  First click flips
            // confirmingStop so the button copy reads "Confirm stop";
            // second click fires the DELETE.  A "Cancel" affordance
            // appears alongside the confirm so a misclick is recoverable.
            <>
              {state.confirmingStop && (
                <Button variant="secondary" onClick={state.cancelStop}>
                  {t("Cancel", "取消")}
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={state.requestStop}
                loading={state.isDisabling}
              >
                {state.confirmingStop
                  ? t("Confirm stop sharing", "确认停止共享")
                  : t("Stop sharing", "停止共享")}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={state.enable}
              loading={state.isEnabling}
              disabled={state.isLoadingState}
              leftIcon={<Icon icon={Share03Icon} size={14} />}
            >
              {t("Enable sharing", "开启共享")}
            </Button>
          )}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
