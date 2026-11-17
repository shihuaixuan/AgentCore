import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React from "react";
import { Button } from "@/components/atoms/Button/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { cn, beautifyString } from "@/lib/utils";
import { CustomNodeData } from "../../CustomNode";
import { useSubAgentUpdateState } from "./useSubAgentUpdateState";
import { IncompatibleUpdateDialog } from "./components/IncompatibleUpdateDialog";
import { ResolutionModeBar } from "./components/ResolutionModeBar";
import { Alert01Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";

/**
 * Inline component for the update bar that can be placed after the header.
 * Use this inside the node content where you want the bar to appear.
 */
type SubAgentUpdateFeatureProps = {
  nodeID: string;
  nodeData: CustomNodeData;
};

export function SubAgentUpdateFeature({
  nodeID,
  nodeData,
}: SubAgentUpdateFeatureProps) {
  const { t } = useTranslation();
  const {
    updateInfo,
    isInResolutionMode,
    handleUpdateClick,
    showIncompatibilityDialog,
    setShowIncompatibilityDialog,
    handleConfirmIncompatibleUpdate,
  } = useSubAgentUpdateState({ nodeID: nodeID, nodeData: nodeData });

  const agentName = nodeData.title || t("Workflow", "工作流");

  if (!updateInfo.hasUpdate && !isInResolutionMode) {
    return null;
  }

  return (
    <>
      {isInResolutionMode ? (
        <ResolutionModeBar incompatibilities={updateInfo.incompatibilities} />
      ) : (
        <SubAgentUpdateAvailableBar
          currentVersion={updateInfo.currentVersion}
          latestVersion={updateInfo.latestVersion}
          isCompatible={updateInfo.isCompatible}
          onUpdate={handleUpdateClick}
        />
      )}
      {/* Incompatibility dialog - rendered here since this component owns the state */}
      {updateInfo.incompatibilities && (
        <IncompatibleUpdateDialog
          isOpen={showIncompatibilityDialog}
          onClose={() => setShowIncompatibilityDialog(false)}
          onConfirm={handleConfirmIncompatibleUpdate}
          currentVersion={updateInfo.currentVersion}
          latestVersion={updateInfo.latestVersion}
          agentName={beautifyString(agentName)}
          incompatibilities={updateInfo.incompatibilities}
        />
      )}
    </>
  );
}

type SubAgentUpdateAvailableBarProps = {
  currentVersion: number;
  latestVersion: number;
  isCompatible: boolean;
  onUpdate: () => void;
};

function SubAgentUpdateAvailableBar({
  currentVersion,
  latestVersion,
  isCompatible,
  onUpdate,
}: SubAgentUpdateAvailableBarProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-2 rounded-t-xl bg-info-surface px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon icon={ArrowUp02Icon} tone="info-strong" className="h-4 w-4" />
        <Text variant="body-tight" as="span" tone="info-strong">
          {t(
            `Update available (v${currentVersion} → v${latestVersion})`,
            `有可用更新（v${currentVersion} → v${latestVersion}）`,
          )}
        </Text>
        {!isCompatible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Icon
                icon={Alert01Icon}
                tone="warning-bright"
                className="h-4 w-4"
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <Text variant="small-medium-lh-normal" tone="inherit">
                {t("Incompatible changes detected", "检测到不兼容的变更")}
              </Text>
              <Text variant="small-tight" tone="subtle">
                {t("Click Update to see details", "点击更新查看详情")}
              </Text>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Button
        size="small"
        variant={isCompatible ? "primary" : "outline"}
        tone={isCompatible ? undefined : "warning"}
        onClick={onUpdate}
        className={cn(
          "h-7",
          !isCompatible && "border-warning hover:bg-warning-surface",
        )}
      >
        <Text variant="small-medium-tight" as="span" tone="inherit">
          {t("Update", "更新")}
        </Text>
      </Button>
    </div>
  );
}
