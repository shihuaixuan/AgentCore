"use client";

import type { ToolUIPart } from "ai";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useCopilotChatActions } from "../../components/CopilotChatActionsProvider/useCopilotChatActions";
import { MorphingTextAnimation } from "../../components/MorphingTextAnimation/MorphingTextAnimation";
import {
  ContentGrid,
  ContentMessage,
} from "../../components/ToolAccordion/AccordionContent";
import { ToolAccordion } from "../../components/ToolAccordion/ToolAccordion";
import { ToolErrorCard } from "../../components/ToolErrorCard/ToolErrorCard";
import { StepItem } from "./components/StepItem";
import {
  AccordionIcon,
  getAnimationText,
  getDecomposeGoalOutput,
  isDecompositionOutput,
  isErrorOutput,
  ToolIcon,
} from "./helpers";

interface Props {
  part: ToolUIPart;
}

export function DecomposeGoalTool({ part }: Props) {
  const { t } = useTranslation();
  const text = getAnimationText(part, t);
  const { onSend } = useCopilotChatActions();

  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available";

  const output = getDecomposeGoalOutput(part);
  const isError =
    part.state === "output-error" || (!!output && isErrorOutput(output));
  const isPending = !output && !isError;

  return (
    <div className="py-2">
      {isPending && (
        <div className="flex items-center gap-2 text-body text-foreground-tertiary">
          <ToolIcon isStreaming={isStreaming} isError={isError} />
          <MorphingTextAnimation
            text={text}
            className={isError ? "text-error" : undefined}
          />
        </div>
      )}

      {isError && (
        <ToolErrorCard
          message={
            output && isErrorOutput(output) ? (output.message ?? "") : ""
          }
          fallbackMessage={t(
            "Failed to analyze the goal. Please try again.",
            "分析目标失败。请重试。",
          )}
          actions={[
            {
              label: t("Try again", "重试"),
              onClick: () => onSend("Please try decomposing the goal again."),
            },
          ]}
        />
      )}

      {output && isDecompositionOutput(output) && (
        <ToolAccordion
          icon={<AccordionIcon />}
          title={t(
            `Build Plan — ${output.step_count} steps`,
            `构建计划 — ${output.step_count} 个步骤`,
          )}
          description={output.goal}
          defaultExpanded
        >
          <ContentGrid>
            <ContentMessage>{output.message}</ContentMessage>

            <div className="rounded-lg border border-border-base bg-surface p-3">
              <div className="space-y-0.5">
                {output.steps.map((step, i) => (
                  <StepItem
                    key={step.step_id}
                    index={i}
                    description={step.description}
                    blockName={step.block_name}
                    status={step.status ?? "pending"}
                  />
                ))}
              </div>
            </div>
          </ContentGrid>
        </ToolAccordion>
      )}
    </div>
  );
}
