"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipPortal,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { Icon } from "@/components/atoms/Icon/Icon";
import { cn } from "@/lib/utils";
import { FlaskConicalIcon } from "@hugeicons/core-free-icons";

// This button is only rendered on NEW chats (no active session).
// Once a session exists, it is hidden — the session's dry_run flag is
// locked and surfaced via the banner in CopilotPage.tsx instead.

interface Props {
  isDryRun: boolean;
  onToggle: () => void;
}

export function DryRunToggleButton({ isDryRun, onToggle }: Props) {
  const { t } = useTranslation();
  const tooltip = isDryRun
    ? t(
        "Test mode on — new sessions run without performing real actions (click to turn off).",
        "测试模式已开启：新对话不会执行实际操作（点击关闭）。",
      )
    : t(
        "Turn on test mode to try prompts without performing real actions.",
        "开启测试模式，尝试提示词而不执行实际操作。",
      );
  const ariaLabel = isDryRun
    ? t("Test mode active", "测试模式已开启")
    : t("Enable Test mode", "开启测试模式");

  return (
    <Tooltip inheritDelay>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-pressed={isDryRun}
          onClick={onToggle}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-hover",
            isDryRun
              ? "text-warning-foreground/80 hover:text-warning-foreground"
              : "text-foreground-tertiary hover:text-foreground-body",
          )}
          aria-label={ariaLabel}
        >
          <Icon icon={FlaskConicalIcon} size={16} />
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{tooltip}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}
