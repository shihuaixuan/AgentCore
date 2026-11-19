"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Expert } from "@/app/api/__generated__/models/expert";
import type { LearningHistoryItem } from "@/app/api/__generated__/models/learningHistoryItem";
import { Select } from "@/components/atoms/Select/Select";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { formatWhen } from "../helpers";
import { ORIGIN_FILTERS, STATE_FILTERS } from "../useLearningHistory";

interface Props {
  items: LearningHistoryItem[];
  isLoading: boolean;
  experts: Expert[];
  origin: string;
  state: string;
  onOriginChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onOpen: (item: LearningHistoryItem) => void;
}

export function LearningHistoryCard({
  items,
  isLoading,
  experts,
  origin,
  state,
  onOriginChange,
  onStateChange,
  onOpen,
}: Props) {
  const { t, locale } = useTranslation();
  const originLabels: Record<string, string> = {
    all: "所有来源",
    saved_overnight: "夜间保存",
    saved_during_work: "工作期间保存",
    requested: "按请求创建",
    edited: "已编辑",
    restored: "已恢复",
    imported: "已导入",
  };
  const stateLabels: Record<string, string> = {
    all: "所有状态",
    ready: "可使用",
    needs_decision: "需要你决策",
    blocked_content: "未通过内容检查",
    archived: "已归档",
    invalidated: "已归档（来源不可用）",
  };
  function expertTitle(expertId: string | null | undefined) {
    if (!expertId) return "Otto";
    return getExpertDisplayTitle(
      experts.find((expert) => expert.id === expertId),
      locale,
    );
  }
  return (
    <div
      className="flex flex-col rounded-large border border-border-base bg-surface px-4 py-4 shadow-message-table"
      data-testid="learning-history-card"
    >
      <Text variant="body-medium" as="span">
        {t("Learning history", "学习记录")}
      </Text>
      <Text variant="small" as="span" tone="muted">
        {t(
          "What overnight learning changed, where it came from, and what it did not learn.",
          "夜间学习改变了什么、依据来自哪里，以及哪些内容未被学习。",
        )}
      </Text>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Select
          id="learning-origin"
          label={t("Origin", "来源")}
          hideLabel
          size="small"
          value={origin}
          onValueChange={onOriginChange}
          options={ORIGIN_FILTERS.map((option) => ({
            ...option,
            label: t(option.label, originLabels[option.value] ?? option.label),
          }))}
        />
        <Select
          id="learning-state"
          label={t("State", "状态")}
          hideLabel
          size="small"
          value={state}
          onValueChange={onStateChange}
          options={STATE_FILTERS.map((option) => ({
            ...option,
            label: t(option.label, stateLabels[option.value] ?? option.label),
          }))}
        />
      </div>
      <div className="mt-2 flex flex-col divide-y divide-separator">
        {isLoading ? (
          <div className="flex flex-col gap-2 py-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : items.length === 0 ? (
          <Text variant="small" as="p" tone="muted" className="my-3">
            {t(
              "Nothing learned yet. A quiet night means nothing needed to change.",
              "尚无学习记录。安静的一夜意味着没有需要调整的内容。",
            )}
          </Text>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex flex-col gap-0.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <Text
                  variant="small-medium"
                  as="span"
                  className="min-w-0 truncate"
                >
                  {item.skill_name ? (
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => onOpen(item)}
                    >
                      {item.skill_name}
                      {item.version ? ` v${item.version}` : ""}
                    </button>
                  ) : (
                    t("Review", "审核")
                  )}
                </Text>
                <Text
                  variant="small"
                  as="span"
                  tone="subtle"
                  className="shrink-0"
                >
                  {formatWhen(new Date(item.created_at).toISOString(), locale)}
                </Text>
              </div>
              <Text variant="small" as="span" tone="secondary">
                {item.summary}
              </Text>
              <Text variant="small" as="span" tone="muted">
                {[
                  expertTitle(item.expert_id),
                  t(
                    item.origin_label ?? "",
                    originLabels[item.origin ?? ""] ?? item.origin_label ?? "",
                  ),
                  t(
                    item.state_label ?? "",
                    stateLabels[item.state ?? ""] ?? item.state_label ?? "",
                  ),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
