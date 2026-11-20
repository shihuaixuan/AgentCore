"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { MainDashboardPage } from "./components/MainDashboardPage/MainDashboardPage";

export default function Page() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t(
      "Creator Dashboard – Duanmu Software",
      "创作者面板 – 端木软件",
    );
  }, [t]);

  return <MainDashboardPage />;
}
