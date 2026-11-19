import { render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Expert } from "@/app/api/__generated__/models/expert";
import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { expect, it } from "vitest";
import { getLastRunLabel } from "../helpers";
import { ExpertFileRow } from "../[expertId]/components/ExpertFilesSection/ExpertFileRow";

it("localizes expert file dates without changing filenames or download URLs", () => {
  const file = {
    id: "original-id",
    name: "Original.txt",
    mime_type: "text/plain",
    size_bytes: 12,
    created_at: new Date(Date.now() - 300_000).toISOString(),
  } as unknown as WorkspaceFileItem;
  render(
    <LanguageProvider>
      <ExpertFileRow file={file} />
    </LanguageProvider>,
  );
  expect(screen.getByText(/5 分钟前/)).toBeDefined();
  expect(
    screen.getByRole("link", { name: /Original.txt/ }).getAttribute("href"),
  ).toContain("original-id");
});

it("localizes run outcomes and retains an English fallback", () => {
  const expert = {
    last_run_at: new Date(Date.now() - 300_000),
    last_run_status: "COMPLETED",
  } as Expert;
  expect(getLastRunLabel(expert, "zh-CN")).toBe("上次运行成功：5 分钟前");
  expect(getLastRunLabel(expert)).toContain("Last run succeeded");
});
