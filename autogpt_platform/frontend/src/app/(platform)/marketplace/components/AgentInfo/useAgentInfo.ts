import {
  getGetV2ListLibraryAgentsQueryKey,
  usePostV2AddMarketplaceAgent,
} from "@/app/api/__generated__/endpoints/library/library";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useGetV2DownloadAgentFile } from "@/app/api/__generated__/endpoints/store/store";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { agentGraphExportFilename, exportAsJSONFile } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface UseAgentInfoProps {
  storeListingVersionId: string;
}

export const useAgentInfo = ({ storeListingVersionId }: UseAgentInfoProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    mutateAsync: addMarketplaceAgentToLibrary,
    isPending: isAddingAgentToLibrary,
  } = usePostV2AddMarketplaceAgent();

  const { refetch: downloadAgent, isFetching: isDownloadingAgent } =
    useGetV2DownloadAgentFile(storeListingVersionId, {
      query: {
        enabled: false,
        select: (data) => {
          return data.data;
        },
      },
    });

  const handleLibraryAction = async ({
    isAddingAgentFirstTime,
  }: {
    isAddingAgentFirstTime: boolean;
  }) => {
    try {
      const { data: response } = await addMarketplaceAgentToLibrary({
        data: { store_listing_version_id: storeListingVersionId },
      });

      const data = response as LibraryAgent;

      if (isAddingAgentFirstTime) {
        await queryClient.invalidateQueries({
          queryKey: getGetV2ListLibraryAgentsQueryKey(),
        });
      }

      router.push(`/library/agents/${data.id}`);

      toast({
        title: t("Workflow Added", "工作流已添加"),
        description: t("Redirecting to your library...", "正在跳转到你的库..."),
        duration: 2000,
      });
    } catch (error) {
      Sentry.captureException(error);

      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to add workflow to library. Please try again.",
          "无法将工作流添加到库，请重试。",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (agentName: string) => {
    try {
      const { data: file } = await downloadAgent();

      exportAsJSONFile(
        file as object,
        agentGraphExportFilename(file, agentName),
      );

      toast({
        title: t("Download Complete", "下载完成"),
        description: t(
          "Your workflow has been successfully downloaded.",
          "你的工作流已成功下载。",
        ),
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to download workflow. Please try again.",
          "无法下载工作流，请重试。",
        ),
        variant: "destructive",
      });
    }
  };

  return {
    isAddingAgentToLibrary,
    handleLibraryAction,
    handleDownload,
    isDownloadingAgent,
  };
};
