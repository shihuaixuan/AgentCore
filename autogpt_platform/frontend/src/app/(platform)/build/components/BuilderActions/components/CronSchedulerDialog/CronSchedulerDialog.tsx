import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { CronScheduler } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/modals/ScheduleAgentModal/components/CronScheduler/CronScheduler";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useCronSchedulerDialog } from "./useCronSchedulerDialog";

type CronSchedulerDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputs: Record<string, any>;
  credentials: Record<string, any>;
  defaultCronExpression?: string;
  title?: string;
};

export function CronSchedulerDialog({
  open,
  setOpen,

  defaultCronExpression = "",
  title,
  inputs,
  credentials,
}: CronSchedulerDialogProps) {
  const { t } = useTranslation();
  const {
    setCronExpression,
    userTimezone,
    timezoneDisplay,
    handleCreateSchedule,
    scheduleName,
    setScheduleName,
    scheduleNameError,
    isCreatingSchedule,
  } = useCronSchedulerDialog({
    open,
    setOpen,
    inputs,
    credentials,
    defaultCronExpression,
  });
  return (
    <Dialog
      controlled={{ isOpen: open, set: setOpen }}
      title={title ?? t("Schedule Workflow", "定时运行工作流")}
      styling={{ maxWidth: "600px", minWidth: "600px" }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <Input
            id="schedule-name"
            label={t("Schedule Name", "计划名称")}
            placeholder={t("Enter schedule name", "输入计划名称")}
            size="small"
            className="max-w-80"
            value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)}
            error={scheduleNameError}
          />

          <CronScheduler
            onCronExpressionChange={setCronExpression}
            initialCronExpression={defaultCronExpression}
            key={`${open}-${defaultCronExpression}`}
          />

          {/* Timezone info */}
          {userTimezone === "not-set" ? (
            <div className="flex items-center gap-2 rounded-xlarge border border-warning-border bg-warning-surface p-3">
              <span className="flex text-warning-foreground">
                <Icon
                  aria-hidden
                  icon={InformationCircleIcon}
                  className="h-4 w-4"
                />
              </span>
              <Text variant="body" tone="warning">
                {t(
                  "No timezone set. Schedule will run in UTC.",
                  "尚未设置时区。计划将按 UTC 时间运行。",
                )}
                <a href="/settings/account" className="ml-1 underline">
                  <Text variant="body" as="span" tone="inherit">
                    {t("Set your timezone", "设置时区")}
                  </Text>
                </a>
              </Text>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xlarge bg-surface-hover/50 p-3">
              <span className="flex text-foreground-tertiary">
                <Icon
                  aria-hidden
                  icon={InformationCircleIcon}
                  className="h-4 w-4"
                />
              </span>
              <Text variant="body">
                {t(
                  "Schedule will run in your timezone: ",
                  "计划将按你的时区运行：",
                )}
                <Text variant="body-medium" as="span">
                  {timezoneDisplay}
                </Text>
              </Text>
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-fit"
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            loading={isCreatingSchedule}
            disabled={isCreatingSchedule}
            onClick={handleCreateSchedule}
            className="h-fit"
          >
            {isCreatingSchedule
              ? t("Creating schedule...", "正在创建计划…")
              : t("Done", "完成")}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
