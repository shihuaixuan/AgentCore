"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  BrowseFilters,
  useBrowseCategories,
} from "../../../components/Browse/BrowseFilters";
import {
  BROWSE_GRID,
  BROWSE_LAYOUT,
  BrowseHeader,
} from "../../../components/Browse/BrowseHeader";
import {
  BrowseMessage,
  BrowseSkeleton,
} from "../../../components/Browse/BrowseResults";
import { SkillCard } from "../../../components/SkillsSection/components/SkillCard";
import { useSkillsBrowsePage } from "./useSkillsBrowsePage";

export function SkillsBrowsePage() {
  const { t } = useTranslation();
  const browse = useSkillsBrowsePage();
  const categories = useBrowseCategories("skills");

  return (
    <main className={BROWSE_LAYOUT} id="skills">
      <BrowseHeader
        title={t("Skills", "技能")}
        description={t(
          "Give your experts reusable playbooks.",
          "为你的专家安装可复用的操作指南。",
        )}
        search={{
          value: browse.search,
          label: t("Search skills", "搜索技能"),
          onSubmit: browse.setSearch,
        }}
        action={
          browse.isLoggedIn && (
            <Button
              as="NextLink"
              href="/library/skills"
              variant="secondary"
              size="small"
            >
              {t("My skills", "我的技能")}
            </Button>
          )
        }
      />
      <div className="mb-4">
        <BrowseFilters
          label={t("Filter skills by topic", "按主题筛选技能")}
          categories={categories}
          selected={browse.category}
          onSelect={browse.setCategory}
        />
      </div>
      {browse.isLoading ? (
        <BrowseSkeleton label={t("Loading skills", "正在加载技能")} />
      ) : browse.isError && browse.skills.length === 0 ? (
        <ErrorCard
          context="marketplace skills"
          responseError={{
            message: t("Couldn't load skills right now", "暂时无法加载技能"),
          }}
          onRetry={() => browse.refetch()}
        />
      ) : browse.skills.length === 0 ? (
        <BrowseMessage
          message={t("No matching skills.", "没有找到匹配的技能。")}
          onReset={browse.search || browse.category ? browse.reset : undefined}
        />
      ) : (
        <>
          <Text variant="small" tone="muted" className="mb-3">
            {t(
              `${browse.total.toLocaleString()} ${browse.total === 1 ? "skill" : "skills"}`,
              `${browse.total.toLocaleString()} 个技能`,
            )}
          </Text>
          <ul className={BROWSE_GRID}>
            {browse.skills.map((skill) => (
              <li key={skill.slug} className="min-w-0">
                <SkillCard
                  skill={skill}
                  isInstalled={browse.installedSlugs.has(skill.slug)}
                  categoryLabel={
                    categories.find(
                      ({ value }) => value === skill.categories[0],
                    )?.label
                  }
                />
              </li>
            ))}
          </ul>
          {(browse.hasMore || browse.isFetchNextPageError) && (
            <Button
              className="mt-4"
              variant="secondary"
              loading={browse.isFetchingMore}
              onClick={() => void browse.loadMore()}
            >
              {browse.isFetchNextPageError
                ? t("Retry loading more", "重试加载更多")
                : t("Load more", "加载更多")}
            </Button>
          )}
        </>
      )}
    </main>
  );
}
