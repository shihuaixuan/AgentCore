"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Text } from "@/components/atoms/Text/Text";
import { IntegrationsMarquee } from "@/components/molecules/IntegrationsMarquee/IntegrationsMarquee";

interface Props {
  query: string;
}

export function IntegrationsListEmpty({ query }: Props) {
  const { t } = useTranslation();

  const trimmed = query.trim();

  // A search usually lands in Available integrations below, so a miss here
  // is one quiet line rather than the full empty state.
  if (trimmed) {
    return (
      <div className="px-4">
        <Text variant="body" tone="muted">
          {t(
            `None of your connected integrations match "${trimmed}".`,
            `已连接的集成中没有与“${trimmed}”匹配的项目。`,
          )}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <IntegrationsMarquee />
      <div className="flex flex-col items-center gap-1">
        <Text variant="large-medium" as="span">
          {t("No integration connected", "尚未连接集成")}
        </Text>
        <Text variant="body" tone="muted" className="max-w-[360px]">
          {t(
            "Connect a service to let your experts and workflows use third-party tools like GitHub, Gmail, or Figma.",
            "连接服务，让专家和工作流使用 GitHub、Gmail 或 Figma 等第三方工具。",
          )}
        </Text>
      </div>
    </div>
  );
}
