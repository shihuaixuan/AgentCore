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
  return locale === "zh-CN" && Object.hasOwn(CHINESE_TYPE_LABELS, label)
    ? CHINESE_TYPE_LABELS[label]
    : label;
}

type Vocabulary = Readonly<Record<string, string>>;

const operations = {
  Add: "加法",
  Subtract: "减法",
  Multiply: "乘法",
  Divide: "除法",
  Power: "幂运算",
};
const comparison = {
  "=": "等于",
  "==": "等于",
  "!=": "不等于",
  ">": "大于",
  "<": "小于",
  ">=": "大于等于",
  "<=": "小于等于",
  equals: "等于",
  not_equals: "不等于",
  contains: "包含",
  not_contains: "不包含",
  greater_than: "大于",
  less_than: "小于",
  greater_than_or_equal: "大于等于",
  less_than_or_equal: "小于等于",
  is_empty: "为空",
  is_not_empty: "不为空",
  like: "匹配",
  not_like: "不匹配",
  in: "在集合中",
  not_in: "不在集合中",
  between: "介于两者之间",
};
const order = {
  asc: "升序",
  desc: "降序",
  ascending: "升序",
  descending: "降序",
  newest: "最新优先",
  relevance: "相关度",
};
const frequency = {
  DAILY: "每日",
  WEEKLY: "每周",
  MONTHLY: "每月",
  YEARLY: "每年",
  daily: "每日",
  weekly: "每周",
  monthly: "每月",
  yearly: "每年",
};
const formats = {
  text: "文本",
  date: "日期",
  dateTime: "日期时间",
  number: "数字",
  options: "选项",
  email: "电子邮箱",
  phone: "电话号码",
  url: "网址（URL）",
  json: "JSON",
  html: "HTML",
  rawHtml: "原始 HTML",
  markdown: "Markdown",
  links: "链接",
  screenshot: "截图",
  "screenshot@fullPage": "整页截图",
  changeTracking: "变更跟踪",
  jpg: "JPEG 图像",
  png: "PNG 图像",
};
const fieldTypes = {
  ...formats,
  singleLineText: "单行文本",
  multilineText: "多行文本",
  richText: "富文本",
  percent: "百分比",
  currency: "货币",
  singleSelect: "单选",
  multipleSelects: "多选",
  phoneNumber: "电话号码",
  checkbox: "复选框",
  formula: "公式",
  count: "计数",
  duration: "时长",
};
const statuses = {
  pending: "待处理",
  queued: "排队中",
  running: "运行中",
  in_progress: "进行中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
  active: "活跃",
  paused: "已暂停",
  disabled: "已停用",
  enabled: "已启用",
  waiting: "等待中",
  idle: "空闲",
  processing: "处理中",
  ready: "已就绪",
  blocked: "受阻",
  success: "成功",
  failure: "失败",
  error: "错误",
};
const effort = {
  none: "无",
  low: "低",
  medium: "中",
  high: "高",
  xhigh: "极高",
  max: "最大",
  ultra: "超高",
};

const enumFields = new Map<string, Vocabulary>();
function register(fields: string[], labels: Vocabulary) {
  for (const field of fields) enumFields.set(field, labels);
}
register(["operation", "Operation"], operations);
register(
  [
    "operator",
    "filter_operator",
    "comparison_operator",
    "ComparisonOperator",
    "FilterOperator",
  ],
  comparison,
);
register(
  [
    "sort_order",
    "secondary_order",
    "sort_by",
    "direction",
    "SortOrder",
    "SortBy",
  ],
  order,
);
register(
  ["frequency", "recurrence_frequency", "RecurrenceFrequency"],
  frequency,
);
register(
  [
    "format",
    "formats",
    "output_format",
    "response_format",
    "ScrapeFormat",
    "EnrichmentFormat",
    "OutputFormat",
  ],
  formats,
);
register(["field_type", "TableFieldType"], fieldTypes);
register(
  [
    "status",
    "state",
    "ChecksStatus",
    "CheckRunStatus",
    "SearchMonitorRunStatus",
    "StatusState",
  ],
  statuses,
);
register(["reasoning_effort", "CodexReasoningEffort"], effort);

export function getBuilderEnumLabels(field?: string) {
  return field ? enumFields.get(field) : undefined;
}
