import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import {
  Sidebar,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "./Sidebar";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));

test("localizes sidebar toggles and mobile dialog metadata, not its contents", async () => {
  render(
    <LanguageProvider>
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <div>My Loading chat</div>
        </Sidebar>
        <SidebarRail />
      </SidebarProvider>
    </LanguageProvider>,
  );
  fireEvent.click(screen.getAllByRole("button", { name: "切换侧边栏" })[0]);
  const dialog = await screen.findByRole("dialog", { name: "侧边栏" });
  expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
  expect(screen.getByText("显示移动端侧边栏。")).toBeDefined();
  expect(screen.getByText("My Loading chat")).toBeDefined();
});
