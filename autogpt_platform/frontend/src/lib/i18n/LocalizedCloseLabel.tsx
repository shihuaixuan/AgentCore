"use client";

import { useTranslation } from "./LanguageProvider";

export function LocalizedCloseLabel() {
  const { t } = useTranslation();
  return t("Close", "关闭");
}

export function LocalizedDialogDescription() {
  const { t } = useTranslation();
  return t("Dialog", "对话框");
}
