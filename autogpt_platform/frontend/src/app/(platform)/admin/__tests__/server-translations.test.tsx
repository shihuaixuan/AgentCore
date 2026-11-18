import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { cookies } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getServerUser } from "@/lib/auth/server/getServerUser";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { getServerTranslation } from "@/lib/i18n/server";
import AdminMarketplacePage from "../marketplace/page";
import SpendingDashboardPage from "../spending/page";
import AdminDashboardPage from "../dashboard/page";
import AdminSettingsPage from "../settings/page";
import BotsPage from "../bots/page";
import BlockCostEstimatesDashboardPage from "../block-cost-estimates/page";
import ExecutionAnalyticsPage from "../execution-analytics/page";
import PlatformCostDashboardPage from "../platform-costs/page";
import TestDataDashboardPage from "../test-data/page";
import MemoryDashboardPage from "../memory/page";

vi.mock("@/lib/auth/server/getServerUser", () => ({ getServerUser: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: vi.fn() })),
}));
vi.mock("@sentry/nextjs", () => ({
  withServerActionInstrumentation: (
    _name: string,
    _options: unknown,
    run: () => unknown,
  ) => run(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/i18n/LanguageProvider", () => ({
  useTranslation: () => {
    throw new Error("Attempted to call useTranslation() from the server");
  },
}));

// Client boundaries are not executed by the server renderer.
vi.mock("../marketplace/components/AdminSkillSubmissions", () => ({
  AdminSkillSubmissions: () => null,
}));
vi.mock("../marketplace/components/AdminAgentsDataTable", () => ({
  AdminAgentsDataTable: () => null,
}));
vi.mock("../spending/components/AdminUserGrantHistory", () => ({
  AdminUserGrantHistory: () => null,
}));
vi.mock("../spending/components/ExportCopilotUsageButton", () => ({
  ExportCopilotUsageButton: () => null,
}));
vi.mock("../spending/components/ExportCreditTransactionsButton", () => ({
  ExportCreditTransactionsButton: () => null,
}));
vi.mock("../bots/components/BotsContent", () => ({ BotsContent: () => null }));
vi.mock("../block-cost-estimates/components/BlockCostEstimatesContent", () => ({
  BlockCostEstimatesContent: () => null,
}));
vi.mock("../execution-analytics/components/ExecutionAnalyticsForm", () => ({
  ExecutionAnalyticsForm: () => null,
}));
vi.mock("../platform-costs/components/PlatformCostContent", () => ({
  PlatformCostContent: () => null,
}));
vi.mock("../test-data/components/GenerateTestDataButton", () => ({
  GenerateTestDataButton: () => null,
}));
vi.mock("../memory/components/MemoryVisualizer", () => ({
  MemoryVisualizer: () => null,
}));
vi.mock("../marketplace/components/SearchFilterForm", () => ({
  SearchAndFilterAdminMarketplace: () => null,
}));
vi.mock("../marketplace/components/ExpandleRow", () => ({
  ExpandableRow: () => null,
}));
vi.mock("../spending/components/SearchAndFilterAdminSpending", () => ({
  SearchAndFilterAdminSpending: () => null,
}));
vi.mock("../spending/components/AddMoneyButton", () => ({
  AdminAddMoneyButton: () => null,
}));
vi.mock("../spending/components/RateLimitModal", () => ({
  RateLimitModal: () => null,
}));
vi.mock("@/components/molecules/PaginationControls/PaginationControls", () => ({
  PaginationControls: () => null,
}));
vi.mock("../marketplace/actions", () => ({
  getAdminListingsWithVersions: vi.fn(async () => ({
    listings: [],
    pagination: { total_pages: 1 },
  })),
}));
vi.mock("../spending/actions", () => ({
  getUsersTransactionHistory: vi.fn(async () => ({
    history: [],
    pagination: { total_pages: 1 },
  })),
}));

const pages = [
  {
    name: "marketplace",
    load: () => AdminMarketplacePage({ searchParams: Promise.resolve({}) }),
    en: "Marketplace Management",
    zh: "市场管理",
  },
  {
    name: "spending",
    load: () => SpendingDashboardPage({ searchParams: Promise.resolve({}) }),
    en: "User Spending",
    zh: "用户消费",
  },
  {
    name: "dashboard",
    load: AdminDashboardPage,
    en: "Admin Dashboard",
    zh: "管理后台",
  },
  {
    name: "settings",
    load: AdminSettingsPage,
    en: "Admin Settings",
    zh: "管理设置",
  },
  { name: "bots", load: BotsPage, en: "Bot Analytics", zh: "机器人分析" },
  {
    name: "block costs",
    load: BlockCostEstimatesDashboardPage,
    en: "Block Cost Estimates",
    zh: "模块成本估算",
  },
  {
    name: "execution analytics",
    load: ExecutionAnalyticsPage,
    en: "Execution Analytics",
    zh: "执行分析",
  },
  {
    name: "platform costs",
    load: () =>
      PlatformCostDashboardPage({ searchParams: Promise.resolve({}) }),
    en: "Platform Costs",
    zh: "平台成本",
  },
  {
    name: "test data",
    load: TestDataDashboardPage,
    en: "Test Data Generation",
    zh: "测试数据生成",
  },
  {
    name: "memory",
    load: MemoryDashboardPage,
    en: "Memory Inspector",
    zh: "记忆检查器",
  },
];

let locale: string | undefined;

beforeEach(async () => {
  locale = undefined;
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", "local");
  vi.stubEnv("NEXT_PUBLIC_BEHAVE_AS", "LOCAL");
  const store = await cookies();
  vi.spyOn(store, "get").mockImplementation((...args) => {
    const name = typeof args[0] === "string" ? args[0] : args[0].name;
    return name === LOCALE_COOKIE_NAME && locale !== undefined
      ? { name, value: locale }
      : undefined;
  });
  vi.mocked(cookies).mockResolvedValue(store);
  vi.mocked(getServerUser).mockResolvedValue({
    user: {
      id: "admin-1",
      email: "admin@example.com",
      role: "admin",
      user_metadata: {},
    },
    role: "admin",
    error: null,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function renderDashboard(load: () => Promise<ReactElement>) {
  const dashboard = await load();
  const Component = dashboard.type as (
    props: unknown,
  ) => ReactNode | Promise<ReactNode>;
  render(await Component(dashboard.props));
}

it("uses Chinese for server translations regardless of the saved locale", async () => {
  locale = "en";
  const english = await getServerTranslation();
  locale = "zh-CN";
  const chinese = await getServerTranslation();
  expect(english.t("Name", "名称")).toBe("名称");
  expect(chinese.t("Name", "名称")).toBe("名称");
});

describe.each(pages)("$name server translations", ({ load, zh }) => {
  it.each([
    { cookie: undefined, language: "zh" },
    { cookie: "invalid", language: "zh" },
    { cookie: "zh-CN", language: "zh" },
    { cookie: "en", language: "zh" },
  ])("renders $language for locale cookie $cookie", async ({ cookie }) => {
    locale = cookie;
    await renderDashboard(load);
    expect(
      screen.getByRole("heading", {
        name: zh,
        level: 1,
      }),
    ).toBeDefined();
  });

  it.each(["user", null])("rejects role %s before rendering", async (role) => {
    vi.mocked(getServerUser).mockResolvedValue({
      user: role
        ? { id: "user-1", email: "user@example.com", user_metadata: {} }
        : null,
      role,
      error: null,
    });
    await expect(load()).rejects.toThrow("REDIRECT:/unauthorized");
  });
});

describe.each([
  {
    name: "marketplace table",
    load: async () => {
      const { AdminAgentsDataTable } = await vi.importActual<
        typeof import("../marketplace/components/AdminAgentsDataTable")
      >("../marketplace/components/AdminAgentsDataTable");
      return AdminAgentsDataTable({});
    },
    en: "No submissions found",
    zh: "没有找到提交内容",
    headerEn: "Creator",
    headerZh: "创建者",
  },
  {
    name: "spending table",
    load: async () => {
      const { AdminUserGrantHistory } = await vi.importActual<
        typeof import("../spending/components/AdminUserGrantHistory")
      >("../spending/components/AdminUserGrantHistory");
      return AdminUserGrantHistory({});
    },
    en: "No transactions found",
    zh: "没有找到交易记录",
    headerEn: "Starting Balance",
    headerZh: "起始余额",
  },
])("$name server translations", ({ load, zh, headerZh }) => {
  it.each([undefined, "en"])(
    "translates headers and empty state for %s",
    async (cookie) => {
      locale = cookie;
      render(await load());
      expect(screen.getByText(zh)).toBeDefined();
      expect(
        screen.getByRole("columnheader", {
          name: headerZh,
        }),
      ).toBeDefined();
    },
  );
});
