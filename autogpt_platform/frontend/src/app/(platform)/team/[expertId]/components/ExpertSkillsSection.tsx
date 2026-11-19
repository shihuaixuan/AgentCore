"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";
import { SkillLearningSheet } from "@/components/organisms/SkillLearningSheet/SkillLearningSheet";
import {
  BookOpen01Icon,
  BulbIcon,
  PlusSignIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { SectionEmptyState } from "../../components/SectionEmptyState";
import { ToolbarSearch } from "../../components/ToolbarSearch";
import { AddSkillDialog } from "./AddSkillDialog";
import { ExpertSkillListItem } from "./ExpertSkillListItem";
import { useExpertLearning } from "./useExpertLearning";
import { useExpertSkills } from "./useExpertSkills";
import { getLearningLabel } from "@/services/skill-learning/helpers";

interface Props {
  expert: Expert;
  accentClassName?: string;
  initialSkill?: string | null;
  initialVersionId?: string | null;
}

export function ExpertSkillsSection({
  expert,
  accentClassName,
  initialSkill = null,
  initialVersionId = null,
}: Props) {
  const { t, locale } = useTranslation();
  const {
    query,
    setQuery,
    visible,
    hasAny,
    available,
    isLibraryLoading,
    isAddOpen,
    openAdd,
    closeAdd,
    source,
    setSource,
    marketQuery,
    setMarketQuery,
    marketplaceSkills,
    isMarketplaceLoading,
    addSkill,
    addMarketplaceSkill,
    removeSkill,
    isSaving,
  } = useExpertSkills(expert);
  const learning = useExpertLearning(expert, initialSkill, initialVersionId);

  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <Text variant="large-medium" tone="primary">
          {t(`${expert.name}'s Skills`, `${expert.name} 的技能`)}
        </Text>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            variant="secondary"
            size="small"
            textSize="body-md"
            leadingIcon={PlusSignIcon}
            onClick={openAdd}
          >
            {t("Add skill", "添加技能")}
          </Button>
          <ToolbarSearch
            textSize="body-md"
            id="expert-skills-search"
            label={t("Search skills", "搜索技能")}
            value={query}
            onChange={setQuery}
          />
        </div>
      </div>
      {learning.enabled ? (
        <div
          className="mb-3 flex flex-col gap-2 rounded-2xl bg-surface p-3.5 smooth-shadow-ring-sm sm:flex-row sm:items-center sm:justify-between"
          data-testid="expert-learning-summary"
        >
          <Text variant="small" tone="secondary">
            {learning.recentChange
              ? `${learning.recentChange.summary} · ${getLearningLabel(learning.recentChange.origin_label ?? "", locale)} · ${getLearningLabel(learning.recentChange.state_label, locale)}`
              : t(
                  "No overnight changes yet. Verified procedures from chats are reviewed nightly.",
                  "暂无夜间更新。系统每晚会审核聊天中已验证的操作流程。",
                )}
          </Text>
          <label className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <Text variant="small" tone="primary">
              {learning.isLearningPaused
                ? t("Learning paused", "学习已暂停")
                : t("Learning on", "学习已开启")}
            </Text>
            <Switch
              checked={!learning.isLearningPaused}
              disabled={learning.isTogglingLearning}
              aria-label={t(
                `Nightly learning for ${expert.name}`,
                `${expert.name} 的夜间学习`,
              )}
              onCheckedChange={(checked) =>
                learning.setLearningPaused(!checked)
              }
            />
          </label>
        </div>
      ) : null}
      {!hasAny ? (
        <SectionEmptyState
          tiles={[
            <span key="book" className="inline-flex text-sky">
              <Icon icon={BookOpen01Icon} size={22} />
            </span>,
            <span key="bulb" className="inline-flex text-warning">
              <Icon icon={BulbIcon} size={22} />
            </span>,
            <span key="sparkles" className="inline-flex text-brand">
              <Icon icon={SparklesIcon} size={22} />
            </span>,
          ]}
          title={t("No skills yet", "暂无技能")}
          description={t(
            `Add skills from your library so ${expert.name} knows how you like things done.`,
            `从库中添加技能，让 ${expert.name} 了解你偏好的工作方式。`,
          )}
        >
          <Button
            variant="primary"
            size="small"
            textSize="body-md"
            leadingIcon={PlusSignIcon}
            onClick={openAdd}
          >
            {t("Add skill", "添加技能")}
          </Button>
        </SectionEmptyState>
      ) : visible.length === 0 ? (
        <Text variant="body-md" tone="muted" className="mt-4">
          {t("No skills match.", "没有匹配的技能。")}
        </Text>
      ) : (
        <ul
          className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2"
          aria-label={t("Expert skills", "专家技能")}
        >
          {visible.map((entry) => (
            <li key={entry.name}>
              <ExpertSkillListItem
                entry={entry}
                accentClassName={accentClassName}
                isSaving={isSaving}
                learning={
                  learning.enabled ? learning.learningLineFor(entry.name) : null
                }
                onRemove={removeSkill}
              />
            </li>
          ))}
        </ul>
      )}
      <AddSkillDialog
        open={isAddOpen}
        source={source}
        onSourceChange={setSource}
        skills={available}
        isLoading={isLibraryLoading}
        marketQuery={marketQuery}
        onMarketQueryChange={setMarketQuery}
        marketplaceSkills={marketplaceSkills}
        isMarketplaceLoading={isMarketplaceLoading}
        isSaving={isSaving}
        onAdd={addSkill}
        onAddMarketplace={addMarketplaceSkill}
        onClose={closeAdd}
      />
      {learning.enabled ? (
        <SkillLearningSheet
          scope={{
            expertId: expert.id,
            name: expert.name,
            avatarUrl: expert.avatar_url,
            color: expert.color,
          }}
          skillName={learning.openSkill?.name ?? null}
          initialVersionId={learning.openSkill?.versionId ?? null}
          onChanged={learning.refreshHistory}
          onClose={learning.closeSkill}
        />
      ) : null}
    </section>
  );
}
