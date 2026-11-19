import type { AgentDetailsResponse } from "@/app/api/__generated__/models/agentDetailsResponse";
import type { AgentOutputResponse } from "@/app/api/__generated__/models/agentOutputResponse";
import type { ErrorResponse } from "@/app/api/__generated__/models/errorResponse";
import type { ExecutionStartedResponse } from "@/app/api/__generated__/models/executionStartedResponse";
import type { NeedLoginResponse } from "@/app/api/__generated__/models/needLoginResponse";
import { ResponseType } from "@/app/api/__generated__/models/responseType";
import type { SetupRequirementsResponse } from "@/app/api/__generated__/models/setupRequirementsResponse";
import type { ToolUIPart } from "ai";
import { ScaleLoader } from "../../components/ScaleLoader/ScaleLoader";
import {
  AlertDiamondIcon,
  PlayIcon,
  Rocket01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export interface RunAgentInput {
  username_agent_slug?: string;
  library_agent_id?: string;
  inputs?: Record<string, unknown>;
  use_defaults?: boolean;
  schedule_name?: string;
  cron?: string;
  timezone?: string;
}

export type RunAgentToolOutput =
  | SetupRequirementsResponse
  | ExecutionStartedResponse
  | AgentOutputResponse
  | AgentDetailsResponse
  | NeedLoginResponse
  | ErrorResponse;

const RUN_AGENT_OUTPUT_TYPES = new Set<string>([
  ResponseType.setup_requirements,
  ResponseType.execution_started,
  ResponseType.agent_output,
  ResponseType.agent_details,
  ResponseType.need_login,
  ResponseType.error,
]);

export function isRunAgentSetupRequirementsOutput(
  output: RunAgentToolOutput,
): output is SetupRequirementsResponse {
  return (
    output.type === ResponseType.setup_requirements ||
    ("setup_info" in output && typeof output.setup_info === "object")
  );
}

export function isRunAgentExecutionStartedOutput(
  output: RunAgentToolOutput,
): output is ExecutionStartedResponse {
  return (
    output.type === ResponseType.execution_started || "execution_id" in output
  );
}

export function isRunAgentAgentOutputResponse(
  output: RunAgentToolOutput,
): output is AgentOutputResponse {
  return output.type === ResponseType.agent_output;
}

export function isRunAgentAgentDetailsOutput(
  output: RunAgentToolOutput,
): output is AgentDetailsResponse {
  return output.type === ResponseType.agent_details || "agent" in output;
}

export function isRunAgentNeedLoginOutput(
  output: RunAgentToolOutput,
): output is NeedLoginResponse {
  return output.type === ResponseType.need_login;
}

export function isRunAgentErrorOutput(
  output: RunAgentToolOutput,
): output is ErrorResponse {
  return output.type === ResponseType.error || "error" in output;
}

function parseOutput(output: unknown): RunAgentToolOutput | null {
  if (!output) return null;
  if (typeof output === "string") {
    const trimmed = output.trim();
    if (!trimmed) return null;
    try {
      return parseOutput(JSON.parse(trimmed) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof output === "object") {
    const type = (output as { type?: unknown }).type;
    if (typeof type === "string" && RUN_AGENT_OUTPUT_TYPES.has(type)) {
      return output as RunAgentToolOutput;
    }
    if ("execution_id" in output) return output as ExecutionStartedResponse;
    if ("setup_info" in output) return output as SetupRequirementsResponse;
    if ("agent" in output) return output as AgentDetailsResponse;
    if ("error" in output || "details" in output)
      return output as ErrorResponse;
    if (type === ResponseType.need_login) return output as NeedLoginResponse;
  }
  return null;
}

export function getRunAgentToolOutput(
  part: unknown,
): RunAgentToolOutput | null {
  if (!part || typeof part !== "object") return null;
  return parseOutput((part as { output?: unknown }).output);
}

function getAgentIdentifierText(
  input: RunAgentInput | undefined,
  t: (english: string, chinese: string) => string,
): string | null {
  if (!input) return null;
  const slug = input.username_agent_slug?.trim();
  if (slug) return slug;
  const libraryId = input.library_agent_id?.trim();
  if (libraryId)
    return t(
      `Library workflow ${libraryId}`,
      `工作流库中的工作流 ${libraryId}`,
    );
  return null;
}

export function getAnimationText(
  part: {
    state: ToolUIPart["state"];
    input?: unknown;
    output?: unknown;
  },
  t = (english: string, _chinese: string) => english,
): string {
  const input = part.input as RunAgentInput | undefined;
  const agentIdentifier = getAgentIdentifierText(input, t);
  const isSchedule = Boolean(
    input?.schedule_name?.trim() || input?.cron?.trim(),
  );
  const actionPhrase = isSchedule
    ? t("Scheduling the workflow to run", "正在安排工作流运行")
    : t("Running the workflow", "正在运行工作流");
  const identifierText = agentIdentifier ? ` "${agentIdentifier}"` : "";

  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return `${actionPhrase}${identifierText}`;
    case "output-available": {
      const output = parseOutput(part.output);
      if (!output) return `${actionPhrase}${identifierText}`;
      if (isRunAgentExecutionStartedOutput(output)) {
        return t(
          `Started "${output.graph_name}"`,
          `已启动“${output.graph_name}”`,
        );
      }
      if (isRunAgentAgentDetailsOutput(output)) {
        if (output.agent.trigger_info) {
          return t(
            `Webhook trigger setup for "${output.agent.name}"`,
            `为“${output.agent.name}”设置 Webhook 触发器`,
          );
        }
        return t(
          `Workflow inputs needed for "${output.agent.name}"`,
          `“${output.agent.name}”需要工作流输入`,
        );
      }
      if (isRunAgentSetupRequirementsOutput(output)) {
        return t(
          `Setup needed for "${output.setup_info.agent_name}"`,
          `“${output.setup_info.agent_name}”需要设置`,
        );
      }
      if (isRunAgentNeedLoginOutput(output))
        return t("Sign in required to run workflow", "运行工作流需要登录");
      return t("Something went wrong", "发生了错误");
    }
    case "output-error":
      return t("Something went wrong", "发生了错误");
    default:
      return actionPhrase;
  }
}

export function getStreamingLoadingText(
  part: { input?: unknown },
  t = (english: string, _chinese: string) => english,
): string {
  const input = part.input as RunAgentInput | undefined;
  const isSchedule = Boolean(
    input?.schedule_name?.trim() || input?.cron?.trim(),
  );
  return isSchedule
    ? t(
        "Scheduling workflow, this might take a minute",
        "正在安排工作流，可能需要一分钟",
      )
    : t(
        "Running workflow, this might take a minute",
        "正在运行工作流，可能需要一分钟",
      );
}

export function ToolIcon({
  isStreaming,
  isError,
}: {
  isStreaming?: boolean;
  isError?: boolean;
}) {
  if (isError) {
    return <Icon icon={AlertDiamondIcon} size={14} tone="error" />;
  }
  if (isStreaming) {
    return <ScaleLoader size={14} />;
  }
  return <Icon icon={PlayIcon} size={14} tone="subtle" />;
}

export function AccordionIcon() {
  return <Icon icon={Rocket01Icon} size={28} />;
}

export function formatMaybeJson(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function getAccordionMeta(
  output: RunAgentToolOutput,
  t = (english: string, _chinese: string) => english,
): {
  icon: React.ReactNode;
  title: string;
  titleClassName?: string;
  description?: string;
} {
  const icon = <AccordionIcon />;

  if (isRunAgentExecutionStartedOutput(output)) {
    const statusText =
      typeof output.status === "string" && output.status.trim()
        ? output.status.trim()
        : t("started", "已启动");
    return {
      icon,
      title: output.graph_name,
      description: t(`Status: ${statusText}`, `状态：${statusText}`),
    };
  }

  if (isRunAgentAgentDetailsOutput(output)) {
    return {
      icon,
      title: output.agent.name,
      description: output.agent.trigger_info
        ? t("Webhook trigger setup", "设置 Webhook 触发器")
        : t("Inputs required", "需要输入"),
    };
  }

  if (isRunAgentSetupRequirementsOutput(output)) {
    const missingCredsCount = Object.keys(
      (output.setup_info.user_readiness?.missing_credentials ?? {}) as Record<
        string,
        unknown
      >,
    ).length;
    return {
      icon,
      title: output.setup_info.agent_name,
      description:
        missingCredsCount > 0
          ? t(
              `Missing ${missingCredsCount} credential${missingCredsCount === 1 ? "" : "s"}`,
              `缺少 ${missingCredsCount} 个凭据`,
            )
          : output.message,
    };
  }

  if (isRunAgentAgentOutputResponse(output)) {
    return {
      icon,
      title: output.agent_name,
      description: t("Execution completed", "执行已完成"),
    };
  }

  if (isRunAgentNeedLoginOutput(output)) {
    return { icon, title: t("Sign in required", "需要登录") };
  }

  return {
    icon: <Icon icon={AlertDiamondIcon} size={28} tone="error" />,
    title: t("Error", "错误"),
    titleClassName: "text-error",
  };
}
