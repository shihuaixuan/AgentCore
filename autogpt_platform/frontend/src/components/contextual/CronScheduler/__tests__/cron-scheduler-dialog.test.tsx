import { describe, expect, test, vi } from "vitest";

import { fireEvent, render, screen } from "@/tests/integrations/test-utils";

import { CronExpressionDialog } from "../cron-scheduler-dialog";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

vi.mock("@/lib/hooks/useUserTimezone", () => ({
  useUserTimezone: () => "not-set",
}));

vi.mock("@/lib/timezone-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/timezone-utils")>();
  return {
    ...actual,
    getTimezoneDisplayName: vi.fn(actual.getTimezoneDisplayName),
  };
});

import { getTimezoneDisplayName } from "@/lib/timezone-utils";

describe("CronExpressionDialog", () => {
  test("passes the selected locale to the timezone display helper", () => {
    vi.mocked(getTimezoneDisplayName).mockClear();
    render(
      <LanguageProvider>
        <CronExpressionDialog open setOpen={vi.fn()} onSubmit={vi.fn()} />
      </LanguageProvider>,
    );
    expect(screen.getByText("尚未设置时区。计划将按 UTC 运行。")).toBeDefined();
    expect(getTimezoneDisplayName).toHaveBeenCalledWith("not-set", "zh-CN");
  });

  test("Cancel closes the dialog without submitting", async () => {
    const setOpen = vi.fn();
    const onSubmit = vi.fn();

    render(<CronExpressionDialog open setOpen={setOpen} onSubmit={onSubmit} />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(setOpen).toHaveBeenCalledWith(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
