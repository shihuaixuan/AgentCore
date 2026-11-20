import type { ToolUIPart, UIMessage } from "ai";
import { beautifyString } from "@/lib/utils";
import { asObject } from "../components/ToolChain/resultHelpers";
import { TOOL_DISPLAY_PART_TYPE } from "../messageParts";

export function toolDisplayName(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export interface ToolDisplayMetadata {
  displayName?: string;
  subSessionID?: string;
}

export type DisplayToolPart = ToolUIPart &
  Pick<ToolDisplayMetadata, "subSessionID">;

export function parseToolDisplay(value: unknown) {
  const data = asObject(value);
  const toolCallID = toolDisplayName(data?.toolCallId);
  const displayName = toolDisplayName(data?.displayName);
  const subSessionID = toolDisplayName(data?.subSessionId);
  if (!toolCallID || (!displayName && !subSessionID)) return null;
  return {
    toolCallID,
    metadata: {
      ...(displayName ? { displayName } : {}),
      ...(subSessionID ? { subSessionID } : {}),
    },
  };
}

export function withToolDisplayMetadata(
  parts: UIMessage["parts"],
): UIMessage["parts"] {
  const displays = new Map<string, ToolDisplayMetadata>();
  for (const part of parts) {
    if (part.type !== TOOL_DISPLAY_PART_TYPE || !("data" in part)) continue;
    const display = parseToolDisplay(part.data);
    if (!display) continue;
    displays.set(display.toolCallID, {
      ...displays.get(display.toolCallID),
      ...display.metadata,
    });
  }
  if (displays.size === 0) return parts;
  return parts.map((part) => {
    if (!part.type.startsWith("tool-")) return part;
    const tool = part as DisplayToolPart;
    const display = displays.get(tool.toolCallId);
    return display
      ? {
          ...tool,
          title: display.displayName ?? tool.title,
          subSessionID: display.subSessionID ?? tool.subSessionID,
        }
      : part;
  });
}

export function getAgentDisplayName(
  displayName: unknown,
  output?: unknown,
): string | null {
  const name = toolDisplayName(displayName);
  if (name) return name;
  const result = asObject(output);
  if (!result) return null;
  const resultName =
    toolDisplayName(result.graph_name) ?? toolDisplayName(result.agent_name);
  if (resultName) return resultName;
  if (result.type === "agent_details") {
    return toolDisplayName(asObject(result.agent)?.name);
  }
  if (result.type === "setup_requirements") {
    return toolDisplayName(asObject(result.setup_info)?.agent_name);
  }
  return null;
}

export function getBlockDisplayName(
  displayName: unknown,
  output?: unknown,
): string | null {
  const result = asObject(output);
  const name =
    toolDisplayName(displayName) ??
    toolDisplayName(result?.block_name) ??
    toolDisplayName(asObject(result?.block)?.name) ??
    (result?.type === "setup_requirements"
      ? toolDisplayName(asObject(result.setup_info)?.agent_name)
      : null);
  return name
    ? beautifyString(name)
        .replace(/ Block$/, "")
        .trim()
    : null;
}
