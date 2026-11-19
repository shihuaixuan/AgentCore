import type { ToolUIPart } from "ai";
import {
  BulbIcon,
  CheckmarkCircle02Icon,
  PlusSignCircleIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

/* ------------------------------------------------------------------ */
/*  Types (local until API client is regenerated)                      */
/* ------------------------------------------------------------------ */

interface FeatureRequestInfo {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
}

export interface FeatureRequestSearchResponse {
  type: "feature_request_search";
  message: string;
  results: FeatureRequestInfo[];
  count: number;
  query: string;
}

export interface FeatureRequestCreatedResponse {
  type: "feature_request_created";
  message: string;
  issue_id: string;
  issue_identifier: string;
  issue_title: string;
  issue_url: string;
  is_new_issue: boolean;
  customer_name: string;
}

interface NoResultsResponse {
  type: "no_results";
  message: string;
  suggestions?: string[];
}

interface ErrorResponse {
  type: "error";
  message: string;
  error?: string;
}

export type FeatureRequestOutput =
  | FeatureRequestSearchResponse
  | FeatureRequestCreatedResponse
  | NoResultsResponse
  | ErrorResponse;

export type FeatureRequestToolType =
  | "tool-search_feature_requests"
  | "tool-create_feature_request"
  | string;

/* ------------------------------------------------------------------ */
/*  Output parsing                                                     */
/* ------------------------------------------------------------------ */

function parseOutput(output: unknown): FeatureRequestOutput | null {
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
    if (
      type === "feature_request_search" ||
      type === "feature_request_created" ||
      type === "no_results" ||
      type === "error"
    ) {
      return output as FeatureRequestOutput;
    }
    // Fallback structural checks
    if ("results" in output && "query" in output)
      return output as FeatureRequestSearchResponse;
    if ("issue_identifier" in output)
      return output as FeatureRequestCreatedResponse;
    if ("suggestions" in output && !("error" in output))
      return output as NoResultsResponse;
    if ("error" in output || "details" in output)
      return output as ErrorResponse;
  }
  return null;
}

export function getFeatureRequestOutput(
  part: unknown,
): FeatureRequestOutput | null {
  if (!part || typeof part !== "object") return null;
  return parseOutput((part as { output?: unknown }).output);
}

/* ------------------------------------------------------------------ */
/*  Type guards                                                        */
/* ------------------------------------------------------------------ */

export function isSearchResultsOutput(
  output: FeatureRequestOutput,
): output is FeatureRequestSearchResponse {
  return (
    output.type === "feature_request_search" ||
    ("results" in output && "query" in output)
  );
}

export function isCreatedOutput(
  output: FeatureRequestOutput,
): output is FeatureRequestCreatedResponse {
  return (
    output.type === "feature_request_created" || "issue_identifier" in output
  );
}

export function isNoResultsOutput(
  output: FeatureRequestOutput,
): output is NoResultsResponse {
  return (
    output.type === "no_results" ||
    ("suggestions" in output && !("error" in output))
  );
}

export function isErrorOutput(
  output: FeatureRequestOutput,
): output is ErrorResponse {
  return output.type === "error" || "error" in output;
}

/* ------------------------------------------------------------------ */
/*  Accordion metadata                                                 */
/* ------------------------------------------------------------------ */

export function getAccordionTitle(
  toolType: FeatureRequestToolType,
  output: FeatureRequestOutput,
  t = (english: string, _chinese: string) => english,
): string {
  if (toolType === "tool-search_feature_requests") {
    if (isSearchResultsOutput(output)) return t("Feature requests", "功能请求");
    if (isNoResultsOutput(output))
      return t("No feature requests found", "未找到功能请求");
    return t("Feature request search error", "搜索功能请求时出错");
  }
  if (isCreatedOutput(output)) {
    return output.is_new_issue
      ? t("Feature request created", "功能请求已创建")
      : t("Added to feature request", "已添加到功能请求");
  }
  if (isErrorOutput(output)) return t("Feature request error", "功能请求出错");
  return t("Feature request", "功能请求");
}

/* ------------------------------------------------------------------ */
/*  Animation text                                                     */
/* ------------------------------------------------------------------ */

interface AnimationPart {
  type: FeatureRequestToolType;
  state: ToolUIPart["state"];
  input?: unknown;
  output?: unknown;
}

export function getAnimationText(
  part: AnimationPart,
  t = (english: string, _chinese: string) => english,
): string {
  if (part.type === "tool-search_feature_requests") {
    const query = (part.input as { query?: string } | undefined)?.query?.trim();
    const queryText = query ? t(` for "${query}"`, `：“${query}”`) : "";

    switch (part.state) {
      case "input-streaming":
      case "input-available":
        return t("Searching feature requests", "正在搜索功能请求") + queryText;
      case "output-available": {
        const output = parseOutput(part.output);
        if (!output)
          return (
            t("Searching feature requests", "正在搜索功能请求") + queryText
          );
        if (isSearchResultsOutput(output)) {
          return (
            t(
              `Found ${output.count} feature request${output.count === 1 ? "" : "s"}`,
              `找到 ${output.count} 个功能请求`,
            ) + queryText
          );
        }
        if (isNoResultsOutput(output))
          return t("No feature requests found", "未找到功能请求") + queryText;
        return (
          t("Error searching feature requests", "搜索功能请求时出错") +
          queryText
        );
      }
      case "output-error":
        return (
          t("Error searching feature requests", "搜索功能请求时出错") +
          queryText
        );
      default:
        return t("Searching feature requests", "正在搜索功能请求");
    }
  }

  // create_feature_request
  const title = (part.input as { title?: string } | undefined)?.title?.trim();
  const titleText = title ? ` "${title}"` : "";

  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return t(
        `Creating feature request${titleText}`,
        `正在创建功能请求${titleText}`,
      );
    case "output-available": {
      const output = parseOutput(part.output);
      if (!output)
        return t(
          `Creating feature request${titleText}`,
          `正在创建功能请求${titleText}`,
        );
      if (isCreatedOutput(output)) {
        return output.is_new_issue
          ? t("Feature request created", "功能请求已创建")
          : t("Added to existing feature request", "已添加到现有功能请求");
      }
      if (isErrorOutput(output))
        return t("Error creating feature request", "创建功能请求时出错");
      return t(
        `Created feature request${titleText}`,
        `已创建功能请求${titleText}`,
      );
    }
    case "output-error":
      return t("Error creating feature request", "创建功能请求时出错");
    default:
      return t("Creating feature request", "正在创建功能请求");
  }
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

export function ToolIcon({
  toolType,
  isStreaming,
  isError,
}: {
  toolType: FeatureRequestToolType;
  isStreaming?: boolean;
  isError?: boolean;
}) {
  const icon =
    toolType === "tool-create_feature_request"
      ? PlusSignCircleIcon
      : Search01Icon;

  return (
    <Icon
      icon={icon}
      size={14}
      tone={isError ? "error" : isStreaming ? "muted" : "subtle"}
    />
  );
}

export function AccordionIcon({
  toolType,
}: {
  toolType: FeatureRequestToolType;
}) {
  const icon =
    toolType === "tool-create_feature_request"
      ? CheckmarkCircle02Icon
      : BulbIcon;
  return <Icon icon={icon} size={32} />;
}
