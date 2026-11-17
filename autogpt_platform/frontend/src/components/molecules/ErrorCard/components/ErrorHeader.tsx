"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function ErrorHeader() {
  const { t } = useTranslation();
  return (
    <div data-slot="error-card-header" className="flex items-center gap-3">
      <div data-slot="error-card-icon-wrap" className="flex-shrink-0">
        <Icon
          data-slot="error-card-icon"
          icon={Alert01Icon}
          size={24}
          tone="error"
        />
      </div>
      <div data-slot="error-card-heading">
        <Text
          variant="large-semibold"
          data-slot="error-card-title"
          tone="emphasis"
        >
          {t("Something went wrong", "出现了问题")}
        </Text>
      </div>
    </div>
  );
}
