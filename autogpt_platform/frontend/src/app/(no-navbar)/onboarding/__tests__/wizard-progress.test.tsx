import { act, cleanup, renderHook } from "@testing-library/react";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readLocalProgress, writeLocalProgress } from "../progress";
import { PAYWALL_LAST_STEPS, useOnboardingWizardStore } from "../store";
import { useWizardProgress } from "../useWizardProgress";
import { makeProgress as makeBaseProgress } from "./progress-fixture";

const { getState, patchState } = vi.hoisted(() => ({
  getState: vi.fn(),
  patchState: vi.fn(),
}));
vi.mock("@/app/api/__generated__/endpoints/onboarding/onboarding", () => ({
  getV1OnboardingState: getState,
  patchV1UpdateOnboardingState: patchState,
}));
let params = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => params,
}));

function makeProgress(overrides: Parameters<typeof makeBaseProgress>[0] = {}) {
  const draft = makeBaseProgress(overrides);
  return {
    ...draft,
    completedSteps: [
      "team",
      "autopilot",
      ...draft.completedSteps,
    ] as typeof draft.completedSteps,
  };
}
function response(progress = makeProgress(), revision = 4, userID = "u1") {
  return {
    status: 200,
    data: {
      userId: userID,
      completedSteps: [],
      wizardProgress: progress,
      wizardRevision: revision,
    },
  };
}

function mountWizard(userID = "u1") {
  return renderHook(
    ({ userID }) =>
      useWizardProgress({
        userID,
        ready: true,
        steps: PAYWALL_LAST_STEPS,
      }),
    { initialProps: { userID } },
  );
}

function mountLocalizedWizard() {
  return renderHook(
    () => ({
      ...useWizardProgress({
        userID: "u1",
        ready: true,
        steps: PAYWALL_LAST_STEPS,
      }),
      setLocale: useTranslation().setLocale,
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <LanguageProvider initialLocale="zh-CN">{children}</LanguageProvider>
      ),
    },
  );
}

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  params = new URLSearchParams();
  localStorage.clear();
  useOnboardingWizardStore.getState().reset();
  getState.mockResolvedValue(response());
  patchState.mockImplementation(({ wizardRevision, wizardUserId }) =>
    Promise.resolve({
      status: 200,
      data: { userId: wizardUserId, wizardRevision: wizardRevision + 1 },
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it.each([
  [
    "conflict",
    "首次使用向导已在其他会话中更新。请重新加载最新进度以继续，此设备上未保存的回答将被替换。",
    "Onboarding was updated in another session. Reload its latest progress to continue. This device's unsaved answers will be replaced.",
  ],
  [
    "account",
    "登录账户已更改。请重新加载页面以恢复该账户的进度。",
    "Your signed-in account changed. Reload the page to restore its progress.",
  ],
  [
    "load",
    "无法恢复首次使用向导进度，请重试。",
    "We couldn't restore your onboarding progress. Please retry.",
  ],
  [
    "offline",
    "此设备上可使用已保存的进度。连接恢复后，更改将自动同步。",
    "Your saved progress is available on this device. Changes will sync when the connection returns.",
  ],
])(
  "localizes the %s progress message without reloading or saving on a language change",
  async (kind, chinese, english) => {
    if (kind === "conflict")
      writeLocalProgress("u1", makeProgress({ role: "Stale" }), true, 3);
    if (kind === "account")
      getState.mockResolvedValue(response(makeProgress(), 4, "u2"));
    if (kind === "offline") writeLocalProgress("u1", makeProgress(), false, 4);
    if (kind === "load" || kind === "offline")
      getState.mockRejectedValue(new Error("Offline"));
    const { result } = mountLocalizedWizard();
    await settle();
    expect(result.current.error).toBe(chinese);
    act(() => result.current.setLocale("en"));
    await settle();
    expect(result.current.error).toBe(english);
    expect(getState).toHaveBeenCalledOnce();
    expect(patchState).not.toHaveBeenCalled();
  },
);

it("localizes save failures without restarting the saver when the language changes", async () => {
  patchState.mockRejectedValue(new Error("Offline"));
  const { result } = mountLocalizedWizard();
  await settle();
  act(() => useOnboardingWizardStore.getState().setRole("Founder"));
  await settle();
  expect(result.current.error).toBe(
    "无法将进度保存到账户。我们会继续重试，你可以在此继续操作。",
  );
  act(() => result.current.setLocale("en"));
  await settle();
  expect(result.current.error).toBe(
    "We couldn't save your progress to your account. We'll keep retrying; you can continue here.",
  );
  expect(getState).toHaveBeenCalledOnce();
  expect(patchState).toHaveBeenCalledOnce();
});

it("localizes the local-storage warning without changing the pending save", async () => {
  const { result } = mountLocalizedWizard();
  await settle();
  const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("Quota exceeded");
  });
  try {
    act(() => useOnboardingWizardStore.getState().setRole("Founder"));
  } finally {
    setItem.mockRestore();
  }
  expect(result.current.error).toBe(
    "进度尚未保存。请保持此页面打开，我们会继续重试。",
  );
  act(() => result.current.setLocale("en"));
  expect(result.current.error).toBe(
    "Your progress hasn't been saved yet. Please keep this page open while we retry.",
  );
  expect(getState).toHaveBeenCalledOnce();
  expect(patchState).not.toHaveBeenCalled();
});

it("restores a server draft without saving or depending on property order", async () => {
  const reordered = Object.fromEntries(
    Object.entries(makeProgress()).reverse(),
  );
  getState.mockResolvedValue({
    ...response(),
    data: { ...response().data, wizardProgress: reordered },
  });
  const { result } = mountWizard();
  await settle();
  expect(result.current.isReady).toBe(true);
  expect(patchState).not.toHaveBeenCalled();
  expect(readLocalProgress("u1")).toEqual({
    progress: makeProgress(),
    revision: 4,
    pending: false,
  });
});

it("does not save an empty wizard until its first edit", async () => {
  getState.mockResolvedValue({
    ...response(),
    data: { ...response().data, wizardProgress: null, wizardRevision: 0 },
  });
  mountWizard();
  await settle();
  expect(patchState).not.toHaveBeenCalled();
  act(() => useOnboardingWizardStore.getState().setRole("Founder"));
  await settle();
  expect(patchState).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      wizardProgress: expect.objectContaining({ role: "Founder" }),
      wizardRevision: 0,
      wizardUserId: "u1",
    }),
    expect.anything(),
  );
});

it("saves the first edit after a clean restore with the loaded revision", async () => {
  mountWizard();
  await settle();
  act(() => useOnboardingWizardStore.getState().setOtherRole("Founder"));
  await settle();
  expect(patchState).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      wizardProgress: makeProgress({ otherRole: "Founder" }),
      wizardRevision: 4,
    }),
    expect.anything(),
  );
});

it.each([false, true])(
  "replays pending changes when offline=%s",
  async (offline) => {
    const changed = makeProgress({ role: "Founder" });
    writeLocalProgress("u1", changed, true, 4);
    if (offline) getState.mockRejectedValue(new Error("Offline"));
    mountWizard();
    await settle();
    expect(patchState).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ wizardProgress: changed, wizardRevision: 4 }),
      expect.anything(),
    );
  },
);

it("acknowledges an uncertain save already present on the server without another write", async () => {
  writeLocalProgress("u1", makeProgress(), true, 3);
  mountWizard();
  await settle();
  expect(patchState).not.toHaveBeenCalled();
  expect(readLocalProgress("u1")).toEqual({
    progress: makeProgress(),
    revision: 4,
    pending: false,
  });
});

it("keeps saving after a timed-out save that the server applied", async () => {
  let server = { progress: makeProgress(), revision: 4 };
  getState.mockImplementation(async () =>
    response(server.progress, server.revision),
  );
  patchState.mockImplementation(
    ({ wizardProgress, wizardRevision, wizardUserId }) => {
      if (wizardRevision !== server.revision)
        return Promise.resolve({ status: 409, data: { detail: "Conflict" } });
      const answers = server.revision > 4;
      server = { progress: wizardProgress, revision: server.revision + 1 };
      if (!answers) return new Promise(() => {});
      return Promise.resolve({
        status: 200,
        data: { userId: wizardUserId, wizardRevision: server.revision },
      });
    },
  );
  const { result } = mountWizard();
  await settle();
  act(() => useOnboardingWizardStore.getState().setRole("Founder"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_250);
  });
  expect(result.current.error).toMatch(/couldn't save/i);
  act(() => useOnboardingWizardStore.getState().setOtherRole("Solo"));
  await settle();
  const latest = makeProgress({ role: "Founder", otherRole: "Solo" });
  expect(result.current.conflict).toBe(false);
  expect(result.current.error).toBeNull();
  expect(server).toEqual({ progress: latest, revision: 6 });
  expect(readLocalProgress("u1")).toEqual({
    progress: latest,
    revision: 6,
    pending: false,
  });
});

it("keeps a clean offline cache clean and saves subsequent edits", async () => {
  writeLocalProgress("u1", makeProgress(), false, 4);
  getState.mockRejectedValue(new Error("Offline"));
  const { result } = mountWizard();
  await settle();
  expect(patchState).not.toHaveBeenCalled();
  expect(result.current.error).not.toMatch(/retrying/i);
  act(() => useOnboardingWizardStore.getState().setRole("Founder"));
  await settle();
  expect(patchState).toHaveBeenCalledOnce();
});

it("persists a requested-step correction", async () => {
  params = new URLSearchParams("step=role");
  getState.mockResolvedValue(
    response(
      makeProgress({
        currentStep: "subscription",
        completedSteps: ["role", "painPoints"],
      }),
    ),
  );
  mountWizard();
  await settle();
  expect(patchState).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      wizardProgress: makeProgress({
        currentStep: "role",
        completedSteps: ["role", "painPoints"],
      }),
      wizardRevision: 4,
    }),
    expect.anything(),
  );
});

it("does not acknowledge a different outbox written by another tab during restore", async () => {
  writeLocalProgress("u1", makeProgress(), true, 3);
  getState.mockImplementation(async () => {
    writeLocalProgress("u1", makeProgress({ role: "Newer tab" }), true, 4);
    return response();
  });
  mountWizard();
  await settle();
  expect(patchState).not.toHaveBeenCalled();
  expect(readLocalProgress("u1")).toEqual({
    progress: makeProgress({ role: "Newer tab" }),
    revision: 4,
    pending: true,
  });
});

it("retains stale-draft conflict handling and reloads without a redundant write", async () => {
  writeLocalProgress("u1", makeProgress({ role: "Stale" }), true, 3);
  const { result } = mountWizard();
  await settle();
  expect(result.current.conflict).toBe(true);
  expect(patchState).not.toHaveBeenCalled();
  act(() => result.current.retry());
  await settle();
  expect(result.current.isReady).toBe(true);
  expect(patchState).not.toHaveBeenCalled();
  expect(readLocalProgress("u1")?.pending).toBe(false);
});

it("rejects a restored draft belonging to another signed-in account", async () => {
  getState.mockResolvedValue(response(makeProgress(), 4, "u2"));
  const { result } = mountWizard();
  await settle();
  expect(result.current.isReady).toBe(false);
  expect(result.current.error).toMatch(/account changed/i);
  expect(readLocalProgress("u1")).toBeNull();
  expect(patchState).not.toHaveBeenCalled();
});

it("ignores a delayed restore after the account changes", async () => {
  let resolveFirst!: (value: ReturnType<typeof response>) => void;
  getState.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveFirst = resolve;
    }),
  );
  getState.mockResolvedValueOnce(
    response(makeProgress({ role: "Other account" }), 6, "u2"),
  );
  const { rerender } = mountWizard();
  rerender({ userID: "u2" });
  await settle();
  await act(async () => {
    resolveFirst(response());
  });
  expect(useOnboardingWizardStore.getState()).toMatchObject({
    userID: "u2",
    role: "Other account",
  });
  expect(readLocalProgress("u1")).toBeNull();
  expect(patchState).not.toHaveBeenCalled();
});
