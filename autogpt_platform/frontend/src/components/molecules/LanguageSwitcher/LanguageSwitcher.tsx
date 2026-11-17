"use client";

import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div data-slot="language-switcher" className="fixed right-4 bottom-4 z-50">
      <Button
        variant="secondary"
        size="small"
        aria-label={t("Switch to Simplified Chinese", "切换为英文")}
        onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
      >
        {locale === "zh-CN" ? "English" : "简体中文"}
      </Button>
    </div>
  );
}
