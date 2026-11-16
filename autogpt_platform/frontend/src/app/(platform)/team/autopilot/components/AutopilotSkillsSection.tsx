"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { CopilotSkillInfo } from "@/app/api/__generated__/models/copilotSkillInfo";
import { Text } from "@/components/atoms/Text/Text";
import { useState } from "react";
import { ExpertSkillListItem } from "../../[expertId]/components/ExpertSkillListItem";
import { AUTOPILOT_PILL_CLASS } from "../../helpers";
import { ToolbarSearch } from "../../components/ToolbarSearch";

interface Props {
  skills: CopilotSkillInfo[];
}

export function AutopilotSkillsSection({ skills }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? skills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(needle) ||
          skill.description.toLowerCase().includes(needle),
      )
    : skills;

  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <Text variant="large-medium" tone="primary">
          Otto&apos;s Skills
        </Text>
        <ToolbarSearch
          textSize="body-md"
          id="otto-skills-search"
          label={t("Search skills", "搜索技能")}
          value={query}
          onChange={setQuery}
        />
      </div>
      {skills.length === 0 ? (
        <Text variant="body-md" tone="muted" className="mt-4">
          {t(
            "No skills yet. Skills in your library that no expert has claimed show up here.",
            "暂无技能。技能库中尚未分配给专家的技能会显示在这里。",
          )}
        </Text>
      ) : visible.length === 0 ? (
        <Text variant="body-md" tone="muted" className="mt-4">
          {t("No skills match.", "没有匹配的技能。")}
        </Text>
      ) : (
        <ul
          className="flex flex-col gap-3 pt-4"
          aria-label={t("Otto skills", "Otto 技能")}
        >
          {visible.map((skill) => (
            <li key={skill.name}>
              <ExpertSkillListItem
                entry={{ name: skill.name, skill, library: skill }}
                accentClassName={AUTOPILOT_PILL_CLASS}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
