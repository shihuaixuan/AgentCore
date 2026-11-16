"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useEffect, useState } from "react";
import { BaseInput } from "@/components/atoms/Input/BaseInput";
import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { CronScheduler } from "@/components/contextual/CronScheduler/cron-scheduler";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { getTimezoneDisplayName } from "@/lib/timezone-utils";
import { useUserTimezone } from "@/lib/hooks/useUserTimezone";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

// Base type for cron expression only
type CronOnlyCallback = (cronExpression: string) => void;
// Type for cron expression with schedule name
type CronWithNameCallback = (
  cronExpression: string,
  scheduleName: string,
) => void;

type CronSchedulerDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  defaultCronExpression?: string;
  title?: string;
} & (
  | {
      // For cases where only cron expression is needed (builder, submission)
      mode: "cron-only";
      onSubmit: CronOnlyCallback;
    }
  | {
      // For cases where schedule name is required (agent run)
      mode: "with-name";
      onSubmit: CronWithNameCallback;
      defaultScheduleName?: string;
    }
);

export function CronSchedulerDialog(props: CronSchedulerDialogProps) {
  const { t } = useTranslation();

  const {
    open,
    setOpen,
    defaultCronExpression = "",
    title = t("Schedule Task", "设置定时任务"),
  } = props;

  const { toast } = useToast();
  const [cronExpression, setCronExpression] = useState<string>("");
  const [scheduleName, setScheduleName] = useState<string>(
    props.mode === "with-name" ? props.defaultScheduleName || "" : "",
  );

  // Get user's timezone
  const userTimezone = useUserTimezone();
  const timezoneDisplay = getTimezoneDisplayName(userTimezone || "UTC");

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const defaultName =
        props.mode === "with-name" ? props.defaultScheduleName || "" : "";
      setScheduleName(defaultName);
      setCronExpression(defaultCronExpression);
    }
  }, [open, props, defaultCronExpression]);

  const handleDone = () => {
    if (props.mode === "with-name" && !scheduleName.trim()) {
      toast({
        title: t("Please enter a schedule name", "请输入计划名称"),
        variant: "destructive",
      });
      return;
    }

    // Validate cron expression before proceeding
    if (!cronExpression || cronExpression.trim() === "") {
      toast({
        variant: "destructive",
        title: t("Invalid schedule", "计划无效"),
        description: t(
          "Please enter a valid cron expression",
          "请输入有效的 Cron 表达式",
        ),
      });
      return;
    }

    if (props.mode === "with-name") {
      props.onSubmit(cronExpression, scheduleName);
    } else {
      props.onSubmit(cronExpression);
    }
    setOpen(false);
  };

  return (
    <Dialog
      controlled={{ isOpen: open, set: setOpen }}
      title={title}
      styling={{ maxWidth: "600px" }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          {props.mode === "with-name" && (
            <div className="flex max-w-[448px] flex-col space-y-2">
              <Text variant="body-medium-tight" as="label" tone="inherit">
                {t("Schedule Name", "计划名称")}
              </Text>
              <BaseInput
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder={t(
                  "Enter a name for this schedule",
                  "输入此计划的名称",
                )}
              />
            </div>
          )}

          <CronScheduler
            onCronExpressionChange={setCronExpression}
            initialCronExpression={defaultCronExpression}
            key={`${open}-${defaultCronExpression}`}
          />

          {/* Timezone info */}
          {userTimezone === "not-set" ? (
            <div className="flex items-center gap-2 rounded-md border border-warning-border bg-warning-surface p-3">
              <span className="flex text-warning-foreground">
                <Icon
                  aria-hidden
                  icon={InformationCircleIcon}
                  className="h-4 w-4"
                />
              </span>
              <Text variant="body-tight" tone="warning-strong">
                {t(
                  "No timezone set. Schedule will run in UTC.",
                  "尚未设置时区。计划将按 UTC 运行。",
                )}
                <a href="/settings/account" className="ml-1 underline">
                  {t("Set your timezone", "设置时区")}
                </a>
              </Text>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-surface-hover/50 p-3">
              <span className="flex text-foreground-tertiary">
                <Icon
                  aria-hidden
                  icon={InformationCircleIcon}
                  className="h-4 w-4"
                />
              </span>
              <Text variant="body-tight" tone="muted">
                {t(
                  "Schedule will run in your timezone:",
                  "计划将按您的时区运行：",
                )}{" "}
                <span className="font-medium">{timezoneDisplay}</span>
              </Text>
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-end space-x-2">
          <Button
            variant="compact-outline"
            size="compact"
            onClick={() => setOpen(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button variant="compact-primary" size="compact" onClick={handleDone}>
            {t("Done", "完成")}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

// Convenience components for common use cases
export function CronExpressionDialog({
  open,
  setOpen,
  onSubmit,
  defaultCronExpression,
  title,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (cronExpression: string) => void;
  defaultCronExpression?: string;
  title?: string;
}) {
  const { t } = useTranslation();

  return (
    <CronSchedulerDialog
      open={open}
      setOpen={setOpen}
      mode="cron-only"
      onSubmit={onSubmit}
      defaultCronExpression={defaultCronExpression}
      title={title ?? t("Set Schedule", "设置计划")}
    />
  );
}

export function ScheduleTaskDialog({
  open,
  setOpen,
  onSubmit,
  defaultScheduleName,
  defaultCronExpression,
  title,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (cronExpression: string, scheduleName: string) => void;
  defaultScheduleName?: string;
  defaultCronExpression?: string;
  title?: string;
}) {
  const { t } = useTranslation();

  return (
    <CronSchedulerDialog
      open={open}
      setOpen={setOpen}
      mode="with-name"
      onSubmit={onSubmit}
      defaultScheduleName={defaultScheduleName}
      defaultCronExpression={defaultCronExpression}
      title={title ?? t("Schedule Task", "设置定时任务")}
    />
  );
}
