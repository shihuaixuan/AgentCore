"use client";

import { Text } from "@/components/atoms/Text/Text";
import { AIConnectionsSection } from "@/components/contextual/IntegrationsPanel/components/AIConnectionsSection/AIConnectionsSection";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export default function AIConnectionsPage() {
  const { t } = useTranslation();

  return (
    <>
      <Text as="h1" variant="h4" className="mb-4 ml-4">
        {t("AI connections", "AI 连接")}
      </Text>
      <AIConnectionsSection />
    </>
  );
}
