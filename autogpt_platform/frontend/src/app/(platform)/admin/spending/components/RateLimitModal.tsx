"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/molecules/Dialog/components/DialogPrimitives";
import { useToast } from "@/components/molecules/Toast/use-toast";
import type { UserRateLimitResponse } from "@/app/api/__generated__/models/userRateLimitResponse";
import {
  getV2GetUserRateLimit,
  postV2ResetUserRateLimitUsage,
} from "@/app/api/__generated__/endpoints/admin/admin";
import { RateLimitDisplay } from "./RateLimitDisplay";
import { GaugeIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function RateLimitModal({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitData, setRateLimitData] =
    useState<UserRateLimitResponse | null>(null);

  useEffect(() => {
    if (!open) {
      setRateLimitData(null);
      return;
    }

    async function fetchRateLimit() {
      setIsLoading(true);
      try {
        const response = await getV2GetUserRateLimit({ user_id: userId });
        if (response.status !== 200) {
          throw new Error("Failed to fetch rate limit");
        }
        setRateLimitData(response.data);
      } catch (error) {
        console.error("Error fetching rate limit:", error);
        toast({
          title: t("Error", "错误"),
          description: t(
            "Failed to fetch user rate limit.",
            "无法获取用户的速率限制。",
          ),
          variant: "destructive",
        });
        setRateLimitData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRateLimit();
  }, [open, userId, toast, t]);

  async function handleReset(resetWeekly: boolean) {
    if (!rateLimitData) return;

    try {
      const response = await postV2ResetUserRateLimitUsage({
        user_id: rateLimitData.user_id,
        reset_weekly: resetWeekly,
      });
      if (response.status !== 200) {
        throw new Error("Failed to reset usage");
      }
      setRateLimitData(response.data);
      toast({
        title: t("Success", "成功"),
        description: resetWeekly
          ? t(
              "Daily and weekly usage reset to zero.",
              "每日和每周用量已重置为零。",
            )
          : t("Daily usage reset to zero.", "每日用量已重置为零。"),
      });
    } catch (error) {
      console.error("Error resetting rate limit:", error);
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to reset rate limit usage.",
          "无法重置速率限制用量。",
        ),
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <Button
        size="small"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Icon icon={GaugeIcon} size={16} className="mr-1" />
        {t("Rate Limits", "速率限制")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Rate Limits", "速率限制")}</DialogTitle>
            <DialogDescription>
              {t(
                `CoPilot rate limits for ${userEmail || userId}`,
                `${userEmail || userId} 的 CoPilot 速率限制`,
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="py-8 text-center text-foreground-tertiary">
              {t("Loading rate limits...", "正在加载速率限制...")}
            </div>
          )}

          {!isLoading && rateLimitData && (
            <RateLimitDisplay
              data={rateLimitData}
              onReset={handleReset}
              className="space-y-4"
            />
          )}

          {!isLoading && !rateLimitData && (
            <div className="py-8 text-center text-foreground-tertiary">
              {t(
                "No rate limit data available for this user.",
                "该用户暂无速率限制数据。",
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
