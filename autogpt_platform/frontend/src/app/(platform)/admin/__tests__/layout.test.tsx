import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render, screen } from "@/tests/integrations/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as testDataHelpers from "../test-data/helpers";
import AdminLayout from "../layout";

const ADMIN_LINKS = [
  { text: "Users", href: "/admin/users" },
  { text: "Marketplace Management", href: "/admin/marketplace" },
  { text: "User Spending", href: "/admin/spending" },
  { text: "System Diagnostics", href: "/admin/diagnostics" },
  { text: "Platform Costs", href: "/admin/platform-costs" },
  { text: "Execution Analytics", href: "/admin/execution-analytics" },
  { text: "Bot Analytics", href: "/admin/bots" },
  { text: "Block Cost Estimates", href: "/admin/block-cost-estimates" },
  { text: "Memory Inspector", href: "/admin/memory" },
  { text: "Admin settings", href: "/admin/settings" },
  { text: "Test Data", href: "/admin/test-data" },
];

const ADMIN_LINK_LABELS_ZH: Record<string, string> = {
  Users: "用户管理",
  "Marketplace Management": "市场管理",
  "User Spending": "用户消费",
  "System Diagnostics": "系统诊断",
  "Platform Costs": "平台成本",
  "Execution Analytics": "执行分析",
  "Bot Analytics": "机器人分析",
  "Block Cost Estimates": "模块成本估算",
  "Memory Inspector": "记忆检查器",
  "Admin settings": "管理设置",
  "Test Data": "测试数据",
};

describe("AdminLayout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders child content", () => {
    render(
      <AdminLayout>
        <div>Test Child</div>
      </AdminLayout>,
    );
    expect(screen.getByText("Test Child")).toBeDefined();
  });

  it("translates admin navigation labels to Chinese", () => {
    vi.spyOn(testDataHelpers, "isTestDataSurfaceEnabled").mockReturnValue(true);
    render(
      <LanguageProvider initialLocale="zh-CN">
        <AdminLayout>
          <div />
        </AdminLayout>
      </LanguageProvider>,
    );

    const links = screen.getAllByRole("link");
    for (const { text, href } of ADMIN_LINKS) {
      const link = links.find(
        (element) => element.getAttribute("href") === href,
      );
      expect(link?.textContent).toContain(ADMIN_LINK_LABELS_ZH[text]);
    }
  });

  it("renders every admin sidebar link with the correct href", () => {
    vi.spyOn(testDataHelpers, "isTestDataSurfaceEnabled").mockReturnValue(true);
    render(
      <AdminLayout>
        <div />
      </AdminLayout>,
    );
    const links = screen.getAllByRole("link");
    for (const { text, href } of ADMIN_LINKS) {
      const link = links.find((el) => el.getAttribute("href") === href);
      expect(link).toBeDefined();
      expect(link?.textContent).toContain(text);
    }
  });

  it("shows the Test Data link on a local stack", () => {
    vi.spyOn(testDataHelpers, "isTestDataSurfaceEnabled").mockReturnValue(true);
    render(
      <AdminLayout>
        <div />
      </AdminLayout>,
    );
    const link = screen
      .getAllByRole("link")
      .find((el) => el.getAttribute("href") === "/admin/test-data");
    expect(link).toBeDefined();
    expect(link?.textContent).toContain("Test Data");
  });

  it("hides the Test Data link outside a local stack", () => {
    vi.spyOn(testDataHelpers, "isTestDataSurfaceEnabled").mockReturnValue(
      false,
    );
    render(
      <AdminLayout>
        <div />
      </AdminLayout>,
    );
    const link = screen
      .getAllByRole("link")
      .find((el) => el.getAttribute("href") === "/admin/test-data");
    expect(link).toBeUndefined();
  });
});
