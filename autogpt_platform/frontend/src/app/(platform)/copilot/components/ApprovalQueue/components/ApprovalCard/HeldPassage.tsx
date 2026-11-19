import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  passage: string;
}

export function HeldPassage({ passage }: Props) {
  const { t } = useTranslation();
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-caption text-foreground-tertiary">
        {t("What it says", "原文内容")}
      </figcaption>
      <blockquote className="border-l-2 border-warning bg-warning-surface/60 px-3 py-2 text-body [overflow-wrap:anywhere] whitespace-pre-wrap text-foreground-emphasis">
        {passage}
      </blockquote>
    </figure>
  );
}
