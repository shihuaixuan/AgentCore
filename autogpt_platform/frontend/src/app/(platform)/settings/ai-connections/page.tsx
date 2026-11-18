"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ManagedModelsSection } from "./ManagedModelsSection";

export default function AIConnectionsPage() {
  const { t } = useTranslation();

  return (
    <>
      <Text as="h1" variant="h4" className="mb-4 ml-4">
        {t("Chat models", "聊天模型")}
      </Text>
      <ManagedModelsSection />
    </>
  );
}
