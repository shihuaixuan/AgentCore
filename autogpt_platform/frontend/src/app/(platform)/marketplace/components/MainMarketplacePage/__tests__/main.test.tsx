import {
  render,
  screen,
  waitFor,
  within,
} from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { WorkflowsBrowsePage } from "../../../workflows/components/WorkflowsBrowsePage";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockUseWorkflowsBrowse = vi.hoisted(() => vi.fn());
const mockUseFlagSource = vi.hoisted(() => vi.fn());
const onboarding = vi.hoisted(() => ({
  ready: false,
  completeStep: vi.fn(),
}));

vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "marketplace-intro-user" },
    isLoggedIn: true,
    isUserLoading: false,
  }),
}));

vi.mock("@/providers/onboarding/onboarding-provider", () => ({
  useOnboarding: () => ({
    state: onboarding.ready ? { completedSteps: [] } : null,
    completeStep: onboarding.completeStep,
  }),
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../../workflows/components/useWorkflowsBrowse", () => ({
  useWorkflowsBrowse: mockUseWorkflowsBrowse,
}));

vi.mock("@/services/feature-flags/flag-source", () => ({
  useFlagSource: mockUseFlagSource,
}));

describe("Market workflow publishing", () => {
  beforeEach(() => {
    window.localStorage.clear();
    onboarding.ready = false;
    onboarding.completeStep.mockReset();
    mockUseFlagSource.mockReturnValue({
      value: undefined,
      resolved: false,
    });
    mockUseWorkflowsBrowse.mockReturnValue({
      workflows: [],
      query: { isLoading: false, isError: false },
      search: "",
      category: null,
      sort: "runs",
      total: 0,
      update: vi.fn(),
    });
  });

  test("publishing is available on the workflow route before flags answer", () => {
    render(<WorkflowsBrowsePage />);

    expect(screen.getByRole("heading", { name: "Workflows" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Publish workflow" }),
    ).toBeDefined();
  });

  test("defers the intro while the publish dialog is open", async () => {
    mockUseFlagSource.mockImplementation(() => ({
      value: true,
      resolved: true,
    }));
    const { rerender } = render(<WorkflowsBrowsePage />);
    await userEvent.click(
      screen.getByRole("button", { name: "Publish workflow" }),
    );
    const publishDialog = await screen.findByRole("dialog", {
      name: "Publish Workflow",
    });
    expect(screen.getByTestId("publish-agent-modal")).toBeDefined();

    onboarding.ready = true;
    rerender(<WorkflowsBrowsePage />);
    expect(screen.queryByTestId("tab-intro-overlay")).toBeNull();
    expect(onboarding.completeStep).not.toHaveBeenCalled();

    mockUseFlagSource.mockImplementation(() => ({
      value: false,
      resolved: true,
    }));
    rerender(<WorkflowsBrowsePage />);
    expect(screen.getByRole("dialog", { name: "Publish Workflow" })).toBe(
      publishDialog,
    );
    expect(screen.queryByTestId("tab-intro-overlay")).toBeNull();
    expect(onboarding.completeStep).not.toHaveBeenCalled();

    await userEvent.click(
      within(publishDialog).getByRole("button", {
        name: "Close",
      }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Workflows ready to work." }),
    ).toBeDefined();
    expect(onboarding.completeStep).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    await waitFor(() =>
      expect(screen.queryByTestId("tab-intro-overlay")).toBeNull(),
    );
    expect(onboarding.completeStep).toHaveBeenCalledWith(
      "MARKETPLACE_TAB_INTRO",
    );
  });
});
