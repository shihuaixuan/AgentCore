"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { SectionMobileNav } from "@/components/layout/SectionNav/SectionMobileNav";
import { useSettingsSidebar } from "../SettingsSidebar/useSettingsSidebar";

export function SettingsMobileNav() {
  const { t } = useTranslation();
  const { items } = useSettingsSidebar();
  return <SectionMobileNav items={items} sectionName={t("Settings", "设置")} />;
}
