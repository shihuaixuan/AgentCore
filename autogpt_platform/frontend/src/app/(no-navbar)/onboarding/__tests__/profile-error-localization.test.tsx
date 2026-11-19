import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { User } from "@/lib/auth/types";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { useOnboardingProfile } from "../useOnboardingProfile";
import { useOnboardingWizardStore } from "../store";

const { submitProfile } = vi.hoisted(() => ({ submitProfile: vi.fn() }));
vi.mock("@/app/api/__generated__/endpoints/onboarding/onboarding", () => ({
  postV1SubmitOnboardingProfile: submitProfile,
}));

const user: User = {
  id: "u1",
  email: "reinier@example.com",
  user_metadata: { name: "Reinier Bot" },
};

function mountProfile() {
  return renderHook(
    () => ({
      ...useOnboardingProfile({ user, enabled: true }),
      setLocale: useTranslation().setLocale,
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <LanguageProvider initialLocale="zh-CN">{children}</LanguageProvider>
      ),
    },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  useOnboardingWizardStore.getState().reset();
  useOnboardingWizardStore.setState({ userID: "u1", role: "Engineering" });
  submitProfile.mockResolvedValue({ status: 200 });
});

afterEach(() => {
  cleanup();
});

it.each(["missing", "network", "http"])(
  "localizes the %s profile error without resubmitting on a language change",
  async (failure) => {
    if (failure === "missing") useOnboardingWizardStore.setState({ role: "" });
    else if (failure === "network")
      submitProfile.mockRejectedValue(new Error("Offline"));
    else submitProfile.mockResolvedValue({ status: 503 });
    const { result } = mountProfile();
    await waitFor(() => {
      expect(result.current.error).toBe(
        "无法保存个人资料。回答已保存，请重试后再继续。",
      );
    });
    act(() => result.current.setLocale("en"));
    expect(result.current.error).toBe(
      "We couldn't save your profile. Your answers are saved; please retry before continuing.",
    );
    expect(submitProfile).toHaveBeenCalledTimes(failure === "missing" ? 0 : 1);
  },
);

it("localizes account-change rejections without submitting for the other account", async () => {
  const { result } = mountProfile();
  await act(async () => {
    await result.current.ensureSaved();
  });
  useOnboardingWizardStore.setState({ userID: "u2" });
  await expect(result.current.ensureSaved()).rejects.toThrow(
    "账户已更改，请重新加载首次使用向导。",
  );
  act(() => result.current.setLocale("en"));
  await expect(result.current.ensureSaved()).rejects.toThrow(
    "Your account changed. Please reload onboarding.",
  );
  expect(submitProfile).toHaveBeenCalledOnce();
});

it("localizes a stale in-flight save while preserving one profile submission", async () => {
  let resolveSave!: (response: { status: number }) => void;
  submitProfile.mockReturnValue(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  const { result } = mountProfile();
  await act(async () => {
    const rejected = expect(result.current.ensureSaved()).rejects.toThrow(
      "账户已更改。",
    );
    useOnboardingWizardStore.setState({ userID: "u2" });
    resolveSave({ status: 200 });
    await rejected;
  });
  expect(submitProfile).toHaveBeenCalledOnce();
});
