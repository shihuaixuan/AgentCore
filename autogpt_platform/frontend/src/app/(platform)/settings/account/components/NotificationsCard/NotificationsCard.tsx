"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";

import { Select } from "@/components/atoms/Select/Select";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";

import {
  BRIEFING_OPTIONS,
  EASE_OUT,
  type BriefingFrequency,
  type NotificationSettings,
} from "../../helpers";

interface Props {
  values: NotificationSettings;
  onBriefingFrequencyChange: (value: BriefingFrequency) => void;
  onAlertsChange: (value: boolean) => void;
  onStoreVerdictsChange: (value: boolean) => void;
  index?: number;
}

export function NotificationsCard({
  values,
  onBriefingFrequencyChange,
  onAlertsChange,
  onStoreVerdictsChange,
  index = 0,
}: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? undefined
          : { duration: 0.32, ease: EASE_OUT, delay: 0.04 + index * 0.05 }
      }
      className="flex w-full flex-col"
    >
      <div className="flex h-fit flex-col gap-4 rounded-large border border-border-base bg-surface px-4 py-3 shadow-message-table">
        <div className="flex flex-col gap-1">
          <Text variant="body-medium" as="span">
            {t("Email", "电子邮箱")}
          </Text>
          <Text variant="small" as="span" tone="muted">
            {t(
              "Billing and account messages are always sent — they are about your account, not a promotion.",
              "账单和账户消息始终会发送——这些是账户相关消息，而非推广。",
            )}
          </Text>
        </div>

        <div className="flex flex-col gap-2">
          <Select
            id="briefing-frequency"
            label={t("Briefing", "简报")}
            value={values.briefingFrequency}
            options={BRIEFING_OPTIONS.map((option) => ({
              value: option.value,
              label: t(
                option.label,
                { DAILY: "每天", WEEKLY: "每周", MONTHLY: "每月", OFF: "关闭" }[
                  option.value
                ],
              ),
            }))}
            onValueChange={(value) =>
              onBriefingFrequencyChange(value as BriefingFrequency)
            }
          />
          <Text variant="small" as="span" tone="muted">
            {t(
              "What your workflows got done, at around 07:30 your time. Never sent when nothing ran.",
              "在当地时间约 07:30 汇总工作流完成的工作。没有运行记录时不会发送。",
            )}
          </Text>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <Text variant="body-medium" as="span">
              {t("Alerts", "提醒")}
            </Text>
            <Text variant="small" as="span" tone="muted">
              {t(
                "Only when something is waiting on you — never for a successful run. At most two a day.",
                "仅在有事项等待你处理时提醒，运行成功时不会提醒。每天最多两次。",
              )}
            </Text>
          </div>
          <Switch
            checked={values.alertsEnabled}
            onCheckedChange={onAlertsChange}
            aria-label={t("Alerts", "提醒")}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <Text variant="body-medium" as="span">
              {t("Marketplace reviews", "市场评价")}
            </Text>
            <Text variant="small" as="span" tone="muted">
              {t(
                "When a workflow you submitted is approved or needs changes.",
                "当你提交的工作流通过审核或需要修改时通知。",
              )}
            </Text>
          </div>
          <Switch
            checked={values.storeVerdictsEnabled}
            onCheckedChange={onStoreVerdictsChange}
            aria-label={t("Marketplace reviews", "市场评价")}
          />
        </div>
      </div>
    </motion.section>
  );
}
