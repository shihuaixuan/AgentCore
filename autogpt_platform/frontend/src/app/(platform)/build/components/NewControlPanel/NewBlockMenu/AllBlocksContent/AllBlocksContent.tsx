import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React, { Fragment } from "react";
import { Block } from "../Block";
import { cn } from "@/lib/utils";
import { getBuilderCategoryLabel } from "@/app/(platform)/build/helpers/blockCopy";
import { Text } from "@/components/atoms/Text/Text";
import { Separator } from "@/components/atoms/Separator/Separator";

import { useAllBlockContent } from "./useAllBlockContent";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { blockMenuButtonBase, blockMenuContainerStyle } from "../style";

export const AllBlocksContent = () => {
  const { locale, t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    error,
    handleRefetchBlocks,
    isLoadingMore,
    isErrorOnLoadingMore,
  } = useAllBlockContent();

  if (isLoading) {
    return (
      <div className={blockMenuContainerStyle}>
        {[0, 1, 2, 3, 4].map((skeletonIndex) => (
          <Block.Skeleton key={`skeleton-${skeletonIndex}`} />
        ))}
      </div>
    );
  }

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
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const categories = data?.categories;

  return (
    <div className={blockMenuContainerStyle}>
      {categories?.map((category, index) => (
        <Fragment key={category.name}>
          {index > 0 && (
            <Separator className="h-[1px] w-full text-foreground-disabled" />
          )}

          {/* Category Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Text variant="body-medium" tone="emphasis">
                {getBuilderCategoryLabel(category.name, locale)}
              </Text>
              <span className="rounded-full bg-surface-hover px-1.5">
                <Text
                  variant="body"
                  as="span"
                  tone="secondary"
                  className="block"
                >
                  {category.total_blocks}
                </Text>
              </span>
            </div>

            <div className="space-y-2">
              {category.blocks.map((block) => (
                <Block key={`${category.name}-${block.id}`} blockData={block} />
              ))}

              {isLoadingMore(category.name) && (
                <>
                  {[0, 1, 2].map((skeletonIndex) => (
                    <Block.Skeleton
                      key={`skeleton-${category.name}-${skeletonIndex}`}
                    />
                  ))}
                </>
              )}

              {isErrorOnLoadingMore(category.name) && (
                <ErrorCard
                  isSuccess={false}
                  responseError={{
                    message: t("Error loading blocks", "加载模块失败"),
                  }}
                  context="blocks"
                  onRetry={() => handleRefetchBlocks(category.name)}
                />
              )}

              {category.total_blocks > category.blocks.length && (
                <button
                  type="button"
                  className={cn(
                    blockMenuButtonBase,
                    "h-9 py-2 text-foreground-secondary underline-offset-4 hover:text-foreground-emphasis hover:underline",
                  )}
                  disabled={isLoadingMore(category.name)}
                  onClick={() => handleRefetchBlocks(category.name)}
                >
                  <Text
                    variant="body-medium"
                    as="span"
                    tone="inherit"
                    decoration="underline"
                  >
                    {t("see all", "查看全部")}
                  </Text>
                </button>
              )}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
};
