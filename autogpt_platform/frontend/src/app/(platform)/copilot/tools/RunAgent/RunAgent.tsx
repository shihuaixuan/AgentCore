"use client";

import type { ToolUIPart } from "ai";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { MorphingTextAnimation } from "../../components/MorphingTextAnimation/MorphingTextAnimation";
import { ToolAccordion } from "../../components/ToolAccordion/ToolAccordion";
import { ContentMessage } from "../../components/ToolAccordion/AccordionContent";
import {
  getAccordionMeta,
  getAnimationText,
  getRunAgentToolOutput,
  getStreamingLoadingText,
  isRunAgentAgentDetailsOutput,
  isRunAgentAgentOutputResponse,
  isRunAgentErrorOutput,
  isRunAgentExecutionStartedOutput,
  isRunAgentNeedLoginOutput,
  isRunAgentSetupRequirementsOutput,
  ToolIcon,
} from "./helpers";
import { ExecutionStartedCard } from "./components/ExecutionStartedCard/ExecutionStartedCard";
import { useLiveRunStatus } from "./components/ExecutionStartedCard/useLiveRunStatus";
import { AgentDetailsCard } from "./components/AgentDetailsCard/AgentDetailsCard";
import { SetupRequirementsCard } from "../../components/SetupRequirementsCard/SetupRequirementsCard";
import { ErrorCard } from "./components/ErrorCard/ErrorCard";
import {
  isUnparseableJsonOutput,
  reportCorruptedToolOutput,
} from "../../helpers/toolOutput";
import { Text } from "@/components/atoms/Text/Text";

export interface RunAgentToolPart {
  type: string;
  toolCallId: string;
  state: ToolUIPart["state"];
  input?: unknown;
  output?: unknown;
}

interface Props {
  part: RunAgentToolPart;
}

export function RunAgentTool({ part }: Props) {
  const { t } = useTranslation();
  const text = getAnimationText(part, t);
  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available";

  const output = getRunAgentToolOutput(part);
  const isCorrupted =
    part.state === "output-available" &&
    !output &&
    isUnparseableJsonOutput(part.output);
  if (isCorrupted) reportCorruptedToolOutput(part.toolCallId, part.type);
  const isError =
    part.state === "output-error" ||
    isCorrupted ||
    (!!output && isRunAgentErrorOutput(output));
  const isOutputAvailable = part.state === "output-available" && !!output;

  const setupRequirementsOutput =
    isOutputAvailable && isRunAgentSetupRequirementsOutput(output)
      ? output
      : null;

  const agentDetailsOutput =
    isOutputAvailable && isRunAgentAgentDetailsOutput(output) ? output : null;

  const needLoginOutput =
    isOutputAvailable && isRunAgentNeedLoginOutput(output) ? output : null;

  const agentOutputResponse =
    isOutputAvailable && isRunAgentAgentOutputResponse(output) ? output : null;

  const startedOutput =
    isOutputAvailable && isRunAgentExecutionStartedOutput(output)
      ? output
      : null;
  const liveRun = useLiveRunStatus(startedOutput);
  const liveStartedOutput = startedOutput
    ? {
        ...startedOutput,
        status: liveRun.status,
        // "Started successfully" reads wrong once the card says it failed.
        message: liveRun.endedAfterStart ? "" : startedOutput.message,
      }
    : null;

  const hasExpandableContent =
    isOutputAvailable &&
    !setupRequirementsOutput &&
    !agentDetailsOutput &&
    !needLoginOutput &&
    (isRunAgentExecutionStartedOutput(output) ||
      isRunAgentAgentOutputResponse(output) ||
      isRunAgentErrorOutput(output));

  return (
    <div className="py-2">
      {/* Only show loading text when NOT showing accordion or other content */}
      {!isStreaming &&
        !setupRequirementsOutput &&
        !agentDetailsOutput &&
        !needLoginOutput &&
        !hasExpandableContent && (
          <div className="flex items-center gap-2 text-body text-foreground-tertiary">
            <ToolIcon isStreaming={isStreaming} isError={isError} />
            <MorphingTextAnimation
              text={
                isCorrupted
                  ? t(
                      "Workflow result could not be displayed",
                      "无法显示工作流结果",
                    )
                  : text
              }
              className={isError ? "text-error" : undefined}
            />
          </div>
        )}

      {isCorrupted && (
        <Text variant="body-tight" tone="error" className="mt-1">
          {t(
            "The result data arrived corrupted, so any sign-in or setup card it contained can't be shown. Ask your expert to retry this step.",
            "收到的结果数据已损坏，无法显示其中的登录或设置卡片。请让你的专家重试此步骤。",
          )}
        </Text>
      )}

      {isStreaming && !output && (
        <div className="flex items-center gap-2 text-body text-foreground-tertiary">
          <ToolIcon isStreaming isError={isError} />
          <MorphingTextAnimation text={getStreamingLoadingText(part, t)} />
        </div>
      )}

      {setupRequirementsOutput && (
        <div className="mt-2">
          <SetupRequirementsCard
            output={setupRequirementsOutput}
            inputsMode="preview"
          />
        </div>
      )}

      {agentDetailsOutput && (
        <div className="mt-2">
          <AgentDetailsCard output={agentDetailsOutput} />
        </div>
      )}

      {needLoginOutput && (
        <div className="mt-2">
          <ContentMessage>{needLoginOutput.message}</ContentMessage>
        </div>
      )}

      {hasExpandableContent && output && (
        <ToolAccordion {...getAccordionMeta(liveStartedOutput ?? output, t)}>
          {liveStartedOutput && (
            <ExecutionStartedCard
              output={liveStartedOutput}
              error={liveRun.error}
            />
          )}

          {agentOutputResponse && (
            <ExecutionStartedCard
              output={{
                message: agentOutputResponse.message,
                execution_id: agentOutputResponse.execution?.execution_id ?? "",
                graph_id: agentOutputResponse.agent_id,
                graph_name: agentOutputResponse.agent_name,
                library_agent_link:
                  agentOutputResponse.library_agent_link ?? undefined,
                // Propagate the real terminal status (COMPLETED / FAILED /
                // STOPPED …) so the card title matches what happened.
                // Defaults to the "started" label when backend omits status.
                status: agentOutputResponse.execution?.status ?? "COMPLETED",
              }}
            />
          )}

          {isRunAgentErrorOutput(output) && <ErrorCard output={output} />}
        </ToolAccordion>
      )}
    </div>
  );
}
