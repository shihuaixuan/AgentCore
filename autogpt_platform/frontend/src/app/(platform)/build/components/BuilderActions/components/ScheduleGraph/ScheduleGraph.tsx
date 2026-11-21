import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { TooltipProvider } from "@/components/atoms/Tooltip/BaseTooltip";
import { CronSchedulerDialog } from "../CronSchedulerDialog/CronSchedulerDialog";
import { RunInputDialog } from "../RunInputDialog/RunInputDialog";
import { useScheduleGraph } from "./useScheduleGraph";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export const ScheduleGraph = ({ flowID }: { flowID: string | null }) => {
  const { t } = useTranslation();
  const {
    openScheduleInputDialog,
    setOpenScheduleInputDialog,
    handleScheduleGraph,
    openCronSchedulerDialog,
    setOpenCronSchedulerDialog,
  } = useScheduleGraph();
  return (
    <>
      <TooltipProvider>
        <Button
          variant="outline"
          size="icon"
          data-id="schedule-graph-button"
          aria-label={t("Schedule Workflow", "定时运行工作流")}
          onClick={handleScheduleGraph}
          disabled={!flowID}
        >
          <Icon icon={Clock01Icon} className="size-4" />
        </Button>
      </TooltipProvider>
      <RunInputDialog
        isOpen={openScheduleInputDialog}
        setIsOpen={setOpenScheduleInputDialog}
        purpose="schedule"
      />
      <CronSchedulerDialog
        open={openCronSchedulerDialog}
        setOpen={setOpenCronSchedulerDialog}
        inputs={{}}
        credentials={{}}
      />
    </>
  );
};
