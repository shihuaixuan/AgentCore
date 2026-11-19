import React from "react";
import { IntegrationChip } from "../IntegrationChip";
import { Block } from "../Block";
import { useSuggestionContent } from "./useSuggestionContent";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { blockMenuContainerStyle } from "../style";
import { useBlockMenuStore } from "../../../../stores/blockMenuStore";
import { useShallow } from "zustand/react/shallow";
import { DefaultStateType } from "../types";
import { SearchHistoryChip } from "../SearchHistoryChip";
import { HorizontalScroll } from "../HorizontalScroll";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export const SuggestionContent = () => {
  const { t } = useTranslation();
  const { setIntegration, setDefaultState, setSearchQuery, setSearchId } =
    useBlockMenuStore(
      useShallow((state) => ({
        setIntegration: state.setIntegration,
        setDefaultState: state.setDefaultState,
        setSearchQuery: state.setSearchQuery,
        setSearchId: state.setSearchId,
      })),
    );
  const { data, isLoading, isError, error, refetch } = useSuggestionContent();
  const suggestions = data?.suggestions;
  const hasRecentSearches = (suggestions?.recent_searches?.length ?? 0) > 0;

  if (isError) {
    return (
      <div className="h-full p-4">
        <ErrorCard
          isSuccess={false}
          responseError={error || undefined}
          httpError={{
            status: data?.status,
            statusText: t("Request failed", "请求失败"),
            message:
              (error?.detail as string) || t("An error occurred", "发生错误"),
          }}
          context="block menu"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className={blockMenuContainerStyle}>
      <div className="w-full space-y-6 pb-4">
        {/* Recent searches */}
        {hasRecentSearches && (
          <div className="space-y-2.5 px-4">
            <Text variant="body-medium" tone="emphasis">
              {t("Recent searches", "最近搜索")}
            </Text>
            <HorizontalScroll
              wrapperClassName="-mx-8"
              scrollContainerClassName="flex gap-2 overflow-x-auto px-8 [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden"
              dependencyList={[
                suggestions?.recent_searches?.length ?? 0,
                isLoading,
              ]}
            >
              {!isLoading && suggestions
                ? suggestions.recent_searches.map((entry, index) => (
                    <SearchHistoryChip
                      key={entry.search_id || `${entry.search_query}-${index}`}
                      content={
                        entry.search_query || t("Untitled search", "未命名搜索")
                      }
                      onClick={() => {
                        setSearchQuery(entry.search_query || "");
                        setSearchId(entry.search_id || undefined);
                      }}
                    />
                  ))
                : Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <SearchHistoryChip.Skeleton
                        key={`recent-search-skeleton-${index}`}
                      />
                    ))}
            </HorizontalScroll>
          </div>
        )}

        {/* Integrations */}
        <div className="space-y-2.5 px-4">
          <Text variant="body-medium" tone="emphasis">
            {t("Integrations", "集成")}
          </Text>
          <div className="grid grid-cols-3 grid-rows-2 gap-2">
            {!isLoading && suggestions
              ? suggestions.providers.map((provider, index) => (
                  <IntegrationChip
                    key={`integration-${index}`}
                    icon_url={`/integrations/${provider}.png`}
                    name={provider}
                    onClick={() => {
                      setDefaultState(DefaultStateType.INTEGRATIONS);
                      setIntegration(provider);
                    }}
                  />
                ))
              : Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <IntegrationChip.Skeleton
                      key={`integration-skeleton-${index}`}
                    />
                  ))}
          </div>
        </div>

        {/* Top blocks */}
        <div className="space-y-2.5 px-4">
          <Text variant="body-medium" tone="emphasis">
            {t("Top blocks", "热门模块")}
          </Text>
          <div className="space-y-2">
            {!isLoading && suggestions
              ? suggestions.top_blocks.map((block, index) => (
                  <Block
                    key={`block-${index}`}
                    title={block.name}
                    description={block.description}
                    blockData={block}
                  />
                ))
              : Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <Block.Skeleton key={`block-skeleton-${index}`} />
                  ))}
          </div>
        </div>
      </div>
    </div>
  );
};
