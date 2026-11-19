"use client";

import type { ScheduledChatCadence } from "@/app/api/__generated__/models/scheduledChatCadence";
import { Button } from "@/components/atoms/Button/Button";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { cn } from "@/lib/utils";
import { useId } from "react";
import { lowerFirst } from "./helpers";
import { useRunLessOftenDialog } from "./useRunLessOftenDialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  scheduleKey: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function RunLessOftenDialog({ scheduleKey, isOpen, setIsOpen }: Props) {
  const { t } = useTranslation();
  const dialog = useRunLessOftenDialog({
    scheduleKey,
    isOpen,
    onDone: () => setIsOpen(false),
  });
  const canChoose = (dialog.cadence?.options.length ?? 0) > 0;

  return (
    <Dialog
      controlled={{ isOpen, set: setIsOpen }}
      styling={{ maxWidth: "28rem" }}
      title={
        dialog.cadence
          ? t(
              `Run “${dialog.cadence.title}” less often`,
              `降低“${dialog.cadence.title}”的运行频率`,
            )
          : t("Run less often", "降低运行频率")
      }
    >
      <Dialog.Content>
        {dialog.isLoading ? (
          <div className="flex flex-col gap-2" data-testid="cadence-loading">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : dialog.refusal ? (
          <Text tone="secondary" variant="body">
            {dialog.refusal}
          </Text>
        ) : dialog.isError || !dialog.cadence ? (
          <ErrorCard
            responseError={{
              message: t(
                "Couldn't load how often it runs.",
                "无法加载运行频率。",
              ),
            }}
            context={t("its schedule", "运行计划")}
          />
        ) : (
          <CadenceChoices
            cadence={dialog.cadence}
            selected={dialog.selected}
            onSelect={dialog.select}
          />
        )}
        <Dialog.Footer>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => setIsOpen(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          {canChoose ? (
            <Button
              type="button"
              variant="primary"
              size="small"
              disabled={!dialog.selected}
              loading={dialog.isSaving}
              onClick={dialog.save}
            >
              {t("Save", "保存")}
            </Button>
          ) : null}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

interface ChoicesProps {
  cadence: ScheduledChatCadence;
  selected: string | null;
  onSelect: (cron: string) => void;
}

function CadenceChoices({ cadence, selected, onSelect }: ChoicesProps) {
  const { t } = useTranslation();
  const groupName = useId();

  if (cadence.options.length === 0) {
    return (
      <Text tone="secondary" variant="body">
        {t(
          `“${cadence.title}” already runs once a week or less, so there is nothing less often to switch it to.`,
          `“${cadence.title}”已每周运行一次或更少，无法再降低频率。`,
        )}
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Text tone="secondary" variant="body">
        {cadence.current
          ? t(
              `It runs ${lowerFirst(cadence.current)} now. `,
              `当前运行计划：${cadence.current}。`,
            )
          : ""}
        {t(
          `Fewer runs use less of your allowance. Times are in ${cadence.timezone}.`,
          `减少运行次数可节省额度。时间使用 ${cadence.timezone} 时区。`,
        )}
      </Text>
      <div
        role="radiogroup"
        aria-label={t("How often it runs", "运行频率")}
        className="flex flex-col gap-2"
      >
        {cadence.options.map((option) => (
          <label
            key={option.cron}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-body text-foreground-strong",
              selected === option.cron
                ? "border-action-hover bg-surface-muted"
                : "border-border-base hover:bg-surface-muted",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.cron}
              checked={selected === option.cron}
              onChange={() => onSelect(option.cron)}
              className="size-4 accent-action-hover"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
