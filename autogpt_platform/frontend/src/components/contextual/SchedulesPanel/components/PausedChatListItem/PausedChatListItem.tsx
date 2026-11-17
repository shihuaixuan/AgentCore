"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { PausedScheduledChat } from "@/app/api/__generated__/models/pausedScheduledChat";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { Delete02Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePausedChatListItem } from "./usePausedChatListItem";

interface Props {
  paused: PausedScheduledChat;
}

export function PausedChatListItem({ paused }: Props) {
  const { t } = useTranslation();

  const {
    sessionHref,
    handleResume,
    isResuming,
    canDelete,
    isDeleteOpen,
    setIsDeleteOpen,
    handleDelete,
    isDeleting,
  } = usePausedChatListItem({ paused });

  const detail = (
    <>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-large border border-separator bg-warning-surface">
        <Icon icon={PauseIcon} size={18} tone="warning" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Text variant="body-medium" className="block w-full text-ellipsis">
          {paused.title}
        </Text>
        <Text variant="small" tone="warning">
          {paused.summary}
        </Text>
      </div>
    </>
  );

  return (
    <div
      className="flex w-full flex-col gap-3 rounded-large border border-warning-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid="paused-chat-row"
      data-schedule-key={paused.schedule_key}
    >
      {sessionHref ? (
        <Link
          href={sessionHref}
          className="flex min-w-0 flex-1 items-start gap-3 hover:opacity-80"
        >
          {detail}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3">{detail}</div>
      )}
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          variant="secondary"
          size="small"
          loading={isResuming}
          onClick={handleResume}
          aria-label={t(`Resume ${paused.title}`, `恢复 ${paused.title}`)}
        >
          <Icon icon={PlayIcon} className="mr-1 h-4 w-4" />
          {t("Resume", "恢复")}
        </Button>
        {canDelete ? (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsDeleteOpen(true)}
            aria-label={t(`Delete ${paused.title}`, `删除 ${paused.title}`)}
          >
            <Icon icon={Delete02Icon} className="mr-1 h-4 w-4" />
            {t("Delete", "删除")}
          </Button>
        ) : null}
      </div>

      <Dialog
        controlled={{ isOpen: isDeleteOpen, set: setIsDeleteOpen }}
        styling={{ maxWidth: "32rem" }}
        title={t("Delete scheduled chat", "删除定时聊天")}
      >
        <Dialog.Content>
          <div className="flex flex-col gap-4">
            <Text variant="large">
              {t(
                `Delete “${paused.title}”? It won't run again. You can recreate it from chat if needed.`,
                `要删除“${paused.title}”吗？它将不再运行。如有需要，可在聊天中重新创建。`,
              )}
            </Text>
            <Dialog.Footer>
              <Button
                variant="secondary"
                disabled={isDeleting}
                onClick={() => setIsDeleteOpen(false)}
              >
                {t("Keep it", "保留")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={isDeleting}
              >
                {t("Yes, delete", "确认删除")}
              </Button>
            </Dialog.Footer>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
