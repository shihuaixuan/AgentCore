import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getPaginationNextPageNumber, unpaginate } from "@/app/api/helpers";
import { getGetV2GetBuilderItemCountsQueryKey } from "@/app/api/__generated__/endpoints/default/default";
import {
  getGetV2ListLibraryAgentsQueryKey,
  getV2GetLibraryAgent,
  usePostV2AddMarketplaceAgent,
} from "@/app/api/__generated__/endpoints/library/library";
import {
  getV2GetSpecificAgent,
  useGetV2ListStoreAgentsInfinite,
} from "@/app/api/__generated__/endpoints/store/store";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { getQueryClient } from "@/lib/react-query/queryClient";
import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { useAddAgentToBuilder } from "../hooks/useAddAgentToBuilder";

export const useMarketplaceAgentsContent = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [addingAgent, setAddingAgent] = useState<string | null>(null);
  const { addAgentToBuilder } = useAddAgentToBuilder();

  const {
    data: storeAgentsQueryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isListStoreAgentsLoading,
    isError: isListStoreAgentsError,
    error: listStoreAgentsError,
    refetch: refetchListStoreAgents,
  } = useGetV2ListStoreAgentsInfinite(
    {
      page: 1,
      page_size: 10,
    },
    {
      query: { getNextPageParam: getPaginationNextPageNumber },
    },
  );

  const allAgents = storeAgentsQueryData
    ? unpaginate(storeAgentsQueryData, "agents")
    : [];
  const status = storeAgentsQueryData?.pages[0]?.status;

  const { mutateAsync: addMarketplaceAgent } = usePostV2AddMarketplaceAgent({
    mutation: {
      onSuccess: () => {
        const queryClient = getQueryClient();
        queryClient.invalidateQueries({
          queryKey: getGetV2ListLibraryAgentsQueryKey(),
        });

        queryClient.refetchQueries({
          queryKey: getGetV2GetBuilderItemCountsQueryKey(),
        });
      },
      onError: (error) => {
        Sentry.captureException(error);
        toast({
          title: t(
            "Failed to add workflow to library",
            "无法将工作流添加到工作库",
          ),
          description:
            ((error as any).message as string) ||
            t("An unexpected error occurred.", "发生意外错误。"),
          variant: "destructive",
        });
      },
    },
  });

  const handleAddStoreAgent = async ({
    creator_name,
    slug,
  }: {
    creator_name: string;
    slug: string;
  }) => {
    try {
      setAddingAgent(slug);
      const { data: agent, status } = await getV2GetSpecificAgent(
        creator_name,
        slug,
      );
      if (status !== 200) {
        Sentry.captureException("Store listing version not found");
        throw new Error("Store listing version not found");
      }

      const response = await addMarketplaceAgent({
        data: {
          store_listing_version_id: agent?.store_listing_version_id,
        },
      });

      // Here, libraryAgent has empty input and output schemas.
      // Not updating the endpoint because this endpoint is used elsewhere.
      // TODO: Create a new endpoint for builder specific to marketplace agents.
      const libraryAgent = response.data as LibraryAgent;

      const { data: libraryAgentDetails } = await getV2GetLibraryAgent(
        libraryAgent.id,
      );

      addAgentToBuilder(libraryAgentDetails as LibraryAgent);

      toast({
        title: t("Workflow Added", "工作流已添加"),
        description: t(
          "Workflow has been added to your library and builder",
          "工作流已添加到工作库和编辑器",
        ),
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: t(
          "Failed to add workflow to library",
          "无法将工作流添加到工作库",
        ),
        description:
          ((error as any).message as string) ||
          t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    } finally {
      setAddingAgent(null);
    }
  };

  return {
    handleAddStoreAgent,
    listStoreAgents: allAgents,
    status,
    addingAgent,
    isListStoreAgentsLoading,
    isListStoreAgentsError,
    listStoreAgentsError,
    refetchListStoreAgents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
