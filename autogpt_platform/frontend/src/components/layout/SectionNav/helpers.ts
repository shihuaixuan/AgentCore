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
  "Admin settings": "管理设置",
  Users: "用户管理",
  "Marketplace Management": "市场管理",
  "User Spending": "用户消费",
  "System Diagnostics": "系统诊断",
  "Platform Costs": "平台成本",
  "Execution Analytics": "执行分析",
  "Bot Analytics": "机器人分析",
  "Block Cost Estimates": "模块成本估算",
  "Memory Inspector": "记忆检查器",
  "Test Data": "测试数据",
  Admin: "管理后台",
};

export function sectionLabel(label: string) {
  return LABELS[label] ?? label;
}
