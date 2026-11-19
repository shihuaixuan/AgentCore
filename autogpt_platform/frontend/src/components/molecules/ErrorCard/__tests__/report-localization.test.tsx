import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { expect, it, vi } from "vitest";
import { ErrorCard } from "../ErrorCard";

const notice = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { success: notice, error: notice } }));
vi.mock("@sentry/nextjs", () => ({
  withScope: (
    callback: (scope: { setTag: () => void; setContext: () => void }) => void,
  ) => callback({ setTag() {}, setContext() {} }),
  captureException: vi.fn(),
}));

it("localizes error-report feedback and retains raw diagnostics", async () => {
  render(
    <LanguageProvider>
      <ErrorCard responseError={{ message: "Raw backend diagnostic" }} />
    </LanguageProvider>,
  );
  expect(screen.getByText("Raw backend diagnostic")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "报告错误" }));
  await waitFor(() =>
    expect(notice).toHaveBeenCalledWith(
      "错误已成功报告",
      expect.objectContaining({
        description: "感谢你帮助改进产品！我们已通知相关团队。",
      }),
    ),
  );
});
