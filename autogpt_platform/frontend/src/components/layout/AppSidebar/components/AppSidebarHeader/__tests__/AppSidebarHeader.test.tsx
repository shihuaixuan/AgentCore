import { render, screen } from "@/tests/integrations/test-utils";
import { SidebarProvider } from "@/components/molecules/Sidebar/Sidebar";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppSidebarHeader } from "../AppSidebarHeader";

function renderHeader() {
  return render(
    <SidebarProvider>
      <AppSidebarHeader />
    </SidebarProvider>,
  );
}

describe("AppSidebarHeader", () => {
  it("renders an icon-only home link pointing at /home", () => {
    renderHeader();
    const homeLink = screen.getByRole("link", { name: "Duanmu Software" });
    expect(homeLink.getAttribute("href")).toBe("/home");
    expect(homeLink.querySelector("img")?.getAttribute("src")).toBe(
      "/duanmu-icon.png",
    );
    expect(homeLink.textContent).toBe("");
  });

  it("shows the 'Collapse sidebar' control while expanded", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeDefined();
  });

  it("toggles to 'Expand sidebar' after collapsing", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(
      await screen.findByRole("button", { name: "Expand sidebar" }),
    ).toBeDefined();
  });

  it("keeps the collapsed logo and toggle in the same size-8 slot", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    const homeLink = await screen.findByRole("link", {
      name: "Duanmu Software",
    });
    const expandButton = await screen.findByRole("button", {
      name: "Expand sidebar",
      hidden: true,
    });

    expect(homeLink.className).toContain("size-8");
    expect(homeLink.querySelector("img")?.getAttribute("src")).toBe(
      "/duanmu-icon.png",
    );
    expect(expandButton.className).toContain("size-8");
    expect(homeLink.parentElement).toBe(expandButton.parentElement);
    expect(homeLink.parentElement?.className).toContain("size-8");
  });
});
