import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useGraphStore } from "@/app/(platform)/build/stores/graphStore";
import { Button } from "@/components/atoms/Button/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { useShallow } from "zustand/react/shallow";
import { RunInputDialog } from "../RunInputDialog/RunInputDialog";
import { useRunGraph } from "./useRunGraph";
import { cn } from "@/lib/utils";
import {
  FlaskConicalIcon,
  Loading03Icon,
  PlayIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export const RunGraph = ({ flowID }: { flowID: string | null }) => {
  const { t } = useTranslation();
  const {
    handleRunGraph,
    handleStopGraph,
    openRunInputDialog,
    setOpenRunInputDialog,
    isExecutingGraph,
    isTerminatingGraph,
    isSaving,
    runTarget,
  } = useRunGraph();
  const isGraphRunning = useGraphStore(
    useShallow((state) => state.isGraphRunning),
  );

  const isLoading = isExecutingGraph || isTerminatingGraph || isSaving;
  const runLabel = isLoading
    ? t("Processing...", "处理中…")
    : isGraphRunning
      ? t("Stop workflow", "停止工作流")
      : t("Run workflow", "运行工作流");

  // Determine which icon to show with proper animation
  const renderIcon = () => {
    const iconClass = cn("size-4", !isLoading && "group-hover:scale-110");

    if (isLoading) {
      return <Icon icon={Loading03Icon} spin className={iconClass} />;
    }

    if (isGraphRunning) {
      return <Icon icon={StopIcon} motion="transform" className={iconClass} />;
    }

    return <Icon icon={PlayIcon} motion="transform" className={iconClass} />;
  };

  return (
    <>
      {/* Simulate button — dry-run, no credentials or credits needed */}
      {!isGraphRunning && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost-warning"
              aria-label={t("Simulate workflow", "模拟工作流")}
              withTooltip={false}
              data-id="simulate-graph-button"
              onClick={() => void handleRunGraph({ dryRun: true })}
              disabled={!flowID || isLoading}
              className="group"
            >
              <Icon
                icon={FlaskConicalIcon}
                motion="transform"
                className="size-4 group-hover:scale-110"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t(
              "Simulate workflow (no real execution — LLM-generated outputs)",
              "模拟工作流（不实际执行，输出由大语言模型生成）",
            )}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Run / Stop button */}
      <Button
        size="icon"
        variant={isGraphRunning ? "destructive" : "primary"}
        data-id={isGraphRunning ? "stop-graph-button" : "run-graph-button"}
        aria-label={runLabel}
        onClick={isGraphRunning ? handleStopGraph : () => void handleRunGraph()}
        disabled={!flowID || isLoading}
        className="group"
      >
        {renderIcon()}
      </Button>
      <RunInputDialog
        isOpen={openRunInputDialog}
        setIsOpen={setOpenRunInputDialog}
        purpose="run"
        graphID={runTarget?.graphID}
        graphVersion={runTarget?.graphVersion}
      />
    </>
  );
};
