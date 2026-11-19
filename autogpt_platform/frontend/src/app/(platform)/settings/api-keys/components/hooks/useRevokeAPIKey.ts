"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { deleteV1RevokeApiKey } from "@/app/api/__generated__/endpoints/api-keys/api-keys";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { API_KEYS_QUERY_KEY } from "./useAPIKeysList";

export function useRevokeAPIKey() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  async function revoke(keyIds: string[]): Promise<boolean> {
    if (keyIds.length === 0) return true;

    setIsPending(true);
    try {
      const results = await Promise.allSettled(
        keyIds.map((id) => deleteV1RevokeApiKey(id)),
      );
      const failures = results.filter((r) => r.status === "rejected");

      if (failures.length === 0) {
        toast({
          title:
            keyIds.length === 1
              ? t("API key revoked", "API 密钥已撤销")
              : t(
                  `${keyIds.length} API keys revoked`,
                  `已撤销 ${keyIds.length} 个 API 密钥`,
                ),
          variant: "success",
        });
      } else {
        toast({
          title: t(
            "Some API keys could not be revoked",
            "部分 API 密钥无法撤销",
          ),
          description: t(
            `${failures.length} of ${keyIds.length} failed.`,
            `${keyIds.length} 个密钥中有 ${failures.length} 个撤销失败。`,
          ),
          variant: "destructive",
        });
      }

      await queryClient.invalidateQueries({
        queryKey: API_KEYS_QUERY_KEY,
      });

      return failures.length === 0;
    } finally {
      setIsPending(false);
    }
  }

  return { revoke, isPending };
}
