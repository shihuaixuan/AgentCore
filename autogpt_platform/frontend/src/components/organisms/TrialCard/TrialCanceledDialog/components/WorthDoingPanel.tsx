"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import {
  Clock01Icon,
  DollarSignIcon,
  Note01Icon,
} from "@hugeicons/core-free-icons";
import type { TrialOfferResponse } from "@/app/api/__generated__/models/trialOfferResponse";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  describeTrialTimeLeft,
  formatPlanPrice,
  formatTrialEndDate,
  trialPlanLabels,
} from "../../helpers";

interface Props {
  offer: TrialOfferResponse;
  endsAt: Date | string | null | undefined;
}

export function WorthDoingPanel({ offer, endsAt }: Props) {
  const { t, locale } = useTranslation();
  const planStart = describePlanStart(endsAt, locale);
  const resumeNote = planStart
    ? ` Resume your trial instead and your plan starts ${planStart}.`
    : "";
  const rows = [
    {
      icon: Clock01Icon,
      title: t("Put an Expert on a schedule", "为专家设置计划任务"),
      body: t(
        'Say "do this every Monday at 8am" to any Expert. It runs while you\'re away and the result is waiting on Home.',
        "向任意专家说“每周一早上 8 点执行此任务”。你离开时任务也会运行，结果会显示在首页。",
      ),
    },
    {
      icon: Note01Icon,
      title: t("Your work stays", "工作内容会保留"),
      body: t(
        "Chats, Experts and schedules stay on your account. Subscribe later and you pick up where you left off.",
        "对话、专家和计划任务会保留在账户中。以后订阅时，可以从原处继续。",
      ),
    },
    {
      icon: DollarSignIcon,
      title: t("Subscribe any time", "随时订阅"),
      body: t(
        `${trialPlanLabels[offer.tier]} is ${formatPlanPrice(offer, locale)}, cancel anytime.${resumeNote}`,
        `${trialPlanLabels[offer.tier]} 的费用为 ${formatPlanPrice(offer, locale)}，可随时取消。${planStart ? `也可以恢复试用，套餐将在${planStart === "today" ? "今天" : planStart === "tomorrow" ? "明天" : planStart}开始。` : ""}`,
      ),
    },
  ];

  return (
    <div
      data-slot="worth-doing-panel"
      className="rounded-xl border border-border-base bg-surface-muted px-4 pt-3"
    >
      <Text variant="eyebrow" as="h3">
        {t("Worth doing before then", "到期前值得尝试")}
      </Text>
      <ul
        data-slot="worth-doing-panel-list"
        className="divide-y divide-border-base"
      >
        {rows.map((row) => (
          <li
            key={row.title}
            data-slot="worth-doing-panel-item"
            className="flex gap-3 py-3"
          >
            <span
              data-slot="worth-doing-panel-icon"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-surface"
            >
              <Icon icon={row.icon} size={14} tone="accent" />
            </span>
            <div
              data-slot="worth-doing-panel-content"
              className="flex min-w-0 flex-col gap-0.5"
            >
              <Text variant="body-medium" tone="primary">
                {row.title}
              </Text>
              <Text variant="small" tone="secondary">
                {row.body}
              </Text>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function describePlanStart(endsAt: Props["endsAt"], locale: Locale) {
  if (!endsAt) return null;
  const left = describeTrialTimeLeft(endsAt);
  if (left.kind === "ended") return null;
  return left.kind === "days" ? formatTrialEndDate(endsAt, locale) : left.kind;
}
