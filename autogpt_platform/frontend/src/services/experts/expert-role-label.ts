import type { Locale } from "@/lib/i18n/locale";

const ROLE_LABELS: Record<string, string> = {
  "SEO & Content": "SEO Content Manager",
  "Social & Content Repurposing": "Social Media Manager",
  "Market & Competitor Intelligence": "Market Research Analyst",
  "Email & Lifecycle": "Email Marketing Manager",
  "Finance, Invoicing & Bookkeeping": "Bookkeeper",
  "Finance, Fundraising & Investor Relations": "Investor Relations Manager",
  "Research, Data & KPI Analysis": "Data Analyst",
  Sales: "Sales Development Rep",
  "Dependency & Security Hygiene": "Application Security Engineer",
  "Customer Success & Retention": "Customer Success Manager",
  "Deal Desk & Proposal Support": "Deal Desk Manager",
  Ops: "Executive Assistant",
  "Recruiting & Hiring": "Recruiter",
  "Vendor & Procurement": "Procurement Specialist",
  "Contracts (Non-Advisory)": "Contract Manager",
  "Social Media": "Social Media Manager",
};

const CHINESE_ROLE_LABELS: Readonly<Record<string, string>> = {
  "Head of AI": "AI 负责人",
  "Your personal Head of AI": "你的专属 AI 负责人",
  "AI Expert": "AI 专家",
  "SEO Content Manager": "SEO 内容经理",
  "Social Media Manager": "社交媒体经理",
  "Market Research Analyst": "市场研究分析师",
  "Email Marketing Manager": "邮件营销经理",
  Bookkeeper: "记账员",
  "Investor Relations Manager": "投资者关系经理",
  "Data Analyst": "数据分析师",
  "Sales Development Rep": "销售开发代表",
  "Application Security Engineer": "应用安全工程师",
  "Customer Success Manager": "客户成功经理",
  "Deal Desk Manager": "交易支持经理",
  "Executive Assistant": "行政助理",
  Recruiter: "招聘专员",
  "Procurement Specialist": "采购专员",
  "Contract Manager": "合同经理",
  "QA Engineer": "质量保证工程师",
  "Quality Assurance Engineer": "质量保证工程师",
};

export function getExpertRoleLabel(
  role: string,
  locale: Locale = "en",
): string {
  const label = ROLE_LABELS[role] ?? role;
  return locale === "zh-CN" ? (CHINESE_ROLE_LABELS[label] ?? label) : label;
}
