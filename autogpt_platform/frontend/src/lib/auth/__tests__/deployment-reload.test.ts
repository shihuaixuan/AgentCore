import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@/components/molecules/Toast/use-toast", () => ({ toast }));
vi.mock("@/lib/i18n/LanguageProvider", async () =>
  vi.importActual("@/lib/i18n/LanguageProvider"),
);
vi.mock("@/services/environment", () => ({
  environment: { isServerSide: () => false },
}));

const nativeSessionStorage = Object.getOwnPropertyDescriptor(
  window,
  "sessionStorage",
);

// Each call is a fresh page load: module state resets, sessionStorage stays.
async function loadPageAndHitDeploySkew(reload: () => void) {
  vi.resetModules();
  const { reloadForNewDeployment } = await import("../deployment-reload");
  return reloadForNewDeployment(reload);
}

function blockSessionStorage() {
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    get() {
      throw new DOMException("The operation is insecure.", "SecurityError");
    },
  });
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  if (nativeSessionStorage) {
    Object.defineProperty(window, "sessionStorage", nativeSessionStorage);
  }
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("reloading onto a new deployment", () => {
  it("reloads once, then asks the user to refresh instead of looping", async () => {
    const reload = vi.fn();

    expect(await loadPageAndHitDeploySkew(reload)).toBe(true);
    expect(await loadPageAndHitDeploySkew(reload)).toBe(false);
    expect(await loadPageAndHitDeploySkew(reload)).toBe(false);

    expect(reload).toHaveBeenCalledTimes(1);
    const [{ title }] = toast.mock.calls.at(-1) as [{ title: ReactElement }];
    render(createElement(LanguageProvider, null, title));
    expect(screen.getByText("AutoGPT 有新版本可用")).toBeDefined();
  });

  it("asks with a button that refreshes the page", async () => {
    const reload = vi.fn();

    await loadPageAndHitDeploySkew(reload);
    await loadPageAndHitDeploySkew(reload);
    const [{ action }] = toast.mock.calls.at(-1) as [{ action: ReactElement }];
    render(action);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("reloads again for a later deployment", async () => {
    vi.useFakeTimers();
    const reload = vi.fn();

    await loadPageAndHitDeploySkew(reload);
    vi.advanceTimersByTime(61_000);
    await loadPageAndHitDeploySkew(reload);

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("never reloads again once a skew has come back on the reloaded page", async () => {
    vi.useFakeTimers();
    const reload = vi.fn();

    await loadPageAndHitDeploySkew(reload);
    // The reloaded page is rejected too, so reloading can't fix it...
    expect(await loadPageAndHitDeploySkew(reload)).toBe(false);
    // ...and a retry that comes in after the cooldown mustn't try again.
    vi.advanceTimersByTime(61_000);
    expect(await loadPageAndHitDeploySkew(reload)).toBe(false);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalled();
  });

  it("never reloads when sessionStorage is blocked, since the guard can't survive one", async () => {
    blockSessionStorage();
    const reload = vi.fn();

    for (let load = 0; load < 3; load++) {
      expect(await loadPageAndHitDeploySkew(reload)).toBe(false);
    }

    expect(reload).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalled();
  });
});
