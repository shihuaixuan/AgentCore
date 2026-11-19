"use client";

import { toastIfPlanRequired } from "@/components/contextual/PaywallToast/helpers";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  useGetOauthListMyOauthApps,
  usePatchOauthUpdateAppStatus,
  getGetOauthListMyOauthAppsQueryKey,
} from "@/app/api/__generated__/endpoints/oauth/oauth";
import { okData } from "@/app/api/helpers";
import { useToast } from "@/components/molecules/Toast/use-toast";
import {
  isFileTooLarge,
  OAUTH_LOGO_MAX_SIZE_MB,
  uploadOAuthAppLogoDirect,
} from "@/lib/direct-upload";
import { getQueryClient } from "@/lib/react-query/queryClient";

export const useOAuthApps = () => {
  const { t, locale } = useTranslation();
  const queryClient = getQueryClient();
  const { toast } = useToast();
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [uploadingAppId, setUploadingAppId] = useState<string | null>(null);

  const { data: oauthAppsResponse, isLoading } = useGetOauthListMyOauthApps({
    query: { select: okData },
  });

  const { mutateAsync: updateStatus } = usePatchOauthUpdateAppStatus({
    mutation: {
      onSettled: () => {
        return queryClient.invalidateQueries({
          queryKey: getGetOauthListMyOauthAppsQueryKey(),
        });
      },
    },
  });

  const handleToggleStatus = async (appId: string, currentStatus: boolean) => {
    try {
      setUpdatingAppId(appId);
      const result = await updateStatus({
        appId,
        data: { is_active: !currentStatus },
      });

      if (result.status === 200) {
        toast({
          title: t("Success", "成功"),
          description: result.data.is_active
            ? t("Application enabled successfully", "应用已成功启用")
            : t("Application disabled successfully", "应用已成功禁用"),
        });
      } else {
        throw new Error("Failed to update status");
      }
    } catch {
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to update application status",
          "应用状态更新失败",
        ),
        variant: "destructive",
      });
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleUploadLogo = async (appId: string, file: File) => {
    if (
      isFileTooLarge({ file, maxSizeMB: OAUTH_LOGO_MAX_SIZE_MB, toast, locale })
    )
      return;

    try {
      setUploadingAppId(appId);
      await uploadOAuthAppLogoDirect(appId, file, locale);
      toast({
        title: t("Success", "成功"),
        description: t("Logo uploaded successfully", "标志上传成功"),
      });
    } catch (error) {
      if (
        toastIfPlanRequired(
          error,
          t("Uploading a logo needs an active plan", "上传标志需要有效套餐"),
        )
      )
        return;
      console.error("Failed to upload logo:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("Failed to upload logo", "标志上传失败");
      toast({
        title: t("Error", "错误"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingAppId(null);
      void queryClient.invalidateQueries({
        queryKey: getGetOauthListMyOauthAppsQueryKey(),
      });
    }
  };

  return {
    oauthApps: oauthAppsResponse ?? [],
    isLoading,
    updatingAppId,
    uploadingAppId,
    handleToggleStatus,
    handleUploadLogo,
  };
};
