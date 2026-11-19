import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { InsetHeaderTitle } from "../components/InsetHeaderTitle/InsetHeaderTitle";

vi.mock("next/navigation", () => ({
  usePathname: () => "/artifacts/Report_ID",
}));

it("localizes the files header and retains its English fallback", () => {
  const page = render(
    <LanguageProvider>
      <InsetHeaderTitle />
    </LanguageProvider>,
  );
  expect(screen.getByText("文件")).toBeDefined();
  page.unmount();
  render(<InsetHeaderTitle />);
  expect(screen.getByText("Files")).toBeDefined();
});
