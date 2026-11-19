import React from "react";
import { BlocksList } from "../BlockList/BlockList";
import { InfiniteScroll } from "@/components/contextual/InfiniteScroll/InfiniteScroll";
import { usePaginatedBlocks } from "./usePaginatedBlocks";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { blockMenuContainerStyle } from "../style";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface PaginatedBlocksContentProps {
  type?: "all" | "input" | "action" | "output" | null;
}

export const PaginatedBlocksContent: React.FC<PaginatedBlocksContentProps> = ({
  type,
}) => {
  const { t } = useTranslation();
  const {
    allBlocks: blocks,
    status,
    blocksLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    error,
    refetch,
  } = usePaginatedBlocks({
    type,
  });

  if (error) {
    return (
      <div className="h-full px-4">
        <ErrorCard
          isSuccess={false}
          httpError={{
            status: status,
            statusText: t("Request failed", "请求失败"),
            message:
              (error?.detail as string) || t("An error occurred", "发生错误"),
          }}
          responseError={error || undefined}
          context="block menu"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <InfiniteScroll
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      className={blockMenuContainerStyle}
    >
      <BlocksList blocks={blocks} loading={blocksLoading} />
    </InfiniteScroll>
  );
};
