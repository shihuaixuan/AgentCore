import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { GraphModel } from "@/app/api/__generated__/models/graphModel";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { Graph } from "@/lib/autogpt-server-api/types";
import { cn } from "@/lib/utils";
import { Text } from "@/components/atoms/Text/Text";
import { useAgentSafeMode } from "@/hooks/useAgentSafeMode";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { SecurityCheckIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  graph: GraphModel | LibraryAgent | Graph;
  className?: string;
  fullWidth?: boolean;
}

interface SafeModeButtonProps {
  isEnabled: boolean;
  label: string;
  tooltipEnabled: string;
  tooltipDisabled: string;
  onToggle: () => void;
  isPending: boolean;
  fullWidth?: boolean;
}

function SafeModeButton({
  isEnabled,
  label,
  tooltipEnabled,
  tooltipDisabled,
  onToggle,
  isPending,
  fullWidth = false,
}: SafeModeButtonProps) {
  const { t } = useTranslation();
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <Button
          variant={isEnabled ? "primary" : "outline"}
          size="small"
          onClick={onToggle}
          disabled={isPending}
          className={cn("justify-start", fullWidth ? "w-full" : "")}
        >
          {isEnabled ? (
            <>
              <Icon icon={SecurityCheckIcon} size={16} />
              <Text variant="body" className="text-border-base">
                {t(`${label}: ON`, `${label}：已开启`)}
              </Text>
            </>
          ) : (
            <>
              <Icon icon={Shield01Icon} size={16} />
              <Text variant="body" tone="secondary">
                {t(`${label}: OFF`, `${label}：已关闭`)}
              </Text>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <Text variant="small-medium-lh-normal" as="div" tone="inherit">
            {isEnabled
              ? t(`${label}: ON`, `${label}：已开启`)
              : t(`${label}: OFF`, `${label}：已关闭`)}
          </Text>
          <Text variant="small-tight" tone="muted" as="div" className="mt-1">
            {isEnabled ? tooltipEnabled : tooltipDisabled}
          </Text>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function FloatingSafeModeToggle({
  graph,
  className,
  fullWidth = false,
}: Props) {
  const { t } = useTranslation();
  const {
    currentHITLSafeMode,
    showHITLToggle,
    handleHITLToggle,
    currentSensitiveActionSafeMode,
    showSensitiveActionToggle,
    handleSensitiveActionToggle,
    isPending,
    shouldShowToggle,
  } = useAgentSafeMode(graph);

  if (!shouldShowToggle || isPending) {
    return null;
  }

  return (
    <div className={cn("fixed z-50 flex flex-col gap-2", className)}>
      {showHITLToggle && (
        <SafeModeButton
          isEnabled={currentHITLSafeMode}
          label={t("Human in the loop block approval", "人工介入模块审批")}
          tooltipEnabled={t(
            "The workflow will pause at human-in-the-loop blocks and wait for your approval",
            "工作流将在人工介入模块处暂停，等待你的批准",
          )}
          tooltipDisabled={t(
            "Human in the loop blocks will proceed automatically",
            "人工介入模块将自动继续执行",
          )}
          onToggle={handleHITLToggle}
          isPending={isPending}
          fullWidth={fullWidth}
        />
      )}
      {showSensitiveActionToggle && (
        <SafeModeButton
          isEnabled={currentSensitiveActionSafeMode}
          label={t("Sensitive actions blocks approval", "敏感操作模块审批")}
          tooltipEnabled={t(
            "The workflow will pause at sensitive action blocks and wait for your approval",
            "工作流将在敏感操作模块处暂停，等待你的批准",
          )}
          tooltipDisabled={t(
            "Sensitive action blocks will proceed automatically",
            "敏感操作模块将自动继续执行",
          )}
          onToggle={handleSensitiveActionToggle}
          isPending={isPending}
          fullWidth={fullWidth}
        />
      )}
    </div>
  );
}
