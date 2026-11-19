import { expect, test, vi } from "vitest";
import {
  getGetV2ReadMarketplaceSkillFileMockHandler200,
  getGetV2ReadMarketplaceSkillFileMockHandler404,
  getGetV2ReadMarketplaceSkillFileMockHandler413,
  getGetV2ReadMarketplaceSkillFileMockHandler415,
} from "@/app/api/__generated__/endpoints/store/store.msw";
import { getGetV2AdminReadSkillSubmissionFileMockHandler415 } from "@/app/api/__generated__/endpoints/admin/admin.msw";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import { render, screen } from "@/tests/integrations/test-utils";
import { SkillFileViewer } from "../SkillFileViewer";

test.each([
  [getGetV2ReadMarketplaceSkillFileMockHandler413, "文件过大，无法在此预览。"],
  [
    getGetV2ReadMarketplaceSkillFileMockHandler415,
    "此文件不是文本文件，无法预览。",
  ],
  [getGetV2ReadMarketplaceSkillFileMockHandler404, "无法加载此文件。"],
] as const)(
  "localizes marketplace preview refusals: %s",
  async (handler, expected) => {
    server.use(handler());
    render(
      <LanguageProvider>
        <SkillFileViewer
          source={{ kind: "listing", slug: "Original-skill" }}
          path="Original.txt"
          onClose={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(await screen.findByText(expected)).toBeDefined();
    expect(
      screen.getByRole("dialog").getAttribute("aria-labelledby"),
    ).toBeTruthy();
    expect(screen.getByText("Original.txt")).toBeDefined();
  },
);

test("localizes submission refusals using the same selected locale", async () => {
  server.use(getGetV2AdminReadSkillSubmissionFileMockHandler415());
  render(
    <LanguageProvider>
      <SkillFileViewer
        source={{ kind: "submission", versionId: "Original-version" }}
        path="Original.bin"
        onClose={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(
    await screen.findByText("此文件不是文本文件，无法预览。"),
  ).toBeDefined();
});

test("preserves raw skill file contents under the Chinese locale", async () => {
  server.use(
    getGetV2ReadMarketplaceSkillFileMockHandler200(
      "Original file: Couldn't load this file.",
    ),
  );
  render(
    <LanguageProvider>
      <SkillFileViewer
        source={{ kind: "listing", slug: "Original-skill" }}
        path="Original.txt"
        onClose={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(
    await screen.findByText("Original file: Couldn't load this file."),
  ).toBeDefined();
});

test("retains English preview refusals when English is selected", async () => {
  server.use(getGetV2ReadMarketplaceSkillFileMockHandler413());
  render(
    <LanguageProvider initialLocale="en">
      <SkillFileViewer
        source={{ kind: "listing", slug: "Original-skill" }}
        path="Original.txt"
        onClose={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(
    await screen.findByText("This file is too large to preview here."),
  ).toBeDefined();
});
