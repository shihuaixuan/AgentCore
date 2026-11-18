"use client";

import { Button } from "@/components/atoms/Button/Button";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useTrackFunnelViewOnce } from "@/services/experts/use-track-funnel-view-once";
import { BrowseFilters, useBrowseCategories } from "../Browse/BrowseFilters";
import {
  BROWSE_GRID,
  BROWSE_LAYOUT,
  BrowseHeader,
} from "../Browse/BrowseHeader";
import { BrowseMessage, BrowseSkeleton } from "../Browse/BrowseResults";
import { useBrowseParams } from "../Browse/useBrowseParams";
import { useExpertsSection } from "../ExpertsSection/useExpertsSection";
import { CompactExpertCard } from "./CompactExpertCard";
import { ExpertRecommendations } from "./ExpertRecommendations";

export function MainMarkeplacePage() {
  const { t } = useTranslation();
  const { search, category, update } = useBrowseParams();
  const categories = useBrowseCategories("experts");
  const experts = useExpertsSection({ category, searchQuery: search });
  useTrackFunnelViewOnce(
    "experts_section_viewed",
    experts.templates.length > 0,
  );

  return (
    <main className={BROWSE_LAYOUT} id="experts">
      <BrowseHeader
        title={t("Experts", "专家")}
        description={t(
          "Find a specialist to work with your team.",
          "为你的团队寻找合适的 AI 专家。",
        )}
        search={{
          value: search,
          label: t("Search experts", "搜索专家"),
          onSubmit: (q) => update({ q }),
        }}
        action={
          experts.isLoggedIn && (
            <Button as="NextLink" href="/team" variant="secondary" size="small">
              {t("My experts", "我的专家")}
            </Button>
          )
        }
      />
      {!search && !category && !experts.isError && (
        <ExpertRecommendations
          categories={categories}
          experts={experts.templates}
          onSelect={(value) => update({ category: value })}
        />
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <BrowseFilters
          label={t("Browse experts by category", "按分类浏览专家")}
          categories={categories}
          selected={category}
          onSelect={(value) => update({ category: value })}
        />
        {experts.isLoggedIn && (
          <Button as="NextLink" href="/raise" variant="ghost" size="small">
            {t("Create an Expert", "创建专家")}
          </Button>
        )}
      </div>
      {experts.isLoading ? (
        <BrowseSkeleton label={t("Loading experts", "正在加载专家")} />
      ) : experts.isError ? (
        <ErrorCard
          context="marketplace experts"
          responseError={{
            message: t("Couldn't load experts", "暂时无法加载专家"),
          }}
          onRetry={() => experts.refetch()}
        />
      ) : experts.templates.length === 0 ? (
        <BrowseMessage
          message={t("No matching experts.", "没有找到匹配的专家。")}
          onReset={
            search || category
              ? () => update({ q: null, category: null })
              : undefined
          }
        />
      ) : (
        <ul className={BROWSE_GRID}>
          {experts.templates.map((expert) => (
            <li key={expert.id} className="min-w-0">
              <CompactExpertCard
                expert={expert}
                categories={categories}
                isHired={experts.hiredTemplateIds.has(expert.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
