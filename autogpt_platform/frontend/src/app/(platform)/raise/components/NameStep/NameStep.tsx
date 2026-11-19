"use client";

import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/atoms/Input/Input";
import { cn } from "@/lib/utils";
import { bubbleClassFor } from "../ColorStep/helpers";
import { useNameStep } from "./useNameStep";

interface Props {
  selectedName: string | null;
  suggestions: string[];
  color: string | null;
  onSubmit: (name: string) => void;
}

export function NameStep({
  selectedName,
  suggestions,
  color,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const { custom, setCustom, trimmed, submitCustom } = useNameStep({
    onSubmit,
  });
  // Once a name is picked the step collapses to that one chip, held in the
  // state it had on hover.
  const chips = selectedName ? [selectedName] : suggestions;

  return (
    <div className="flex flex-col items-end gap-4">
      <div
        role="group"
        aria-label={t("Suggested names", "推荐姓名")}
        className="flex flex-wrap justify-end gap-2.5"
      >
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onSubmit(chip)}
            disabled={Boolean(selectedName)}
            aria-pressed={selectedName ? true : undefined}
            className={cn(
              "rounded-full border px-5 py-2.5 text-body font-medium text-foreground-base transition-colors",
              selectedName
                ? (bubbleClassFor(color) ?? "border-brand bg-brand/5")
                : "border-border-base bg-canvas hover:border-brand hover:bg-brand/5",
            )}
          >
            {chip}
          </button>
        ))}
      </div>
      {selectedName ? null : (
        <span
          aria-hidden
          className="mr-4 text-caption font-medium tracking-caps text-foreground-tertiary uppercase"
        >
          {t("or", "或")}
        </span>
      )}
      {selectedName ? null : (
        <form onSubmit={submitCustom} className="flex items-center gap-2">
          <Input
            id="raise-name"
            label={t("Or type your own", "或输入自定义姓名")}
            hideLabel
            size="small"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder={t("Type a name…", "输入姓名…")}
            maxLength={100}
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
            {t("Name me", "为我命名")}
          </Button>
        </form>
      )}
    </div>
  );
}
