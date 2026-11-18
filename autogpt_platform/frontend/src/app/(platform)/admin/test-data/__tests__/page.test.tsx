import { render, screen } from "@/tests/integrations/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import * as testDataHelpers from "../helpers";

// The shared next/navigation mock has no notFound(); re-declare it here with
// the same router surface plus the export this page depends on.
const notFoundMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/admin/test-data",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: () => {
    notFoundMock();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// Bypass server-side admin auth wrapper.
vi.mock("@/lib/withRoleAccess", () => ({
  withRoleAccess: () =>
    Promise.resolve((Component: React.ComponentType) =>
      Promise.resolve(Component),
    ),
}));

// The button owns the mutation hook; stub it so the page test stays focused on
// the dashboard layout.
vi.mock("../components/GenerateTestDataButton", () => ({
  GenerateTestDataButton: () => (
    <button type="button">Generate Test Data</button>
  ),
}));

import TestDataDashboardPage from "../page";

async function renderDashboard() {
  const dashboard = await TestDataDashboardPage();
  const Component = dashboard.type as () => Promise<React.ReactElement>;
  render(await Component());
}

describe("TestDataDashboardPage", () => {
  beforeEach(async () => {
    const store = await cookies();
    vi.spyOn(store, "get").mockReturnValue({
      name: LOCALE_COOKIE_NAME,
      value: "en",
    });
    vi.mocked(cookies).mockResolvedValue(store);
    vi.spyOn(testDataHelpers, "isTestDataSurfaceEnabled").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    notFoundMock.mockClear();
  });

  it("404s outside a local stack instead of rendering a dead-end page", async () => {
    vi.spyOn(testDataHelpers, "isTestDataSurfaceEnabled").mockReturnValue(
      false,
    );

    await expect(TestDataDashboardPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders the dashboard heading and script descriptions", async () => {
    await renderDashboard();

    expect(screen.getByText("测试数据生成")).toBeDefined();
    expect(screen.getByText("可用脚本类型：")).toBeDefined();
    expect(screen.getByText(/E2E 测试数据：/)).toBeDefined();
    expect(screen.getByText(/完整测试数据：/)).toBeDefined();
    expect(screen.getByText("会创建哪些数据？")).toBeDefined();
  });

  it("renders the generate action", async () => {
    await renderDashboard();

    expect(
      screen.getByRole("button", { name: "Generate Test Data" }),
    ).toBeDefined();
  });
});
