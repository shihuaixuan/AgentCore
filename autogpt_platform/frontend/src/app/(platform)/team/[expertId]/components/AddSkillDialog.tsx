"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { CopilotSkillInfo } from "@/app/api/__generated__/models/copilotSkillInfo";
import { MarketplaceSkill } from "@/app/api/__generated__/models/marketplaceSkill";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { SearchInput } from "@/components/molecules/SearchInput/SearchInput";
import {
  TabsLine,
  TabsLineList,
  TabsLineTrigger,
} from "@/components/molecules/TabsLine/TabsLine";
import {
  BookOpen01Icon,
  PlusSignIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import NextLink from "next/link";
import { useState } from "react";
import { useFitListToDialog } from "./useFitListToDialog";

type Source = "library" | "marketplace";

interface Props {
  open: boolean;
  source: Source;
  onSourceChange: (source: Source) => void;
  skills: CopilotSkillInfo[];
  isLoading: boolean;
  marketQuery: string;
  onMarketQueryChange: (query: string) => void;
  marketplaceSkills: MarketplaceSkill[];
  isMarketplaceLoading: boolean;
  isSaving: boolean;
  onAdd: (name: string) => void;
  onAddMarketplace: (skill: MarketplaceSkill) => void;
  onClose: () => void;
}

export function AddSkillDialog({
  open,
  source,
  onSourceChange,
  skills,
  isLoading,
  marketQuery,
  onMarketQueryChange,
  marketplaceSkills,
  isMarketplaceLoading,
  isSaving,
  onAdd,
  onAddMarketplace,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { attachList } = useFitListToDialog<HTMLUListElement>();
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? skills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(needle) ||
          skill.description.toLowerCase().includes(needle),
      )
    : skills;

  return (
    <Dialog
      variant="compact"
      controlled={{
        isOpen: open,
        set: (next) => {
          if (!next) onClose();
        },
      }}
      styling={{ maxWidth: "30rem", maxHeight: "60vh" }}
      title={t("Add a skill", "添加技能")}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-3">
          <Text variant="body" tone="muted">
            {t(
              "Skills are reusable instructions this expert follows for a specific job. Pick one from your library or install one from the marketplace.",
              "技能是专家执行特定工作时遵循的可复用说明。请从技能库选择，或从市场安装。",
            )}
          </Text>
          <TabsLine
            variant="compact"
            value={source}
            onValueChange={(next) => onSourceChange(next as Source)}
          >
            <TabsLineList>
              <TabsLineTrigger value="library" icon={BookOpen01Icon}>
                {t("Library", "工作流库")}
              </TabsLineTrigger>
              <TabsLineTrigger value="marketplace" icon={Store01Icon}>
                {t("Marketplace", "市场")}
              </TabsLineTrigger>
            </TabsLineList>
          </TabsLine>

          {source === "library" ? (
            <>
              <SearchInput
                size="small"
                value={query}
                onChange={setQuery}
                placeholder={t("Search your library", "搜索工作流库")}
              />
              {isLoading ? (
                <Text variant="small" tone="muted">
                  {t("Loading your skills…", "正在加载你的技能…")}
                </Text>
              ) : visible.length === 0 ? (
                <Text variant="small" tone="muted">
                  {skills.length === 0
                    ? t(
                        "Every library skill is already on this expert.",
                        "技能库中的所有技能都已添加给这位专家。",
                      )
                    : t("No skills match.", "没有匹配的技能。")}
                </Text>
              ) : (
                <ul
                  ref={attachList}
                  className="flex flex-col gap-2 overflow-y-auto pr-1"
                  aria-label={t("Library skills", "技能库")}
                >
                  {visible.map((skill) => (
                    <SkillOption
                      key={skill.name}
                      name={skill.name}
                      description={skill.description}
                      icon={BookOpen01Icon}
                      disabled={isSaving}
                      onAdd={() => onAdd(skill.name)}
                    />
                  ))}
                </ul>
              )}
              <NextLink
                href="/library/skills"
                className="text-foreground-tertiary underline underline-offset-2"
              >
                <Text variant="body" as="span" tone="inherit">
                  {t(
                    "Upload a new skill in your library",
                    "在技能库中上传新技能",
                  )}
                </Text>
              </NextLink>
            </>
          ) : (
            <>
              <SearchInput
                size="small"
                value={marketQuery}
                onChange={onMarketQueryChange}
                placeholder={t("Search the marketplace", "搜索市场")}
              />
              {isMarketplaceLoading ? (
                <Text variant="small" tone="muted">
                  {t("Searching the marketplace…", "正在搜索市场…")}
                </Text>
              ) : marketplaceSkills.length === 0 ? (
                <Text variant="small" tone="muted">
                  {t("No marketplace skills match.", "市场中没有匹配的技能。")}
                </Text>
              ) : (
                <ul
                  ref={attachList}
                  className="flex flex-col gap-2 overflow-y-auto pr-1"
                  aria-label={t("Marketplace skills", "市场技能")}
                >
                  {marketplaceSkills.map((skill) => (
                    <SkillOption
                      key={skill.slug}
                      name={skill.title}
                      description={skill.description}
                      icon={Store01Icon}
                      disabled={isSaving}
                      onAdd={() => onAddMarketplace(skill)}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
          <div className="flex justify-end pt-1">
            <Button variant="secondary" size="small" onClick={onClose}>
              {t("Cancel", "取消")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

interface OptionProps {
  name: string;
  description: string;
  icon: typeof BookOpen01Icon;
  disabled: boolean;
  onAdd: () => void;
}

function SkillOption({
  name,
  description,
  icon,
  disabled,
  onAdd,
}: OptionProps) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border-base px-3 py-2.5">
      <span className="inline-flex shrink-0 text-foreground-tertiary">
        <Icon icon={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <Text
          variant="body-medium"
          as="span"
          tone="primary"
          className="block truncate"
        >
          {name}
        </Text>
        <Text variant="small" as="span" tone="muted" className="block truncate">
          {description}
        </Text>
      </span>
      <Button
        variant="secondary"
        size="small"
        disabled={disabled}
        onClick={onAdd}
        leadingIcon={PlusSignIcon}
      >
        {t("Add", "添加")}
      </Button>
    </li>
  );
}
