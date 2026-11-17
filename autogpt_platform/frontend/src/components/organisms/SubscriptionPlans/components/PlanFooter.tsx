"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  onCompare: () => void;
}

export function PlanFooter({ onCompare }: Props) {
  const { t } = useTranslation();
  return (
    <footer
      data-slot="plan-footer"
      className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
    >
      <Text variant="small" tone="muted">
        {t("Need something custom?", "需要定制方案？")}{" "}
        <a
          href="mailto:sales@agpt.co"
          data-slot="plan-footer-sales-link"
          className="font-medium text-brand no-underline hover:text-brand-hover"
        >
          {t("Talk to sales.", "联系销售。")}
        </a>
      </Text>
      <Button
        type="button"
        variant="link"
        size="inline-xs"
        tone="muted"
        onClick={onCompare}
      >
        {t("Compare plans", "比较套餐")}
      </Button>
    </footer>
  );
}
