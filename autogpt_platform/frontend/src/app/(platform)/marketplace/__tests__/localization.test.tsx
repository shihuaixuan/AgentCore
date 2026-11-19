import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { ShelfMoreButton } from "../components/Shelf/ShelfMoreButton";
import { SortDropdown } from "../search/components/MainSearchResultPage/components/SortDropdown/SortDropdown";
import userEvent from "@testing-library/user-event";

function Example() {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <ShelfMoreButton
        isExpanded={false}
        count={1234}
        noun="workflows"
        onToggle={vi.fn()}
      />
    </>
  );
}

test("translates complete shelf count templates and supports English switching", () => {
  render(
    <LanguageProvider>
      <Example />
    </LanguageProvider>,
  );
  expect(
    screen
      .getByRole("button", { name: "加载全部 1,234 个工作流" })
      .getAttribute("aria-expanded"),
  ).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByRole("button", { name: "Load all 1,234 workflows" }),
  ).toBeDefined();
});

test("translates expanded shelves without promising all results for a capped list", () => {
  const view = render(
    <LanguageProvider>
      <ShelfMoreButton
        isExpanded={false}
        isAll={false}
        count={5}
        noun="skills"
        onToggle={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "加载 5 项技能" })).toBeDefined();
  view.rerender(
    <LanguageProvider>
      <ShelfMoreButton isExpanded count={5} noun="skills" onToggle={vi.fn()} />
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("button", { name: "收起" }).getAttribute("aria-expanded"),
  ).toBe("true");
});

test("translates sort options without changing their API values", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn();
  render(
    <LanguageProvider>
      <SortDropdown onSort={onSort} />
    </LanguageProvider>,
  );
  await user.click(
    screen.getByRole("button", { name: "排序方式 运行次数最多" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "评分最高" }));
  expect(onSort).toHaveBeenCalledWith("rating");
});

test("keeps English shelf fallback outside a provider", () => {
  render(
    <ShelfMoreButton isExpanded count={5} noun="skills" onToggle={vi.fn()} />,
  );
  expect(screen.getByRole("button", { name: "Show fewer" })).toBeDefined();
});
