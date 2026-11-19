import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  isExpanded: boolean;
  /** How many tiles the button reveals. */
  count: number;
  /** False when the page cap keeps `count` short of the whole catalogue, so
   *  the label stops promising "all" — the header link covers the rest. */
  isAll?: boolean;
  /** Plural noun for the label, e.g. "workflows". */
  noun: string;
  onToggle: () => void;
}

export function ShelfMoreButton({
  isExpanded,
  count,
  isAll = true,
  noun,
  onToggle,
}: Props) {
  const { t, locale } = useTranslation();
  const nouns: Record<string, string> = {
    workflows: "个工作流",
    skills: "项技能",
    experts: "位专家",
  };
  return (
    <Button size="small" aria-expanded={isExpanded} onClick={onToggle}>
      {isExpanded
        ? t("Show fewer", "收起")
        : t(
            `Load ${isAll ? "all " : ""}${count.toLocaleString(locale)} ${noun}`,
            `加载${isAll ? "全部" : ""} ${count.toLocaleString(locale)} ${nouns[noun] ?? noun}`,
          )}
    </Button>
  );
}
