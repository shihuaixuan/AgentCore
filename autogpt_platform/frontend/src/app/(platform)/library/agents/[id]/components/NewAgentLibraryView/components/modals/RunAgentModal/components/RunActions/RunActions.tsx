import React from "react";
import { Button } from "@/components/atoms/Button/Button";
import { RunVariant } from "../../useAgentRunModal";
import { FlaskConicalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  defaultRunType: RunVariant;
  onRun: () => void;
  onSimulate?: () => void;
  isExecuting?: boolean;
  isSettingUpTrigger?: boolean;
  isRunReady?: boolean;
  scheduleButton?: React.ReactNode;
}

export function RunActions({
  defaultRunType,
  onRun,
  onSimulate,
  isExecuting = false,
  isSettingUpTrigger = false,
  isRunReady = true,
  scheduleButton,
}: Props) {
  const { t } = useTranslation();
  const isTrigger =
    defaultRunType === "automatic-trigger" ||
    defaultRunType === "manual-trigger";

  return (
    <div className="flex justify-end gap-3">
      {!isTrigger && onSimulate && (
        <Button
          variant="ghost-warning"
          onClick={onSimulate}
          disabled={isExecuting || isSettingUpTrigger}
          loading={isExecuting}
        >
          <Icon icon={FlaskConicalIcon} size={16} />
          {t("Simulate", "模拟运行")}
        </Button>
      )}
      {scheduleButton}
      <Button
        variant="primary"
        onClick={onRun}
        disabled={!isRunReady || isExecuting || isSettingUpTrigger}
        loading={isExecuting || isSettingUpTrigger}
      >
        {isTrigger
          ? t("Set up Trigger", "设置触发器")
          : t("Start Task", "开始任务")}
      </Button>
    </div>
  );
}
