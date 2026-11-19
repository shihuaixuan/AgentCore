"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { DEFAULT_AUTOPILOT_MODE } from "@/app/(platform)/copilot/autopilotModeStore";
import { AUTOPILOT_MODE_OPTIONS } from "@/app/(platform)/copilot/components/ChatInput/components/AutopilotModeSelector/helpers";
import { UnsupervisedConfirmDialog } from "@/app/(platform)/copilot/components/ChatInput/components/AutopilotModeSelector/UnsupervisedConfirmDialog";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { Flag, useGetFlag } from "@/services/feature-flags/use-get-flag";
import { useExpertModeSection } from "./useExpertModeSection";

interface Props {
  expert: Expert;
}

export function ExpertModeSection({ expert }: Props) {
  const isAutoModeEnabled = useGetFlag(Flag.COPILOT_AUTO_MODE);
  if (!isAutoModeEnabled) return null;
  return <ExpertModeOptions expert={expert} />;
}

function ExpertModeOptions({ expert }: Props) {
  const { t, locale } = useTranslation();
  const title = getExpertDisplayTitle(expert, locale);
  const modeLabels = {
    ask_first: "先询问",
    auto: "自动",
    unsupervised: "无人监督",
  };
  const modeDescriptions = {
    ask_first: "每次编辑或执行外部操作前都会询问。沙箱内的工作会直接运行。",
    auto: "任何内容离开平台前，以及可能存在风险的编辑或命令执行前，都会询问。",
    unsupervised: "从不询问。所有操作均无需你批准即可执行。",
  };
  const {
    mode,
    isPending,
    selectMode,
    isConfirmOpen,
    confirmUnsupervised,
    cancelUnsupervised,
  } = useExpertModeSection({ expert });

  return (
    <section
      aria-label={t(`${title} approval mode`, `${title} 的审批模式`)}
      className="rounded-xl border border-border-base bg-surface p-4"
    >
      <Text variant="large-medium">{t("Approvals", "审批")}</Text>
      <Text variant="small" tone="secondary" className="mt-1">
        {t(
          `How every new web chat with ${title} starts. You can still change it per chat from the composer, and chats already open keep their own setting. Routines, scheduled runs and chats from Slack, Discord, Teams or Telegram are not affected.`,
          `与 ${title} 新建网页聊天时使用的默认设置。你仍可在输入框中单独调整每个聊天；已打开的聊天保持原有设置。例行任务、计划运行及来自 Slack、Discord、Teams 或 Telegram 的聊天不受影响。`,
        )}
      </Text>
      <fieldset className="mt-4 flex flex-col gap-2" disabled={isPending}>
        <legend className="sr-only">
          {t("Approval mode for new chats with", "新对话的审批模式：")} {title}
        </legend>
        {AUTOPILOT_MODE_OPTIONS.map((option) => {
          const isSelected = option.value === mode;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl p-3 text-left transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-action",
                isSelected
                  ? "bg-surface ring-2 ring-action ring-inset"
                  : "bg-surface-muted ring-1 ring-border-base ring-inset hover:bg-surface-hover",
                option.value === "unsupervised" &&
                  isSelected &&
                  "bg-warning-surface ring-warning-foreground",
              )}
            >
              <input
                type="radio"
                name="expert-autopilot-mode"
                value={option.value}
                checked={isSelected}
                onChange={() => selectMode(option.value)}
                className="sr-only"
              />
              <span className="mt-0.5 inline-flex shrink-0 text-foreground-body">
                <Icon icon={option.icon} size={18} aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-0.5">
                <Text variant="body-md-medium" as="span" tone="primary">
                  {t(option.label, modeLabels[option.value])}
                  {option.value === DEFAULT_AUTOPILOT_MODE
                    ? t(" (default)", "（默认）")
                    : ""}
                </Text>
                <Text variant="small-tight" as="span" tone="muted">
                  {t(option.description, modeDescriptions[option.value])}
                </Text>
              </span>
            </label>
          );
        })}
      </fieldset>
      <UnsupervisedConfirmDialog
        isOpen={isConfirmOpen}
        onConfirm={confirmUnsupervised}
        onCancel={cancelUnsupervised}
        title={t(
          `Run ${title} unsupervised by default?`,
          `默认让 ${title} 无人监督运行？`,
        )}
        description={t(
          `${title} will not ask before anything in new chats. Edits, commands and actions outside the platform, like sending a message or an email, run without your approval unless you switch a chat back from the composer.`,
          `${title} 在新聊天中执行任何操作前都不会询问。编辑、命令及发送消息或邮件等平台外操作均无需批准，除非你在聊天输入框中切回其他模式。`,
        )}
      />
    </section>
  );
}
