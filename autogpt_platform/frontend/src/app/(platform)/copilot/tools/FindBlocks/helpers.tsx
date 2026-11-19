import type { BlockListResponse } from "@/app/api/__generated__/models/blockListResponse";
import { ResponseType } from "@/app/api/__generated__/models/responseType";
import { FindBlockInput, FindBlockToolPart } from "./FindBlocks";
import { CubeIcon, Package01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function parseOutput(output: unknown): BlockListResponse | null {
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
    if (type === ResponseType.block_list || "blocks" in output) {
      return output as BlockListResponse;
    }
  }
  return null;
}

export function getAnimationText(
  part: FindBlockToolPart,
  t = (english: string, _chinese: string) => english,
): string {
  const query = (part.input as FindBlockInput | undefined)?.query?.trim();
  const queryText = query ? ` matching "${query}"` : "";

  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return t(
        `Searching for actions${queryText}`,
        `正在搜索动作${query ? `：“${query}”` : ""}`,
      );

    case "output-available": {
      const parsed = parseOutput(part.output);
      if (parsed) {
        return t(
          `Found ${parsed.count} action${parsed.count === 1 ? "" : "s"}${queryText}`,
          `找到 ${parsed.count} 个动作${query ? `：“${query}”` : ""}`,
        );
      }
      return t(
        `Searching for actions${queryText}`,
        `正在搜索动作${query ? `：“${query}”` : ""}`,
      );
    }

    case "output-error":
      return t(
        `Search failed${query ? ` for "${query}"` : ""}`,
        `搜索失败${query ? `：“${query}”` : ""}`,
      );

    default:
      return t("Searching for actions", "正在搜索动作");
  }
}

export function ToolIcon({
  isStreaming,
  isError,
}: {
  isStreaming?: boolean;
  isError?: boolean;
}) {
  return (
    <Icon
      icon={Package01Icon}
      size={14}
      tone={isError ? "error" : isStreaming ? "muted" : "subtle"}
    />
  );
}

export function AccordionIcon() {
  return <Icon icon={CubeIcon} size={32} />;
}
