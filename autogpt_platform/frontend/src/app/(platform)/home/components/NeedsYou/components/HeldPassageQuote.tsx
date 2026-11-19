import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  passage: string;
  // Off where the passage can be released from the row: what is released must be shown whole.
  clamp?: boolean;
}

export function HeldPassageQuote({ passage, clamp = true }: Props) {
  const { t } = useTranslation();
  return (
    <blockquote
      aria-label={t("What it says", "引用内容")}
      className={cn(
        "mt-1 border-l-2 border-warning pl-2 text-body [overflow-wrap:anywhere] text-foreground-secondary",
        clamp && "line-clamp-2",
      )}
    >
      {passage}
    </blockquote>
  );
}
