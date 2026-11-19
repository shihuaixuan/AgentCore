"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Link } from "@/components/atoms/Link/Link";
import { Text } from "@/components/atoms/Text/Text";
import { ShowMoreText } from "@/components/molecules/ShowMoreText/ShowMoreText";
import { humanizeCronExpression } from "@/lib/cron-expression-utils";

interface ModalHeaderProps {
  agent: LibraryAgent;
}

export function ModalHeader({ agent }: ModalHeaderProps) {
  const { t, locale } = useTranslation();
  const creator = agent.marketplace_listing?.creator;

  return (
    <div className="flex flex-col gap-4">
      <Badge variant="info" className="w-fit">
        {t("New Task", "新建任务")}
      </Badge>
      <div>
        <Text variant="h2">{agent.name}</Text>
        {creator ? (
          <Link href={`/marketplace/creator/${creator.slug}`} isExternal>
            {t("by", "作者：")} {creator.name}
          </Link>
        ) : null}

        {agent.description ? (
          <ShowMoreText
            previewLimit={400}
            variant="small"
            // oxlint-disable-next-line design-system/no-restyle -- ShowMoreText has no tone prop yet
            className="mt-4 mb-2 !text-foreground-body"
          >
            {agent.description}
          </ShowMoreText>
        ) : null}

        {agent.recommended_schedule_cron && !agent.has_external_trigger ? (
          <div className="flex flex-col gap-4 rounded-medium border border-info/30 bg-info-surface p-4">
            <Text variant="lead-semibold" tone="info-strong">
              {t("Tip", "提示")}
            </Text>
            <div className="h-px w-full bg-info/20" />

            <Text variant="body">
              {t(
                "For best results, run this workflow",
                "为获得最佳效果，建议按以下计划运行此工作流：",
              )}{" "}
              {humanizeCronExpression(
                agent.recommended_schedule_cron,
                locale,
              ).toLowerCase()}
            </Text>
          </div>
        ) : null}

        {agent.instructions ? (
          <div className="mt-4 flex flex-col gap-4 rounded-medium border border-accent-surface bg-accent-surface/50 p-4">
            <Text variant="lead-semibold" tone="brand-strong">
              {t("Instructions", "说明")}
            </Text>

            <div className="h-px w-full bg-brand/10" />

            <Text variant="body">{agent.instructions}</Text>
          </div>
        ) : null}
      </div>
    </div>
  );
}
