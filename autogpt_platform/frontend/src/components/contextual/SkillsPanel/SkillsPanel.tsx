"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { Text } from "@/components/atoms/Text/Text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { NEW_SKILL_PROMPT } from "../guidedPrompts";
import { EmptySkills } from "./components/EmptySkills/EmptySkills";
import { SkillListItem } from "./components/SkillListItem/SkillListItem";
import { UploadSkillButton } from "./components/UploadSkillButton/UploadSkillButton";
import { useSkillsPanel } from "./useSkillsPanel";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  onGuidedPrompt: (prompt: string) => void;
  withHeading?: boolean;
}

export function SkillsPanel({ onGuidedPrompt, withHeading = true }: Props) {
  const { t } = useTranslation();

  const { skills, isLoading, error, newSkillName, handleSkillUploaded } =
    useSkillsPanel();

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {withHeading && <Text variant="h2">{t("Skills", "技能")}</Text>}
          <Text variant="body" tone="muted">
            {t(
              "Reusable playbooks your experts follow. Review your skills, import a new one, or delete one you no longer need.",
              "供专家遵循、可重复使用的操作指南。您可以查看技能、导入新技能，或删除不再需要的技能。",
            )}
          </Text>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <UploadSkillButton onUploaded={handleSkillUploaded} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="primary"
                size="small"
                onClick={() => onGuidedPrompt(NEW_SKILL_PROMPT)}
                data-testid="skill-new-button"
              >
                <Icon icon={PlusSignIcon} className="mr-1 h-4 w-4" />
                {t("New skill", "新建技能")}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t("Create a new skill in chat", "在聊天中创建新技能")}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {error ? (
        <ErrorCard
          responseError={{
            message:
              error instanceof Error
                ? error.message
                : t("Failed to load skills", "加载技能失败"),
          }}
          context="skills"
        />
      ) : isLoading ? (
        <div
          className="flex items-center justify-center py-16"
          data-testid="skills-loading"
        >
          <LoadingSpinner />
        </div>
      ) : skills.length === 0 ? (
        <EmptySkills />
      ) : (
        <ul
          className="flex flex-col gap-3"
          data-testid="skills-list"
          aria-label={t("Skills", "技能")}
        >
          {skills.map((skill) => (
            <li key={skill.name}>
              <SkillListItem
                skill={skill}
                isNew={skill.name === newSkillName}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
