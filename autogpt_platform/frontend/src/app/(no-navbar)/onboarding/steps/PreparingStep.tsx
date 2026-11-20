"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Text } from "@/components/atoms/Text/Text";
import { AssistantPortrait } from "../components/AssistantPortrait";
import { TypingText } from "@/components/molecules/TypingText/TypingText";
import { cn } from "@/lib/utils";
import {
  ChecklistMark,
  type ChecklistState,
} from "../components/ChecklistMark";
import { usePreparingStep } from "./usePreparingStep";

interface Props {
  onComplete: () => void;
  canHire?: boolean;
}

export function PreparingStep({ onComplete, canHire = false }: Props) {
  const { t } = useTranslation();
  const checklistLabels: Record<string, string> = {
    "Personalizing your experience": t(
      "Personalizing your experience",
      "正在为你定制体验",
    ),
    "Setting up your team": t("Setting up your team", "正在组建你的团队"),
    "Building your space": t("Building your space", "正在创建你的空间"),
    "Reading your brain dump": t(
      "Reading your brain dump",
      "正在了解你的工作想法",
    ),
    "Finding tools for your work": t(
      "Finding tools for your work",
      "正在为你的工作寻找工具",
    ),
  };
  const { started, progress, completedItems, checklist } = usePreparingStep({
    onComplete,
    canHire,
  });

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 px-4">
      <div className="flex flex-col items-center gap-4">
        <AssistantPortrait size={120} />
        <Text variant="h4" className="text-center">
          <TypingText
            text={t("Preparing your workspace...", "正在准备工作空间…")}
            active={started}
            delay={400}
            speed={60}
          />
        </Text>
      </div>

      <div className="h-0.5 w-full overflow-hidden bg-surface-hover">
        <div
          className="h-full w-[var(--progress)] bg-action-hover transition-all duration-100 ease-linear"
          style={{ "--progress": `${progress}%` } as React.CSSProperties}
        />
      </div>

      <ul className="flex flex-col gap-3">
        {checklist.map((item, i) => {
          const state = getChecklistState(i, completedItems);
          return (
            <li key={item} className="flex items-center gap-3">
              <ChecklistMark key={state} state={state} />
              <span
                className={cn(
                  "font-sans text-body-lg transition-colors",
                  state === "active" ? "font-medium" : "font-normal",
                  state === "pending"
                    ? "text-foreground-tertiary"
                    : "text-foreground-strong",
                )}
              >
                {checklistLabels[item] ?? item}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getChecklistState(index: number, completedItems: number) {
  if (index < completedItems) return "done" satisfies ChecklistState;
  if (index === completedItems) return "active" satisfies ChecklistState;
  return "pending" satisfies ChecklistState;
}
