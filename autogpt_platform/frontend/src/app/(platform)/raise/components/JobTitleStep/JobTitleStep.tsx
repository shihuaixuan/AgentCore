"use client";

import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Input } from "@/components/atoms/Input/Input";
import { cn } from "@/lib/utils";
import { Forward02Icon } from "@hugeicons/core-free-icons";
import { bubbleClassFor } from "../ColorStep/helpers";
import { JOB_TITLE_MAX_LENGTH, useJobTitleStep } from "./useJobTitleStep";

interface Props {
  selectedTitle: string | null;
  suggestions: string[];
  color: string | null;
  onSubmit: (jobTitle: string) => void;
  onSkip: () => void;
}

export function JobTitleStep({
  selectedTitle,
  suggestions,
  color,
  onSubmit,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  const { custom, setCustom, trimmed, submitCustom } = useJobTitleStep({
    onSubmit,
  });

  if (selectedTitle === "") {
    return (
      <div
        className={cn(
          "ml-auto rounded-2xl border px-4 py-3 text-body-md leading-relaxed text-foreground-base",
          "flex w-fit items-center gap-2",
          bubbleClassFor(color) ?? "border-brand bg-brand/5",
        )}
      >
        <Icon icon={Forward02Icon} size={16} aria-hidden />
        {t("Skipped", "已跳过")}
      </div>
    );
  }

  const chips = selectedTitle ? [selectedTitle] : suggestions;

  return (
    <div className="flex flex-col items-end gap-4">
      {chips.length > 0 ? (
        <div
          role="group"
          aria-label={t("Suggested job titles", "推荐职位")}
          className="flex flex-wrap justify-end gap-2.5"
        >
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onSubmit(chip)}
              disabled={Boolean(selectedTitle)}
              aria-pressed={selectedTitle ? true : undefined}
              className={cn(
                "rounded-full border px-5 py-2.5 text-body font-medium text-foreground-base transition-colors",
                selectedTitle
                  ? (bubbleClassFor(color) ?? "border-brand bg-brand/5")
                  : "border-border-base bg-canvas hover:border-brand hover:bg-brand/5",
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
      {selectedTitle || chips.length === 0 ? null : (
        <span
          aria-hidden
          className="mr-4 text-caption font-medium tracking-caps text-foreground-tertiary uppercase"
        >
          {t("or", "或")}
        </span>
      )}
      {selectedTitle ? null : (
        <form
          onSubmit={submitCustom}
          className="flex flex-wrap items-center justify-end gap-2"
        >
          <Input
            id="raise-job-title"
            label={t("Job title", "职位")}
            hideLabel
            size="small"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder={t("Type a job title…", "输入职位…")}
            maxLength={JOB_TITLE_MAX_LENGTH}
            wrapperClassName="mb-0 w-full max-w-[16rem] [&_input]:h-[2.625rem] [&_input]:py-3"
          />
          <Button
            type="submit"
            variant="primary"
            size="small"
            disabled={!trimmed}
            shape="rounded"
            className="h-[2.625rem]"
          >
            {t("Add title", "添加职位")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={onSkip}
            shape="rounded"
            className="h-[2.625rem]"
          >
            {t("Skip", "跳过")}
          </Button>
        </form>
      )}
    </div>
  );
}
