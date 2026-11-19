import type { WriteSummary } from "@/app/api/__generated__/models/writeSummary";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Text } from "@/components/atoms/Text/Text";
import { formatConfidence, shortenUuid } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  item: WriteSummary;
}

export function DreamWriteRow({ item }: Props) {
  const { t } = useTranslation();
  return (
    <li className="border-l-2 border-brand/20 py-1.5 pl-3">
      <div className="flex items-start justify-between gap-2">
        <Text variant="small-medium" className="break-words">
          {item.content}
        </Text>
        {item.status ? (
          <Badge variant="info" size="small">
            {item.status}
          </Badge>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-foreground-tertiary">
        <code className="font-mono text-tiny leading-inherit">
          {t("edge:", "关系：")} {shortenUuid(item.edge_uuid)}
        </code>
        {item.scope ? (
          <Text variant="small" tone="muted" as="span">
            {t("scope:", "范围：")} {item.scope}
          </Text>
        ) : null}
        <Text variant="small" tone="muted" as="span">
          {t("confidence:", "置信度：")} {formatConfidence(item.confidence)}
        </Text>
        {item.source_episode_uuids && item.source_episode_uuids.length > 0 ? (
          <Text variant="small" tone="muted" as="span">
            {t("sources:", "来源数：")} {item.source_episode_uuids.length}
          </Text>
        ) : null}
      </div>
    </li>
  );
}
