"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { Text } from "@/components/atoms/Text/Text";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { NEW_SCHEDULED_TASK_PROMPT } from "../guidedPrompts";
import { EmptyFollowups } from "./components/EmptyFollowups/EmptyFollowups";
import { FollowupListItem } from "./components/FollowupListItem/FollowupListItem";
import { GraphScheduleListItem } from "./components/GraphScheduleListItem/GraphScheduleListItem";
import { PausedChatListItem } from "./components/PausedChatListItem/PausedChatListItem";
import { useSchedulesPanel } from "./useSchedulesPanel";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  onGuidedPrompt: (prompt: string) => void;
  withHeading?: boolean;
}

export function SchedulesPanel({ onGuidedPrompt, withHeading = true }: Props) {
  const { t } = useTranslation();

  const { schedules, paused, isLoading, error, partialError } =
    useSchedulesPanel();

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {withHeading && (
            <Text variant="h2">{t("Scheduled", "定时任务")}</Text>
          )}
          <Text variant="body" tone="muted">
            {t(
              "Every automated job in one place — your experts' scheduled follow-ups and recurring workflow runs from the builder. Open an item to view its chat or workflow, or cancel one you no longer need.",
              "在此集中管理所有自动任务，包括专家的定时跟进，以及在构建器中设置的周期性工作流运行。打开任务可查看对应聊天或工作流，也可取消不再需要的任务。",
            )}
          </Text>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => onGuidedPrompt(NEW_SCHEDULED_TASK_PROMPT)}
            data-testid="schedule-new-button"
          >
            <Icon icon={PlusSignIcon} className="mr-1 h-4 w-4" />
            {t("New scheduled task", "新建定时任务")}
          </Button>
        </div>
      </header>

      {partialError && (
        <div className="rounded-md border border-warning-border bg-warning-surface px-3 py-2">
          <Text
            variant="body"
            tone="warning"
            data-testid="schedules-partial-error"
          >
            {t(
              "Some scheduled items couldn't be loaded — showing the ones that did. Refresh to try again.",
              "部分定时任务无法加载，当前仅显示已加载的任务。请刷新重试。",
            )}
          </Text>
        </div>
      )}

      {paused.length > 0 && (
        <ul
          className="flex flex-col gap-3"
          data-testid="paused-chats-list"
          aria-label={t("Paused scheduled chats", "已暂停的定时聊天")}
        >
          {paused.map((chat) => (
            <li key={`paused:${chat.schedule_key}`}>
              <PausedChatListItem paused={chat} />
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <ErrorCard
          responseError={{
            message:
              error instanceof Error
                ? error.message
                : t("Failed to load schedules", "加载定时任务失败"),
          }}
          context="scheduled items"
        />
      ) : isLoading ? (
        <div
          className="flex items-center justify-center py-16"
          data-testid="followups-loading"
        >
          <LoadingSpinner />
        </div>
      ) : schedules.length === 0 ? (
        paused.length === 0 && <EmptyFollowups />
      ) : (
        <ul
          className="flex flex-col gap-3"
          data-testid="followups-list"
          aria-label={t("Scheduled items", "定时任务")}
        >
          {schedules.map((schedule) => (
            <li key={`${schedule.kind}:${schedule.item.id}`}>
              {schedule.kind === "copilot_turn" ? (
                <FollowupListItem followup={schedule.item} />
              ) : (
                <GraphScheduleListItem schedule={schedule.item} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
