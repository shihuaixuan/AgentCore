"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React from "react";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { MultiToggle } from "@/components/molecules/MultiToggle/MultiToggle";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import { useEditScheduleModal } from "./useEditScheduleModal";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  graphId: string;
  schedule: GraphExecutionJobInfo;
  triggerClassName?: string;
  iconOnly?: boolean;
};

export function EditScheduleModal({
  graphId,
  schedule,
  triggerClassName,
  iconOnly = false,
}: Props) {
  const { t } = useTranslation();
  const {
    isOpen,
    setIsOpen,
    name,
    setName,
    canEditTiming,
    recurrenceLabel,
    repeat,
    setRepeat,
    selectedDays,
    setSelectedDays,
    time,
    setTime,
    errors,
    repeatOptions,
    dayItems,
    handleSave,
    isPending,
  } = useEditScheduleModal(graphId, schedule);

  return (
    <Dialog
      title={t("Edit Schedule", "编辑计划")}
      controlled={{ isOpen, set: setIsOpen }}
      styling={{ maxWidth: "22rem" }}
    >
      <Dialog.Trigger>
        {iconOnly ? (
          <Button
            variant="icon"
            size="icon"
            aria-label={t("Edit schedule", "编辑计划")}
          >
            <Icon icon={PencilEdit02Icon} size={18} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="small"
            // oxlint-disable-next-line design-system/require-static-classes -- callers outside library pass layout/size overrides
            className={triggerClassName ?? "absolute -top-2 -right-2"}
          >
            <Icon icon={PencilEdit02Icon} className="size-4" />{" "}
            {t("Edit schedule", "编辑计划")}
          </Button>
        )}
      </Dialog.Trigger>
      <Dialog.Content>
        <div className="flex flex-col gap-6">
          <Input
            id="schedule-name"
            label={t("Name", "名称")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.scheduleName}
          />
          {canEditTiming ? (
            <>
              <Select
                id="repeat"
                label={t("Repeats", "重复")}
                value={repeat}
                onValueChange={setRepeat}
                options={repeatOptions}
              />
              {repeat === "weekly" && (
                <div className="flex flex-col gap-1">
                  <MultiToggle
                    items={dayItems}
                    selectedValues={selectedDays}
                    onChange={setSelectedDays}
                    aria-label={t("Select days", "选择日期")}
                  />
                  {errors.days && (
                    <Text variant="small" tone="danger">
                      {errors.days}
                    </Text>
                  )}
                </div>
              )}
              <Input
                id="schedule-time"
                label={t("At", "于")}
                value={time}
                onChange={(e) => setTime(e.target.value.trim())}
                placeholder="00:00"
                error={errors.time}
              />
            </>
          ) : (
            <Text variant="body" tone="muted">
              {t(
                `Repeats ${recurrenceLabel.toLowerCase()}. This timing can't be changed here, so saving only renames the schedule.`,
                `重复周期：${recurrenceLabel}。此处无法更改运行时间，保存时仅修改计划名称。`,
              )}
            </Text>
          )}
        </div>
        <Dialog.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setIsOpen(false)}
              className="min-w-32"
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              loading={isPending}
              className="min-w-32"
            >
              {isPending ? t("Saving…", "正在保存…") : t("Save", "保存")}
            </Button>
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
