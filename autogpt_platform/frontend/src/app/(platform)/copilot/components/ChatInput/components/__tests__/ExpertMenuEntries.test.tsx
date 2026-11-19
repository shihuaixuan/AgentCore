import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { render, screen } from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ExpertMenuEntries } from "../ExpertMenuEntries";

const casey = {
  id: "expert-casey",
  name: "Casey",
  role: "Code Quality",
  jobTitle: "QA Engineer",
  avatarUrl: "/autogpt-characters/v2.1/expert-casey/neutral/128.webp",
};

it("shows the profession and portrait in the thread menu and selects by expert ID", async () => {
  const onSelect = vi.fn();
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>Experts</DropdownMenuTrigger>
      <DropdownMenuContent>
        <ExpertMenuEntries
          recipient={null}
          options={[casey, { ...casey, id: "expert-sam", name: "Sam" }]}
          onSelect={onSelect}
          isThreadPicker
        />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Experts" }));

  const menu = within(await screen.findByRole("menu"));
  const item = menu.getByRole("menuitem", { name: "QA Engineer (1)" });
  const secondItem = menu.getByRole("menuitem", { name: "QA Engineer (2)" });
  expect(item.textContent).not.toContain("Casey");
  expect(item.querySelector("img")?.getAttribute("src")).toBe(
    "/experts/professional/expert-casey.webp",
  );
  await user.click(secondItem);
  expect(onSelect).toHaveBeenCalledWith("expert-sam");
});

it("keeps Otto as the normal recipient when switching back from an expert", async () => {
  const onSelect = vi.fn();
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>Experts</DropdownMenuTrigger>
      <DropdownMenuContent>
        <ExpertMenuEntries
          recipient={casey}
          options={[casey]}
          onSelect={onSelect}
          isThreadPicker
        />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Experts" }));
  const item = await screen.findByRole("menuitem", { name: /Otto/ });
  expect(item.querySelector("img")?.getAttribute("src")).toMatch(/\/otto[/.]/);
  await user.click(item);
  expect(onSelect).toHaveBeenCalledWith(null);
});
