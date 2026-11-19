import type { DemotionSummary } from "@/app/api/__generated__/models/demotionSummary";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Text } from "@/components/atoms/Text/Text";
import { shortenUuid } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  item: DemotionSummary;
}

export function DreamDemotionRow({ item }: Props) {
  const { t } = useTranslation();
  return (
    <li className="border-l-2 border-warning-border py-1.5 pl-3">
      <div className="flex items-start justify-between gap-2">
        <Text variant="small-medium" className="break-words">
          {item.reason}
        </Text>
        <Badge
          variant={item.applied ? "success" : "info"}
          size="small"
          className="whitespace-nowrap"
        >
          {item.new_status}
        </Badge>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-foreground-tertiary">
        <code className="font-mono text-tiny leading-inherit">
          {t("edge:", "关系：")} {shortenUuid(item.edge_uuid)}
        </code>
        <Text variant="small" tone="muted" as="span">
          {item.applied ? t("applied", "已应用") : t("not applied", "未应用")}
        </Text>
      </div>
    </li>
  );
}
