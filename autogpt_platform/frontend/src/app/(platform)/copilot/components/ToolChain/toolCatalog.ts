import type { Locale } from "@/lib/i18n/locale";
import { isEmptyResult } from "./resultHelpers";
import { AGENT_TOOL_CATALOG } from "./toolCatalog.agent";
import { PLATFORM_TOOL_CATALOG } from "./toolCatalog.platform";
import type {
  ChainCategory,
  ToolDisplayContext,
  ToolInput,
  ToolMeta,
} from "./toolCatalog.shared";
import { TOOL_CATALOG_ZH } from "./toolCatalog.zh";

export type { ChainCategory } from "./toolCatalog.shared";

export const COPILOT_TOOL_CATALOG: Record<string, ToolMeta> = {
  ...AGENT_TOOL_CATALOG,
  ...PLATFORM_TOOL_CATALOG,
};

export function getCatalogLabel(
  toolName: string,
  input: unknown,
  state: "running" | "done" | "error",
  context: ToolDisplayContext = {},
  locale: Locale = "en",
): { category: ChainCategory; text: string; emptyResult?: true } | null {
  const meta = COPILOT_TOOL_CATALOG[toolName];
  if (!meta) return null;
  const subject =
    meta.subject?.(
      input && typeof input === "object" ? (input as ToolInput) : {},
      context,
    ) ?? null;
  const suffix = subject ? ` ${subject}` : "";
  const emptyResult =
    state === "done" && !!meta.empty && isEmptyResult(context.output);
  const translations: Readonly<Record<string, string>> =
    locale === "zh-CN" ? TOOL_CATALOG_ZH : {};
  const running = translations[meta.running] ?? meta.running;
  const done = translations[meta.done] ?? meta.done;
  const empty = meta.empty && (translations[meta.empty] ?? meta.empty);
  const text =
    state === "running"
      ? `${running}${suffix}…`
      : state === "error"
        ? locale === "zh-CN"
          ? `执行失败：${running}${suffix}`
          : `Failed while ${running.charAt(0).toLowerCase()}${running.slice(1)}${suffix}`
        : emptyResult
          ? `${done}${suffix} – ${empty}`
          : `${done}${suffix}`;
  return { category: meta.category, text, ...(emptyResult && { emptyResult }) };
}
