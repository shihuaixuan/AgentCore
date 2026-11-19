"use client";

import type { ToolUIPart } from "ai";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AgentSavedCard } from "../../components/AgentSavedCard/AgentSavedCard";
import { useCopilotChatActions } from "../../components/CopilotChatActionsProvider/useCopilotChatActions";
import { ToolErrorCard } from "../../components/ToolErrorCard/ToolErrorCard";
import { MorphingTextAnimation } from "../../components/MorphingTextAnimation/MorphingTextAnimation";
import {
  ContentCardDescription,
  ContentCodeBlock,
  ContentGrid,
  ContentMessage,
} from "../../components/ToolAccordion/AccordionContent";
import { ToolAccordion } from "../../components/ToolAccordion/ToolAccordion";
import {
  AccordionIcon,
  formatMaybeJson,
  getAnimationText,
  getEditAgentToolOutput,
  isAgentPreviewOutput,
  isAgentSavedOutput,
  isErrorOutput,
  ToolIcon,
  truncateText,
  type EditAgentToolOutput,
} from "./helpers";

export interface EditAgentToolPart {
  type: string;
  toolCallId: string;
  state: ToolUIPart["state"];
  input?: unknown;
  output?: unknown;
}

interface Props {
  part: EditAgentToolPart;
}

function getAccordionMeta(
  output: EditAgentToolOutput | null,
  t: ReturnType<typeof useTranslation>["t"],
): {
  icon: React.ReactNode;
  title: string;
  titleClassName?: string;
  description?: string;
  expanded?: boolean;
} {
  const icon = <AccordionIcon />;

  if (output && isAgentPreviewOutput(output)) {
    return {
      icon,
      title: output.agent_name,
      description: t(
        `${output.node_count} block${output.node_count === 1 ? "" : "s"}`,
        `${output.node_count} 个模块`,
      ),
    };
  }
  return { icon, title: "" };
}

export function EditAgentTool({ part }: Props) {
  const { t } = useTranslation();
  const text = getAnimationText(part, t);
  const { onSend } = useCopilotChatActions();
  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available";

  const output = getEditAgentToolOutput(part);
  const isError =
    part.state === "output-error" || (!!output && isErrorOutput(output));

  const isOperating = !output;

  return (
    <div className="py-2">
      {isOperating && (
        <div className="flex items-center gap-2 text-body text-foreground-tertiary">
          <ToolIcon isStreaming={isStreaming} isError={isError} />
          <MorphingTextAnimation
            text={text}
            className={isError ? "text-error" : undefined}
          />
        </div>
      )}

      {isError && output && isErrorOutput(output) && (
        <ToolErrorCard
          message={output.message}
          fallbackMessage={t(
            "Failed to edit the workflow. Please try again.",
            "编辑工作流失败。请重试。",
          )}
          error={output.error ? formatMaybeJson(output.error) : undefined}
          details={output.details ? formatMaybeJson(output.details) : undefined}
          actions={[
            {
              label: t("Try again", "重试"),
              onClick: () => onSend("Please try editing the workflow again."),
            },
          ]}
        />
      )}

      {output && !isError && isAgentPreviewOutput(output) && (
        <ToolAccordion {...getAccordionMeta(output, t)}>
          <ContentGrid>
            <ContentMessage>{output.message}</ContentMessage>
            {output.description?.trim() && (
              <ContentCardDescription>
                {output.description}
              </ContentCardDescription>
            )}
            <ContentCodeBlock>
              {truncateText(formatMaybeJson(output.agent_json), 1600)}
            </ContentCodeBlock>
          </ContentGrid>
        </ToolAccordion>
      )}

      {output && isAgentSavedOutput(output) && (
        <AgentSavedCard
          agentName={output.agent_name}
          message={t("has been updated!", "已更新！")}
          libraryAgentLink={output.library_agent_link}
          agentPageLink={output.agent_page_link}
        />
      )}
    </div>
  );
}
