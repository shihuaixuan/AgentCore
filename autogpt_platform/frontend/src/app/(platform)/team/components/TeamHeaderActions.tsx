"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";

export function TeamHeaderActions() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button as="NextLink" href="/raise" variant="secondary" size="small">
        {t("Create an Expert", "创建专家")}
      </Button>
      <Button
        as="NextLink"
        href="/marketplace#experts"
        variant="primary"
        size="small"
      >
        {t("Hire expert", "聘用专家")}
      </Button>
    </div>
  );
}
