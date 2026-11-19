"use client";
import {
  getGetV1ListUserApiKeysQueryKey,
  useDeleteV1RevokeApiKey,
  useGetV1ListUserApiKeys,
} from "@/app/api/__generated__/endpoints/api-keys/api-keys";
import { okData } from "@/app/api/helpers";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { getQueryClient } from "@/lib/react-query/queryClient";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export const useAPISection = () => {
  const { t } = useTranslation();
  const queryClient = getQueryClient();
  const { toast } = useToast();

  const { data: apiKeys, isLoading } = useGetV1ListUserApiKeys({
    query: {
      select: (res) => okData(res)?.filter((key) => key.status === "ACTIVE"),
    },
  });

  const { mutateAsync: revokeAPIKey, isPending: isDeleting } =
    useDeleteV1RevokeApiKey({
      mutation: {
        onSettled: () => {
          return queryClient.invalidateQueries({
            queryKey: getGetV1ListUserApiKeysQueryKey(),
          });
        },
      },
    });

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeAPIKey({
        keyId: keyId,
      });

      toast({
        title: t("Success", "成功"),
        description: t(
          "AutoGPT Platform API key revoked successfully",
          "AutoGPT 平台 API 密钥已成功撤销",
        ),
      });
    } catch {
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to revoke AutoGPT Platform API key",
          "撤销 AutoGPT 平台 API 密钥失败",
        ),
        variant: "destructive",
      });
    }
  };

  return {
    apiKeys,
    isLoading,
    isDeleting,
    handleRevokeKey,
  };
};
