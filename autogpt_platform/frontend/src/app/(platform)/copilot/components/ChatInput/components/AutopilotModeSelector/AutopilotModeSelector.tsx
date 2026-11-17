"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Icon } from "@/components/atoms/Icon/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { cn } from "@/lib/utils";
import type { AutopilotMode } from "../../../../autopilotModeStore";
import {
  AUTOPILOT_MODE_OPTIONS,
  getModeOption,
  unsupervisedChatDescription,
} from "./helpers";
import { UnsupervisedConfirmDialog } from "./UnsupervisedConfirmDialog";
import { useAutopilotModeSelector } from "./useAutopilotModeSelector";

interface Props {
  sessionId: string | null;
  persistedMode: AutopilotMode | null;
  disabled?: boolean;
}

export function AutopilotModeSelector({
  sessionId,
  persistedMode,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const {
    mode,
    isDefault,
    selectMode,
    isConfirmOpen,
    confirmUnsupervised,
    cancelUnsupervised,
    assistantName,
  } = useAutopilotModeSelector({ sessionId, persistedMode });
  const labels = {
    ask_first: t("Ask first", "始终询问"),
    auto: t("Auto", "自动"),
    unsupervised: t("Unsupervised", "自主执行"),
  };
  const descriptions = {
    ask_first: t(
      AUTOPILOT_MODE_OPTIONS[0].description,
      "每次编辑或对外操作前询问；沙箱内的工作可直接执行。",
    ),
    auto: t(
      AUTOPILOT_MODE_OPTIONS[1].description,
      "信息离开平台前，以及执行看似有风险的编辑或命令前询问。",
    ),
    unsupervised: t(
      AUTOPILOT_MODE_OPTIONS[2].description,
      "不再询问，所有操作无需批准即可执行。",
    ),
  };
  const current = { ...getModeOption(mode), label: labels[mode] };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            aria-label={t(
              `Approval mode: ${current.label}. Change mode`,
              `审批模式：${current.label}。更改模式`,
            )}
            title={t(
              `Approval mode: ${current.label}`,
              `审批模式：${current.label}`,
            )}
            className={cn(
              "inline-flex h-8 items-center justify-center gap-1 rounded-full text-caption font-medium transition-colors focus-visible:ring-2 focus-visible:ring-foreground-subtle focus-visible:outline-none",
              isDefault
                ? "w-8 text-foreground-tertiary hover:bg-surface-hover hover:text-foreground-body"
                : "px-2.5",
              mode === "ask_first" &&
                "bg-surface-hover text-foreground-body hover:bg-surface-active",
              mode === "unsupervised" &&
                "bg-warning-surface text-warning-foreground hover:bg-warning-border/40",
              disabled && "opacity-40",
            )}
          >
            <Icon icon={current.icon} size={16} aria-hidden="true" />
            {!isDefault && <span>{current.label}</span>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-caption font-medium text-foreground-tertiary">
            {t("Approvals in this chat", "此对话的审批设置")}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={mode} onValueChange={selectMode}>
            {AUTOPILOT_MODE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="items-start"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground-strong">
                    {labels[option.value]}
                  </span>
                  <span className="text-caption text-foreground-tertiary">
                    {descriptions[option.value]}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <UnsupervisedConfirmDialog
        isOpen={isConfirmOpen}
        onConfirm={confirmUnsupervised}
        onCancel={cancelUnsupervised}
        description={t(
          unsupervisedChatDescription(assistantName),
          assistantName +
            " 不会在此对话中请求确认。编辑、命令以及发送消息或邮件等平台外操作都将直接执行，无需你的批准。",
        )}
      />
    </>
  );
}
