import { describe, expect, test } from "vitest";

import { render, screen } from "@/tests/integrations/test-utils";
import { server } from "@/mocks/mock-server";
import { getGetWorkspaceStorageUsageMockHandler } from "@/app/api/__generated__/endpoints/workspace/workspace.msw";
import { StorageUsage } from "../StorageUsage";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

describe("StorageUsage", () => {
  test("localizes quota descriptions and accessible meter labels without changing byte values", async () => {
    server.use(
      getGetWorkspaceStorageUsageMockHandler({
        used_bytes: 2048,
        limit_bytes: 4096,
        used_percent: 50,
        file_count: 1,
        internal_bytes: 1024,
      }),
    );
    render(
      <LanguageProvider initialLocale="zh-CN">
        <StorageUsage />
      </LanguageProvider>,
    );
    expect(
      await screen.findByRole("progressbar", { name: "已使用 50% 的存储空间" }),
    ).toBeDefined();
    expect(screen.getByText("1.0 KB 用于团队技能和工作文件")).toBeDefined();
    expect(screen.getByTestId("storage-usage").textContent).toContain(
      "2.0 KB / 4.0 KB",
    );
  });
  test("names the storage your team's skills and working files use", async () => {
    server.use(
      getGetWorkspaceStorageUsageMockHandler({
        used_bytes: 182_789,
        limit_bytes: 262_144_000,
        used_percent: 0.1,
        file_count: 4,
        internal_bytes: 182_536,
      }),
    );

    render(<StorageUsage />);

    const usage = await screen.findByTestId("storage-usage");
    expect(usage.textContent).toContain("178.5 KB of 250.0 MB");
    expect(
      screen.getByText("178.3 KB is your team's skills and working files"),
    ).toBeDefined();
  });

  test("says nothing extra when every stored file is the user's", async () => {
    server.use(
      getGetWorkspaceStorageUsageMockHandler({
        used_bytes: 2048,
        limit_bytes: 262_144_000,
        used_percent: 0,
        file_count: 1,
        internal_bytes: 0,
      }),
    );

    render(<StorageUsage />);

    await screen.findByTestId("storage-usage");
    expect(screen.queryByText(/skills and working files/)).toBeNull();
  });

  test("says nothing extra when the backend sends no internal share", async () => {
    server.use(
      getGetWorkspaceStorageUsageMockHandler({
        used_bytes: 2048,
        limit_bytes: 262_144_000,
        used_percent: 0,
        file_count: 1,
      }),
    );

    render(<StorageUsage />);

    const usage = await screen.findByTestId("storage-usage");
    expect(usage.textContent).toContain("2.0 KB of 250.0 MB");
    expect(screen.queryByText(/skills and working files/)).toBeNull();
  });
});
