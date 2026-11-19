"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

export default function Unauthorized() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("Unauthorized Access", "无权访问")}</h1>
      <p>
        {t(
          "You do not have permission to view this page.",
          "你没有权限查看此页面。",
        )}
      </p>
    </div>
  );
}
