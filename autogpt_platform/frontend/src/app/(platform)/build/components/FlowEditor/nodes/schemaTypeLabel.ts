import type { Locale } from "@/lib/i18n/locale";

const CHINESE_TYPE_LABELS: Readonly<Record<string, string>> = {
  file: "文件",
  table: "表格",
  date: "日期",
  time: "时间",
  datetime: "日期时间",
  text: "文本",
  number: "数字",
  integer: "整数",
  "true/false": "布尔值",
  object: "对象",
  list: "列表",
  null: "空值",
  any: "任意类型",
};

export function schemaTypeLabel(label: string, locale: Locale) {
  return locale === "zh-CN" ? (CHINESE_TYPE_LABELS[label] ?? label) : label;
}
