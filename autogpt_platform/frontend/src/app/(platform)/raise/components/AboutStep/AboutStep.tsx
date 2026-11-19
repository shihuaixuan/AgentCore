"use client";

import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Input } from "@/components/atoms/Input/Input";
import { cn } from "@/lib/utils";
import { Forward02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { bubbleClassFor } from "../ColorStep/helpers";
import { aboutPlaceholderFor } from "./helpers";

interface Props {
  submittedAbout: string | null;
  name: string | null;
  color: string | null;
  onSubmit: (about: string) => void;
  onSkip: () => void;
}

export function AboutStep({
  submittedAbout,
  name,
  color,
  onSubmit,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  if (submittedAbout !== null) {
    const isSkipped = submittedAbout === "";

    return (
      <div
        className={cn(
          "ml-auto max-w-[80%] rounded-2xl border px-4 py-3 text-body-md leading-relaxed text-foreground-base",
          isSkipped && "flex w-fit items-center gap-2",
          bubbleClassFor(color) ?? "border-brand bg-brand/5",
        )}
      >
        {isSkipped ? (
          <>
            <Icon icon={Forward02Icon} size={16} aria-hidden />
            {t("Skipped", "已跳过")}
          </>
        ) : (
          submittedAbout
        )}
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col items-end gap-3"
    >
      <Input
        id="raise-about"
        type="textarea"
        label={t("Anything about your expert", "关于专家的补充说明")}
        hideLabel
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t(
          aboutPlaceholderFor(name),
          `描述${name?.trim() || "专家"}应如何工作、你关心什么，以及其他有助于体现你偏好的信息…`,
        )}
        rows={4}
        maxLength={2000}
        wrapperClassName="mb-0 w-full max-w-[42rem]"
      />
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          variant="primary"
          size="small"
          disabled={!trimmed}
          shape="rounded"
          className="h-[2.625rem]"
        >
          {t("That's it", "就这样")}
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
      </div>
    </form>
  );
}
