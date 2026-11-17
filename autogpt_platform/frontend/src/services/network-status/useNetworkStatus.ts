"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// One slot for both states, so "Connection restored" replaces "You're
// offline" instead of stacking on it. Pinned to the top: the default
// bottom-center sits over the chat composer and swallows clicks on it.
const NETWORK_TOAST = { id: "network-status", position: "top-center" } as const;
// Explicit because a replacement keeps the old toast's options: without it
// "Connection restored" inherits the offline toast's Infinity and never goes.
const RESTORED_DURATION_MS = 4_000;

export function useNetworkStatus() {
  const { t } = useTranslation();
  useEffect(
    function monitorNetworkStatus() {
      function handleOnline() {
        toast.success(t("Connection restored", "连接已恢复"), {
          ...NETWORK_TOAST,
          description: t("You're back online", "已重新连接网络"),
          duration: RESTORED_DURATION_MS,
        });
      }

      function handleOffline() {
        toast.error(t("You're offline", "网络已断开"), {
          ...NETWORK_TOAST,
          description: t("Check your internet connection", "请检查网络连接"),
          duration: Infinity,
        });
      }

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return function cleanup() {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    },
    [t],
  );
}
