import type { EntityInvalidationSummary } from "@/app/api/__generated__/models/entityInvalidationSummary";
import { Text } from "@/components/atoms/Text/Text";
import { shortenUuid } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  item: EntityInvalidationSummary;
}

export function DreamEntityInvalidationRow({ item }: Props) {
  const { t } = useTranslation();
  const touched = item.edges_touched ?? [];
  return (
    <li className="border-l-2 border-error/20 py-1.5 pl-3">
      <Text variant="small-medium" className="break-words">
        {item.reason}
      </Text>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-foreground-tertiary">
        <code className="font-mono text-tiny leading-inherit">
          {t("entity:", "实体：")} {shortenUuid(item.entity_uuid)}
        </code>
        <Text variant="small" tone="muted" as="span">
          {t(
            `${touched.length} edge${touched.length === 1 ? "" : "s"} touched`,
            `涉及 ${touched.length} 条关系`,
          )}
        </Text>
      </div>
      {touched.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {touched.slice(0, 6).map((u) => (
            <code
              key={u}
              className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-tiny leading-inherit text-foreground-secondary"
            >
              {shortenUuid(u)}
            </code>
          ))}
          {touched.length > 6 ? (
            <Text variant="small" tone="muted" as="span">
              {t(
                `+${touched.length - 6} more`,
                `另有 ${touched.length - 6} 条`,
              )}
            </Text>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
