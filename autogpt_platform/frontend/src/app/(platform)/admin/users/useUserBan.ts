"use client";

import { useToast } from "@/components/molecules/Toast/use-toast";
import { authClient } from "@/lib/auth/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type AdminUser,
  type BanDuration,
  getBanDurationSeconds,
  parseLookupQuery,
  toAdminUser,
} from "./helpers";
import { getAdminUserLookupQueryKey } from "./useAdminUserLookup";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface BanArgs {
  reason: string;
  duration: BanDuration;
}

export function useUserBan(user: AdminUser) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  function storeUpdatedUser(updated: AdminUser) {
    for (const lookup of [updated.id, updated.email]) {
      queryClient.setQueryData(
        getAdminUserLookupQueryKey(parseLookupQuery(lookup)),
        updated,
      );
    }
  }

  const ban = useMutation({
    mutationFn: async ({ reason, duration }: BanArgs) => {
      const banReason = reason.trim();
      if (!banReason)
        throw new Error(t("Give a reason for the ban.", "请填写封禁原因。"));
      const { data, error } = await authClient.admin.banUser({
        userId: user.id,
        banReason,
        banExpiresIn: getBanDurationSeconds(duration),
      });
      if (error || !data) {
        throw new Error(
          error?.message || t("Failed to ban the user", "无法封禁该用户"),
        );
      }
      return toAdminUser(data.user);
    },
    onSuccess: (updated) => {
      storeUpdatedUser(updated);
      toast({
        title: t(`Banned ${updated.email}`, `已封禁 ${updated.email}`),
        description: t(
          "Their sessions are signed out. Tokens they hold or get in the next 5 minutes work for up to an hour, and their API keys, schedules and triggers keep running.",
          "其会话已退出。现有令牌及未来 5 分钟内获取的令牌仍可能有效长达一小时；API 密钥、计划和触发器仍会继续运行。",
        ),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("Couldn't ban the user", "无法封禁该用户"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unban = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.admin.unbanUser({
        userId: user.id,
      });
      if (error || !data) {
        throw new Error(
          error?.message ||
            t("Failed to unban the user", "无法解除该用户的封禁"),
        );
      }
      return toAdminUser(data.user);
    },
    onSuccess: (updated) => {
      storeUpdatedUser(updated);
      toast({
        title: t(`Unbanned ${updated.email}`, `已解除 ${updated.email} 的封禁`),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("Couldn't unban the user", "无法解除该用户的封禁"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    banUser: ban.mutate,
    unbanUser: unban.mutate,
    isBanning: ban.isPending,
    isUnbanning: unban.isPending,
  };
}
