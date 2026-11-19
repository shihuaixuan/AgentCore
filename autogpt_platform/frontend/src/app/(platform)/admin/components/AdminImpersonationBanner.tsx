"use client";

import { useAdminImpersonation } from "./useAdminImpersonation";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function AdminImpersonationBanner() {
  const { t } = useTranslation();
  const { isImpersonating, impersonatedUserId, stopImpersonating } =
    useAdminImpersonation();

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-warning bg-warning-surface p-4 text-warning-foreground">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <strong className="font-semibold">
            {t("⚠️ ADMIN IMPERSONATION ACTIVE", "⚠️ 管理员模拟登录中")}
          </strong>
          <span>
            {t(
              "You are currently acting as user:",
              "你当前正以此用户身份操作：",
            )}{" "}
            <code className="rounded bg-warning-surface px-1 font-mono text-body">
              {impersonatedUserId}
            </code>
          </span>
        </div>
        <button
          onClick={stopImpersonating}
          className="ml-4 flex h-8 items-center rounded-md border border-warning-border bg-transparent px-3 text-body hover:bg-warning-surface"
        >
          {t("Stop Impersonation", "停止模拟登录")}
        </button>
      </div>
    </div>
  );
}
