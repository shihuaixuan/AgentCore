"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// `!` beats Sonner's own styles. The status colours sit behind a
// `[data-type=…]` selector, which Sonner sets on the toast, so they outrank
// the base background whatever order Tailwind emits the classes in.
const toastClassNames = {
  toast: "!px-4 !py-3 !bg-action-hover !border-action-hover",
  title: "!-mb-[0.15rem] !text-body !font-medium !text-action-foreground",
  description: "!text-caption !leading-5 !text-action-foreground/95",
  error: "[&[data-type=error]]:!bg-error [&[data-type=error]]:!border-error",
  success:
    "[&[data-type=success]]:!bg-success [&[data-type=success]]:!border-success",
  warning:
    "[&[data-type=warning]]:!bg-orange-foreground [&[data-type=warning]]:!border-orange-foreground",
};

export function Toaster() {
  const { t } = useTranslation();
  return (
    <SonnerToaster
      position="bottom-center"
      containerAriaLabel={t("Notifications", "通知")}
      richColors
      closeButton
      toastOptions={{
        classNames: toastClassNames,
        closeButtonAriaLabel: t("Close toast", "关闭通知"),
      }}
      icons={{
        success: null,
        error: null,
        warning: null,
        info: null,
      }}
    />
  );
}
