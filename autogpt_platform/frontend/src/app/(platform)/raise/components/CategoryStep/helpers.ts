import { ExpertAvatarRequestCategory } from "@/app/api/__generated__/models/expertAvatarRequestCategory";
import { EXPERT_PALETTE } from "@/components/molecules/ExpertAvatar/helpers";
import type { Locale } from "@/lib/i18n/locale";

interface CategoryDetails {
  label: string;
  color: string;
  role: Record<Locale, string>;
  jobTitleSuggestions: string[];
}

const CATEGORY_DETAILS: Record<ExpertAvatarRequestCategory, CategoryDetails> = {
  general: {
    label: "General",
    color: "amber-300",
    role: { en: "Assistant", "zh-CN": "助理" },
    jobTitleSuggestions: ["Executive Assistant", "Personal Assistant"],
  },
  marketing: {
    color: "orange-300",
    label: "Marketing",
    role: { en: "Marketer", "zh-CN": "营销专员" },
    jobTitleSuggestions: [
      "Marketing Manager",
      "Growth Marketer",
      "Content Marketer",
    ],
  },
  sales: {
    color: "amber-300",
    label: "Sales",
    role: { en: "Sales", "zh-CN": "销售" },
    jobTitleSuggestions: [
      "Sales Development Rep",
      "Account Executive",
      "Sales Manager",
    ],
  },
  finance: {
    color: "green-300",
    label: "Finance",
    role: { en: "Analyst", "zh-CN": "分析师" },
    jobTitleSuggestions: [
      "Financial Analyst",
      "Data Analyst",
      "Business Analyst",
    ],
  },
  support: {
    color: "rose-300",
    label: "Support",
    role: { en: "Support", "zh-CN": "客户支持" },
    jobTitleSuggestions: [
      "Support Specialist",
      "Customer Success Manager",
      "Support Engineer",
    ],
  },
  operations: {
    color: "sky-300",
    label: "Operations",
    role: { en: "Operations", "zh-CN": "运营" },
    jobTitleSuggestions: [
      "Operations Manager",
      "Executive Assistant",
      "Recruiter",
    ],
  },
  research: {
    color: "lime-300",
    label: "Research",
    role: { en: "Researcher", "zh-CN": "研究员" },
    jobTitleSuggestions: [
      "Research Analyst",
      "Market Researcher",
      "UX Researcher",
    ],
  },
  content: {
    color: "amber-300",
    label: "Content",
    role: { en: "Writer", "zh-CN": "作家" },
    jobTitleSuggestions: ["Content Writer", "Copywriter", "Technical Writer"],
  },
  development: {
    color: "blue-300",
    label: "Development",
    role: { en: "Developer", "zh-CN": "开发者" },
    jobTitleSuggestions: [
      "Software Engineer",
      "Full-Stack Developer",
      "DevOps Engineer",
    ],
  },
};

// The role ids a `/raise?role=` link can carry; keep in step with the
// backend's RAISE_ROLES in onboarding_dump/recommend_experts.py.
const ROLE_CATEGORIES = new Map<string, ExpertAvatarRequestCategory>([
  ["marketer", "marketing"],
  ["sales", "sales"],
  ["developer", "development"],
  ["researcher", "research"],
  ["writer", "content"],
  ["analyst", "finance"],
  ["recruiter", "operations"],
  ["support", "support"],
  ["operations", "operations"],
]);

export interface CategoryOption {
  id: ExpertAvatarRequestCategory;
  label: string;
  hex: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = Object.values(
  ExpertAvatarRequestCategory,
)
  .filter((id) => id !== "general")
  .map((id) => ({
    id,
    label: CATEGORY_DETAILS[id].label,
    hex: EXPERT_PALETTE[id].hex,
  }));

export function categoryOptionsForSelection(
  selected: ExpertAvatarRequestCategory | null,
) {
  if (!selected) return CATEGORY_OPTIONS;
  return CATEGORY_OPTIONS.filter((option) => option.id === selected);
}

/** The wizard color a category answers for, used from the first beat onwards. */
export function colorForCategory(category: ExpertAvatarRequestCategory) {
  return CATEGORY_DETAILS[category].color;
}

export function categoryForRole(role: string) {
  return ROLE_CATEGORIES.get(role) ?? null;
}

export function roleFor(
  category: ExpertAvatarRequestCategory | null,
  locale: Locale = "en",
) {
  return category ? CATEGORY_DETAILS[category].role[locale] : null;
}

export function jobTitleSuggestionsFor(
  category: ExpertAvatarRequestCategory | null,
) {
  return category ? CATEGORY_DETAILS[category].jobTitleSuggestions : [];
}
