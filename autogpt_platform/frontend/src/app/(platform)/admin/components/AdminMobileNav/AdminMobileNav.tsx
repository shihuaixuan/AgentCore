"use client";

import { SectionMobileNav } from "@/components/layout/SectionNav/SectionMobileNav";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAdminSidebar } from "../AdminSidebar/useAdminSidebar";

export function AdminMobileNav() {
  const { items } = useAdminSidebar();
  const { t } = useTranslation();
  return (
    <SectionMobileNav
      items={items}
      sectionName={t("Admin", "管理后台")}
      showBackLink
    />
  );
}
