import type { ErrorResponse } from "@/app/api/__generated__/models/errorResponse";
import type { NeedLoginResponse } from "@/app/api/__generated__/models/needLoginResponse";
import { ResponseType } from "@/app/api/__generated__/models/responseType";
import type { SetupRequirementsResponse } from "@/app/api/__generated__/models/setupRequirementsResponse";
import type { ToolUIPart } from "ai";
import { ScaleLoader } from "../../components/ScaleLoader/ScaleLoader";
import { AlertDiamondIcon, WebhookIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

/** Success output of the `setup_agent_webhook_trigger` tool. Duck-typed: it's a
 *  copilot tool result, not a REST response model. */
export interface TriggerSetupOutput {
  type?: string;
  message: string;
  preset_id: string;
  library_agent_id: string;
  library_agent_link: string;
  name: string;
  is_active: boolean;
  provider: string;
  manual_setup_required: boolean;
  webhook_url?: string | null;
}

/** Returned when the trigger block needs config the user must provide (e.g. a
 *  GitHub repo + event filter). The LLM asks the user and re-calls; this is
 *  duck-typed since it's a copilot tool result, not a REST response model. */
export interface TriggerConfigRequiredOutput {
  type?: string;
  message: string;
  missing_config: string[];
  config_schema: Record<string, unknown>;
  // Required regular graph inputs (for agents with input nodes alongside the
  // trigger). The LLM collects these and re-calls with `constant_inputs`.
  missing_inputs?: string[];
  input_schema?: Record<string, unknown> | null;
}

export type SetupTriggerToolOutput =
  | SetupRequirementsResponse
  | TriggerSetupOutput
  | TriggerConfigRequiredOutput
  | NeedLoginResponse
  | ErrorResponse;

export function isSetupTriggerSetupRequirementsOutput(
  output: SetupTriggerToolOutput,
): output is SetupRequirementsResponse {
  return (
    output.type === ResponseType.setup_requirements ||
    ("setup_info" in output && typeof output.setup_info === "object")
  );
}

export function isTriggerSetupOutput(
  output: SetupTriggerToolOutput,
): output is TriggerSetupOutput {
  return (
    output.type === ResponseType.trigger_setup ||
    "manual_setup_required" in output
  );
}

export function isTriggerConfigRequiredOutput(
  output: SetupTriggerToolOutput,
): output is TriggerConfigRequiredOutput {
  return (
    output.type === ResponseType.trigger_config_required ||
    "missing_config" in output
  );
}

export function isSetupTriggerNeedLoginOutput(
  output: SetupTriggerToolOutput,
): output is NeedLoginResponse {
  return output.type === ResponseType.need_login;
}

export function isSetupTriggerErrorOutput(
  output: SetupTriggerToolOutput,
): output is ErrorResponse {
  return output.type === ResponseType.error || "error" in output;
}

function parseOutput(output: unknown): SetupTriggerToolOutput | null {
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
    if ("setup_info" in output) return output as SetupRequirementsResponse;
    if ("manual_setup_required" in output) return output as TriggerSetupOutput;
    if ("missing_config" in output)
      return output as TriggerConfigRequiredOutput;
    if ("error" in output || "details" in output)
      return output as ErrorResponse;
    if ((output as { type?: unknown }).type === ResponseType.need_login)
      return output as NeedLoginResponse;
  }
  return null;
}

export function getSetupTriggerToolOutput(
  part: unknown,
): SetupTriggerToolOutput | null {
  if (!part || typeof part !== "object") return null;
  return parseOutput((part as { output?: unknown }).output);
}

export function getAnimationText(
  part: {
    state: ToolUIPart["state"];
    output?: unknown;
  },
  t = (english: string, _chinese: string) => english,
): string {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return t("Setting up the trigger", "正在设置触发器");
    case "output-available": {
      const output = parseOutput(part.output);
      if (!output) return t("Setting up the trigger", "正在设置触发器");
      if (isTriggerSetupOutput(output))
        return t(
          `Trigger "${output.name}" set up`,
          `触发器“${output.name}”已设置`,
        );
      if (isSetupTriggerSetupRequirementsOutput(output))
        return t(
          `Setup needed for "${output.setup_info.agent_name}"`,
          `“${output.setup_info.agent_name}”需要设置`,
        );
      if (isTriggerConfigRequiredOutput(output))
        return t("Trigger configuration needed", "需要配置触发器");
      if (isSetupTriggerNeedLoginOutput(output))
        return t(
          "Sign in required to set up the trigger",
          "设置触发器需要登录",
        );
      return t("Something went wrong", "发生了错误");
    }
    case "output-error":
      return t("Something went wrong", "发生了错误");
    default:
      return t("Setting up the trigger", "正在设置触发器");
  }
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
  return <Icon icon={WebhookIcon} size={14} tone="subtle" />;
}
