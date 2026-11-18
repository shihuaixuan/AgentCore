"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { PublishAgentModal } from "@/components/contextual/PublishAgentModal/PublishAgentModal";
import type { PublishState } from "@/components/contextual/PublishAgentModal/usePublishAgentModal";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useState } from "react";
import {
  BrowseFilters,
  useBrowseCategories,
} from "../../components/Browse/BrowseFilters";
import {
  BROWSE_GRID,
  BROWSE_LAYOUT,
  BrowseHeader,
} from "../../components/Browse/BrowseHeader";
import {
  BrowseMessage,
  BrowseSkeleton,
} from "../../components/Browse/BrowseResults";
import { MarketplaceTabIntro } from "../../components/MarketplaceTabIntro/MarketplaceTabIntro";
import { AGENTS_SECTION_ID } from "../../components/MarketplaceTabIntro/helpers";
import { WorkflowTile } from "../../components/WorkflowsShelf/components/WorkflowTile";
import { useWorkflowsBrowse } from "./useWorkflowsBrowse";

export function WorkflowsBrowsePage() {
  const { t } = useTranslation();
  const { query, search, category, sort, update, workflows, total } =
    useWorkflowsBrowse();
  const categories = useBrowseCategories("workflows");
  const [publish, setPublish] = useState<PublishState>({
    isOpen: false,
    step: "select",
    submissionData: null,
  });

  return (
    <main id={AGENTS_SECTION_ID} className={BROWSE_LAYOUT}>
      <BrowseHeader
        title={t("Workflows", "工作流")}
        description={t(
          "Find automations you can add and run.",
          "发现可安装并运行的自动化流程。",
        )}
        search={{
          value: search,
          label: t("Search workflows", "搜索工作流"),
          onSubmit: (q) => update({ q }),
        }}
        action={
          <Button
            variant="secondary"
            size="small"
            onClick={() =>
              setPublish({ isOpen: true, step: "select", submissionData: null })
            }
          >
            {t("Publish workflow", "发布工作流")}
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <BrowseFilters
          label={t("Filter workflows by category", "按分类筛选工作流")}
          categories={categories}
          selected={category}
          onSelect={(value) => update({ category: value })}
        />
        {!search && (
          <Select
            id="workflow-sort"
            label={t("Sort workflows", "工作流排序")}
            hideLabel
            size="small"
            value={sort}
            onValueChange={(value) =>
              update({ sort: value === "runs" ? null : value })
            }
            options={[
              { value: "runs", label: t("Most run", "最多运行") },
              { value: "rating", label: t("Top rated", "最高评分") },
              { value: "updated_at", label: t("Recently updated", "最近更新") },
            ]}
          />
        )}
      </div>
      {query.isLoading ? (
        <BrowseSkeleton label={t("Loading workflows", "正在加载工作流")} />
      ) : query.isError && workflows.length === 0 ? (
        <ErrorCard
          context="marketplace workflows"
          responseError={{
            message: t("Couldn't load workflows", "暂时无法加载工作流"),
          }}
          onRetry={() => query.refetch()}
        />
      ) : workflows.length === 0 ? (
        <BrowseMessage
          message={t("No matching workflows.", "没有找到匹配的工作流。")}
          onReset={
            search || category
              ? () => update({ q: null, category: null })
              : undefined
          }
        />
      ) : (
        <>
          <Text variant="small" tone="muted" className="mb-3">
            {t(
              `${total.toLocaleString()} workflows`,
              `${total.toLocaleString()} 个工作流`,
            )}
          </Text>
          <ul className={BROWSE_GRID}>
            {workflows.map((workflow) => (
              <WorkflowTile key={workflow.agent_graph_id} agent={workflow} />
            ))}
          </ul>
          {(query.hasNextPage || query.isFetchNextPageError) && (
            <div className="mt-4">
              <Button
                variant="secondary"
                loading={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchNextPageError
                  ? t("Retry loading more", "重试加载更多")
                  : t("Load more", "加载更多")}
              </Button>
            </div>
          )}
        </>
      )}
      <PublishAgentModal
        showTrigger={false}
        targetState={publish}
        onStateChange={setPublish}
      />
      <MarketplaceTabIntro
        canShow={!publish.isOpen}
        showFeaturedLabel={false}
      />
    </main>
  );
}
