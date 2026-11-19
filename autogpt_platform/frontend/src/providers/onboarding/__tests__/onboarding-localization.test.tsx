import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast as sonnerToast } from "sonner";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { Toaster } from "@/components/molecules/Toast/toaster";
import OnboardingProvider, { useOnboarding } from "../onboarding-provider";

const backend = vi.hoisted(() => ({
  check: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  complete: vi.fn(),
  router: { replace: vi.fn(), push: vi.fn(), refresh: vi.fn() },
  api: { onWebSocketMessage: () => () => {}, connectWebSocket: () => {} },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => backend.router,
  usePathname: () => "/marketplace",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({ isLoggedIn: true, user: { id: "test-user" } }),
}));
vi.mock("@/lib/autogpt-server-api/context", () => ({
  useBackendAPI: () => backend.api,
}));
vi.mock("@/hooks/useOnboardingTimezoneDetection", () => ({
  useOnboardingTimezoneDetection: () => undefined,
}));
vi.mock("@/app/api/__generated__/endpoints/onboarding/onboarding", () => ({
  getV1CheckIfOnboardingIsCompleted: backend.check,
  getV1OnboardingState: backend.read,
  patchV1UpdateOnboardingState: backend.update,
  postV1CompleteOnboardingStep: backend.complete,
}));

function OnboardingActions() {
  const { state, updateState, completeStep } = useOnboarding();
  return (
    <>
      {state && <span>Ready</span>}
      <button onClick={() => updateState({ walletShown: true })}>Update</button>
      <button onClick={() => completeStep("WELCOME")}>Complete</button>
    </>
  );
}

function mount() {
  return render(
    <LanguageProvider initialLocale="zh-CN">
      <OnboardingProvider>
        <OnboardingActions />
      </OnboardingProvider>
      <Toaster />
    </LanguageProvider>,
  );
}

describe("onboarding notification localization", () => {
  afterEach(() => sonnerToast.dismiss());
  beforeEach(() => {
    backend.check.mockResolvedValue({
      status: 200,
      data: { is_completed: true },
    });
    backend.read.mockResolvedValue({
      status: 200,
      data: { completedSteps: ["ONBOARDING_COMPLETE"] },
    });
    backend.update.mockRejectedValue(new Error("Original backend error"));
    backend.complete.mockRejectedValue(new Error("Original backend error"));
  });

  it("shows initialization failures in Chinese", async () => {
    backend.check.mockRejectedValueOnce(new Error("Invalid onboarding state"));
    mount();
    expect(await screen.findByText("初始化新手引导失败")).toBeDefined();
  });

  it("shows state update failures in Chinese", async () => {
    mount();
    await screen.findByText("Ready");
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await screen.findByText("更新新手引导失败")).toBeDefined();
  });

  it("shows completion failures in Chinese", async () => {
    mount();
    await screen.findByText("Ready");
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(await screen.findByText("完成引导步骤失败")).toBeDefined();
  });
});
