import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const toast = vi.fn();
vi.mock("@/components/molecules/Toast/use-toast", () => ({
  toast: (...args: unknown[]) => toast(...args),
}));

import { ShareLinkButton } from "../ShareLinkButton";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

function mockClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("ShareLinkButton", () => {
  afterEach(() => {
    toast.mockClear();
  });

  it("copies the absolute URL and confirms with a toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    render(<ShareLinkButton url="/marketplace/agent/creator/test-agent" />);
    fireEvent.click(screen.getByTestId("copy-share-link-button"));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/marketplace/agent/creator/test-agent`,
      ),
    );
    expect(toast).toHaveBeenCalledWith({ title: "Link copied to clipboard" });
    expect(await screen.findByText("Copied")).toBeDefined();
  });

  it("shows a destructive toast when copying fails", async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error("denied")));

    render(<ShareLinkButton url="/marketplace/agent/creator/test-agent" />);
    fireEvent.click(screen.getByTestId("copy-share-link-button"));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({
        title: "Couldn't copy link",
        variant: "destructive",
      }),
    );
  });

  it("localizes the copied state without changing the share URL", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    try {
      render(
        <LanguageProvider>
          <ShareLinkButton url="/marketplace/agent/creator/Original" />
        </LanguageProvider>,
      );
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "复制分享链接" }));
      });
      expect(screen.getByRole("button", { name: "已复制" })).toBeDefined();
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/marketplace/agent/creator/Original`,
      );
      act(() => vi.runAllTimers());
    } finally {
      vi.useRealTimers();
    }
  });
});
