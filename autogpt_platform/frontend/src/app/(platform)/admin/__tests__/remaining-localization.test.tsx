import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { render, screen } from "@/tests/integrations/test-utils";
import { describe, expect, test } from "vitest";
import { PlatformBadge } from "../bots/components/PlatformBadge";
import { AdminSkillSubmissionFiles } from "../marketplace/components/AdminSkillSubmissionFiles";

const files = [
  {
    path: "references/Original Guide.md",
    mime_type: "text/markdown",
    size_bytes: 1024,
    is_executable: false,
  },
  {
    path: "scripts/check.sh",
    mime_type: "application/x-sh",
    size_bytes: 100,
    is_executable: true,
  },
];

describe.each([
  {
    locale: "zh-CN" as Locale,
    count: "2 个文件",
    single: "1 个文件",
    icon: "Discord 图标",
  },
  {
    locale: "en" as Locale,
    count: "2 files",
    single: "1 file",
    icon: "Discord icon",
  },
])("$locale admin accessible copy", ({ locale, count, single, icon }) => {
  test("localizes package counts and platform alt text without changing identities", () => {
    render(
      <LanguageProvider initialLocale={locale}>
        <PlatformBadge platform="DISCORD" />
        <AdminSkillSubmissionFiles versionId="version-raw" files={files} />
        <AdminSkillSubmissionFiles
          versionId="version-single"
          files={files.slice(0, 1)}
        />
      </LanguageProvider>,
    );

    expect(
      screen.getByRole("img", { name: icon }).getAttribute("src"),
    ).toContain("discord.png");
    expect(screen.getByText("Discord")).toBeDefined();
    expect(
      screen.getByRole("button", { name: count }).getAttribute("aria-expanded"),
    ).toBe("false");
    expect(screen.getByRole("button", { name: single })).toBeDefined();
  });
});

test("keeps English package counts outside the language provider", () => {
  render(<AdminSkillSubmissionFiles versionId="version-raw" files={files} />);
  expect(screen.getByRole("button", { name: "2 files" })).toBeDefined();
});
