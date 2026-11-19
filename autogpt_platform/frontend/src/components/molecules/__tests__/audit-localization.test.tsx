import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { Calendar } from "@/components/atoms/Calendar/Calendar";
import { AutoGPTLogo } from "@/components/atoms/AutoGPTLogo/AutoGPTLogo";
import { AutoGPTLogoWhite } from "@/components/atoms/AutoGPTLogo/AutoGPTLogoWhite";
import { SkillPackageFileList } from "@/components/contextual/SkillPackage/SkillPackageFileList";
import { ExpertAvatar } from "../ExpertAvatar/ExpertAvatar";
import { CollapseButton, Tree } from "../file-tree";
import type { SkillPackageFile } from "@/app/api/__generated__/models/skillPackageFile";

test("localizes calendar months without changing selected date values", () => {
  const onSelect = vi.fn();
  const { container } = render(
    <LanguageProvider>
      <Calendar
        mode="single"
        defaultMonth={new Date(2026, 10, 1)}
        onSelect={onSelect}
      />
    </LanguageProvider>,
  );
  expect(container.textContent).toContain("十一月");
  fireEvent.click(screen.getByRole("button", { name: /2026年11月18日/ }));
  expect(onSelect.mock.calls[0][0]).toEqual(new Date(2026, 10, 18));
});

test("localizes shared image defaults while preserving identity names", () => {
  render(
    <LanguageProvider>
      <AutoGPTLogo />
      <AutoGPTLogoWhite />
      <ExpertAvatar name="Original Expert" avatarUrl={null} />
    </LanguageProvider>,
  );
  expect(screen.getAllByLabelText("AutoGPT 标志")).toHaveLength(2);
  expect(
    screen.getByRole("img", { name: "Original Expert，AI 专家" }),
  ).toBeDefined();
});

test("localizes file tree toggles without rewriting paths", () => {
  render(
    <LanguageProvider>
      <Tree>
        <div>Original/path.txt</div>
        <CollapseButton elements={[]} />
      </Tree>
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "切换展开状态" }));
  expect(screen.getByText("Original/path.txt")).toBeDefined();
});

test("localizes executable badges without changing the opened package path", () => {
  const onOpenFile = vi.fn();
  const file = {
    path: "scripts/Original.py",
    size_bytes: 128,
    is_executable: true,
  } as SkillPackageFile;
  render(
    <LanguageProvider>
      <SkillPackageFileList files={[file]} onOpenFile={onOpenFile} />
    </LanguageProvider>,
  );
  expect(screen.getByText("可执行")).toBeDefined();
  fireEvent.click(
    screen.getByRole("button", { name: /scripts\/Original\.py/ }),
  );
  expect(onOpenFile).toHaveBeenCalledWith("scripts/Original.py");
});
