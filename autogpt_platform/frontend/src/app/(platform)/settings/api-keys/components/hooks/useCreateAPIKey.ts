"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useQueryClient } from "@tanstack/react-query";

import { usePostV1CreateNewApiKey } from "@/app/api/__generated__/endpoints/api-keys/api-keys";
import type { CreateAPIKeyRequest } from "@/app/api/__generated__/models/createAPIKeyRequest";
import type { CreateAPIKeyResponse } from "@/app/api/__generated__/models/createAPIKeyResponse";
import { toast } from "@/components/molecules/Toast/use-toast";

import { API_KEYS_QUERY_KEY } from "./useAPIKeysList";

export function useCreateAPIKey() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = usePostV1CreateNewApiKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
        toast({
          title: t("API key created", "API 密钥已创建"),
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: t("Failed to create API key", "无法创建 API 密钥"),
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      },
    },
  });

  async function createKey(payload: CreateAPIKeyRequest) {
    // The custom Orval mutator throws on non-2xx, so reaching this line
    // guarantees the success variant of the discriminated union.
    const response = await mutation.mutateAsync({ data: payload });
    return response.data as CreateAPIKeyResponse;
  }

  return {
    createKey,
    isPending: mutation.isPending,
  };
}
