"use client";

import { useCallback, useRef } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/lib/auth/hooks/useAuthStore";
import {
  ImpersonationState,
  stopImpersonationEverywhere,
} from "@/lib/impersonation";
import {
  beginImpersonation,
  type BeginImpersonationOutcome,
} from "./beginImpersonation";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { usePostV2NotifyImpersonationStart } from "@/app/api/__generated__/endpoints/admin/admin";

interface AdminImpersonationState {
  isImpersonating: boolean;
  impersonatedUserId: string | null;
  isStarting: boolean;
}

interface AdminImpersonationActions {
  startImpersonating: (userId: string) => Promise<void>;
  stopImpersonating: () => void;
}

type AdminImpersonationHook = AdminImpersonationState &
  AdminImpersonationActions;

const OUTCOME_MESSAGES: Record<
  Exclude<BeginImpersonationOutcome, "started">,
  string
> = {
  "no-admin": "Sign in again to impersonate a user.",
  "audit-failed": "Audit alert failed — impersonation blocked.",
  "admin-changed":
    "You were signed out or your account changed while it was starting.",
};

export function useAdminImpersonation(): AdminImpersonationHook {
  const { t } = useTranslation();
  // Re-read whenever the signed-in user changes: after the reload that starts
  // impersonation, the target only counts once the owning admin is known.
  const viewer = useAuthStore((state) => state.user);
  const impersonatedUserId = viewer ? ImpersonationState.get() : null;
  const { toast } = useToast();
  const { mutateAsync: notifyImpersonationStart, isPending: isStarting } =
    usePostV2NotifyImpersonationStart();
  // Synchronous re-entry guard: `isStarting` only flips on re-render, so rapid
  // double-clicks could otherwise fire two audit alerts for one impersonation.
  const startingRef = useRef(false);

  const isImpersonating = Boolean(impersonatedUserId);

  const startImpersonating = useCallback(
    async (userId: string) => {
      if (startingRef.current) return;

      if (!userId.trim()) {
        toast({
          title: t("User ID is required for impersonation", "模拟登录必须提供用户 ID"),
          variant: "destructive",
        });
        return;
      }

      startingRef.current = true;
      try {
        // The audit alert GATES impersonation and is sent before any target
        // is stored, so it authenticates as the admin. The Orval mutator
        // throws on non-2xx, so a failed/blocked alert aborts the swap.
        const outcome = await beginImpersonation(userId, () =>
          notifyImpersonationStart({ data: { target_user_id: userId } }),
        );
        if (outcome !== "started") {
          toast({
            title: t("Couldn't start impersonation", "无法开始模拟登录"),
            description: t(OUTCOME_MESSAGES[outcome], outcome === "no-admin" ? "请重新登录后再模拟用户。" : outcome === "audit-failed" ? "审计告警失败，模拟登录已被阻止。" : "开始模拟登录时，你已退出登录或账户发生变化。"),
            variant: "destructive",
          });
          return;
        }

        window.location.reload();
      } catch (error) {
        console.error("Failed to start impersonation:", error);
        toast({
          title: t("Failed to start impersonation", "开始模拟登录失败"),
          description: error instanceof Error ? error.message : t("Unknown error", "未知错误"),
          variant: "destructive",
        });
      } finally {
        startingRef.current = false;
      }
    },
    [toast, notifyImpersonationStart],
  );

  const stopImpersonating = useCallback(() => {
    try {
      stopImpersonationEverywhere();
      window.location.reload();
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
      toast({
        title: t("Failed to stop impersonation", "停止模拟登录失败"),
        description: error instanceof Error ? error.message : t("Unknown error", "未知错误"),
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    isImpersonating,
    impersonatedUserId,
    isStarting,
    startImpersonating,
    stopImpersonating,
  };
}
