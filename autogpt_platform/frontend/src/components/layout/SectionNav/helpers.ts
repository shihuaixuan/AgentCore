const LABELS: Record<string, string> = {
  Profile: "个人资料",
  Account: "账户",
  Billing: "账单",
  Integrations: "集成",
  "AutoGPT API Keys": "AutoGPT API 密钥",
  "Creator Dashboard": "创作者面板",
  Settings: "设置",
  Memory: "记忆",
  Notifications: "通知",
};

export function sectionLabel(label: string) {
  return LABELS[label] ?? label;
}
