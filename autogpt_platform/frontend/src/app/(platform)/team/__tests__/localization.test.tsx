import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { ExpertSkillListItem } from "../[expertId]/components/ExpertSkillListItem";
import { TooltipProvider } from "@/components/atoms/Tooltip/BaseTooltip";

function Example({ onRemove }: { onRemove: (name: string) => void }) {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <ExpertSkillListItem
        entry={{ name: "My Custom Skill", skill: null, library: null }}
        onRemove={onRemove}
        learning={{ label: "Original learning history", onDetails: vi.fn() }}
      />
    </>
  );
}

test("translates skill fallback and accessible actions without translating skill data", () => {
  const onRemove = vi.fn();
  render(
    <LanguageProvider>
      <TooltipProvider>
        <Example onRemove={onRemove} />
      </TooltipProvider>
    </LanguageProvider>,
  );
  expect(screen.getByText("技能详情不可用。")).toBeDefined();
  expect(screen.getByText("My Custom Skill")).toBeDefined();
  expect(screen.getByText("Original learning history")).toBeDefined();
  expect(
    screen.getByRole("button", { name: "My Custom Skill 的学习详情" }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "移除 My Custom Skill" }));
  expect(onRemove).toHaveBeenCalledWith("My Custom Skill");
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByText("Skill details unavailable.")).toBeDefined();
  expect(
    screen.getByRole("button", { name: "Remove My Custom Skill" }),
  ).toBeDefined();
});

test("keeps English skill actions outside a provider", () => {
  render(
    <TooltipProvider>
      <ExpertSkillListItem
        entry={{ name: "Original", skill: null, library: null }}
        onRemove={vi.fn()}
      />
    </TooltipProvider>,
  );
  expect(screen.getByRole("button", { name: "Remove Original" })).toBeDefined();
});
