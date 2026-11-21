import type { Locale } from "@/lib/i18n/locale";
import { beautifyString } from "@/lib/utils";
import blocks from "./copy/blocks.zh-CN.json";
import schema from "./copy/schema.zh-CN.json";

const catalog: Readonly<
  Record<
    string,
    { type: string; name: string; source: string; description: string }
  >
> = blocks;
const schemaText: Readonly<Record<string, string>> = schema;
const categories: Readonly<Record<string, string>> = {
  AI: "人工智能",
  SOCIAL: "社交媒体",
  TEXT: "文本处理",
  SEARCH: "搜索",
  BASIC: "基础操作",
  INPUT: "输入",
  OUTPUT: "输出",
  LOGIC: "逻辑",
  COMMUNICATION: "通信",
  DEVELOPER_TOOLS: "开发工具",
  DATA: "数据处理",
  HARDWARE: "硬件",
  AGENT: "工作流",
  CRM: "客户关系管理",
  SAFETY: "安全",
  PRODUCTIVITY: "效率工具",
  ISSUE_TRACKING: "问题跟踪",
  MULTIMEDIA: "多媒体",
  MARKETING: "市场营销",
};

export function hasBuilderBlockCopy(id: string) {
  return Object.hasOwn(catalog, id);
}

export function getBuilderBlockText(
  block: { id: string; name: string; description?: string },
  locale: Locale,
) {
  const entry =
    locale === "zh-CN" && hasBuilderBlockCopy(block.id)
      ? catalog[block.id]
      : undefined;
  const rawDescription = block.description ?? "";
  if (entry && block.name !== entry.type)
    return { name: block.name, description: rawDescription };
  return {
    name:
      entry?.name ??
      beautifyString(block.name)
        .replace(/ Block$/, "")
        .trim(),
    description:
      entry && rawDescription === entry.source
        ? entry.description
        : rawDescription,
  };
}

export function getBuilderCategoryLabel(value: string, locale: Locale) {
  const key = value.replaceAll(" ", "_").toUpperCase();
  return locale === "zh-CN" && Object.hasOwn(categories, key)
    ? categories[key]
    : beautifyString(value.toLowerCase());
}

export function getBuilderSchemaText(text: string, locale: Locale) {
  if (locale !== "zh-CN") return text;
  const key = text.trim().toLowerCase();
  return Object.hasOwn(schemaText, key) ? schemaText[key] : text;
}
