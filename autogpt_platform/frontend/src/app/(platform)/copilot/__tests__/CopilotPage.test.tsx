import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from "@/tests/integrations/test-utils";
import { server } from "@/mocks/mock-server";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useCopilotUIStore } from "../store";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopilotPage } from "../CopilotPage";
import type { ChatContainerProps } from "../components/ChatContainer/ChatContainer";

vi.mock("@/providers/onboarding/onboarding-provider", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock child components that are complex and not under test here
vi.mock("../components/ChatContainer/ChatContainer", async () => {
  const { ToolChain } = await import("../components/ToolChain/ToolChain");
  const { CopilotChatActionsProvider } = await import(
    "../components/CopilotChatActionsProvider/CopilotChatActionsProvider"
  );
  function ChatContainer({ messages, onSend }: ChatContainerProps) {
    return (
      <div data-testid="chat-container">
        <CopilotChatActionsProvider onSend={onSend}>
          <ToolChain
            parts={messages.flatMap((message) => message.parts)}
            isStreaming={false}
          />
        </CopilotChatActionsProvider>
      </div>
    );
  }
  return { ChatContainer };
});
vi.mock("../components/DeleteChatDialog/DeleteChatDialog", () => ({
  DeleteChatDialog: () => null,
}));
vi.mock("../components/NotificationBanner/NotificationBanner", () => ({
  NotificationBanner: () => null,
}));
vi.mock("../components/RateLimitResetDialog/RateLimitResetDialog", () => ({
  RateLimitResetDialog: () => null,
}));
vi.mock("../components/RateLimitResetDialog/RateLimitGate", () => ({
  RateLimitGate: () => null,
}));
vi.mock("../components/FileDropZone/FileDropZone", () => ({
  FileDropZone: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
const viewportState = vi.hoisted(() => ({ isMobile: false }));
vi.mock("../useIsMobile", () => ({
  useIsMobile: () => viewportState.isMobile,
}));
vi.mock("../components/ScaleLoader/ScaleLoader", () => ({
  ScaleLoader: () => <div data-testid="scale-loader" />,
}));
vi.mock("../components/ArtifactPanel/ArtifactPanel", () => ({
  ArtifactPanel: () => null,
}));
vi.mock("@/components/molecules/Sidebar/Sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock hooks that hit the network. Exercise the `select` callback so its
// line counts as covered alongside the rest of the options.
vi.mock(
  "@/app/api/__generated__/endpoints/chat/chat",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/app/api/__generated__/endpoints/chat/chat")
    >()),
    useGetV2ListManagedChatModels: () => ({ data: undefined }),
    useGetV2ListChatTransports: () => ({ data: undefined }),
    useGetV2GetCopilotUsage: (opts: {
      query?: { select?: (r: { data: unknown }) => unknown };
    }) => {
      const data = {
        daily: null,
        weekly: null,
        tier: "BASIC",
        reset_cost: 0,
      };
      if (typeof opts?.query?.select === "function") {
        opts.query.select({ data });
      }
      return { data: undefined, isSuccess: false, isError: false };
    },
    // The provider-limit dialog reads connections to find somewhere to
    // continue. It only renders on a failure, which this page test never
    // provokes, so an empty result is the honest stand-in.
    useGetV2ListChatConnections: () => ({ data: undefined }),
    getGetV2ListChatConnectionsQueryKey: () => ["chat", "connections"],
    usePutV2ChangeTheConnectionAnExistingChatRunsOn: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  }),
);
vi.mock("@/hooks/useCredits", () => ({
  default: () => ({ credits: null, fetchCredits: vi.fn() }),
}));
vi.mock("@/services/feature-flags/use-get-flag", () => ({
  Flag: {
    CHAT_MODE_OPTION: "CHAT_MODE_OPTION",
    TASK_PROGRESS_BAR: "TASK_PROGRESS_BAR",
  },
  useGetFlag: () => false,
  useFlagStatus: () => ({ enabled: false, ready: true, answered: true }),
}));

// Auth check moved into CopilotPage directly — default to a logged-in
// user so the page renders past its loading gate.
const mockUseAuth = vi.fn(() => ({ isUserLoading: false, isLoggedIn: true }));
vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// sessionId is read via nuqs to key the chat-host subtree; stub it so
// tests can control the key/session without hitting URL state.
let mockSessionIdForQueryState: string | null = null;
vi.mock("nuqs", () => ({
  parseAsString: {},
  parseAsStringLiteral: () => ({}),
  useQueryState: (key: string) =>
    key === "sessionId"
      ? [mockSessionIdForQueryState, vi.fn()]
      : [null, vi.fn()],
}));

// Build the base mock return value for useCopilotPage
const basePageState = {
  sessionId: null as string | null,
  messages: [] as ChatContainerProps["messages"],
  status: "ready" as const,
  error: undefined,
  stop: vi.fn(),
  isReconnecting: false,
  isSyncing: false,
  createSession: vi.fn(),
  onSend: vi.fn(),
  isLoadingSession: false,
  isSessionError: false,
  isCreatingSession: false,
  isUploadingFiles: false,
  isUserLoading: false,
  isLoggedIn: true,
  hasMoreMessages: false,
  isLoadingMore: false,
  loadMore: vi.fn(),
  turnStats: new Map(),
  rateLimitMessage: null,
  dismissRateLimit: vi.fn(),
  sessionDryRun: false,
};

const mockUseCopilotPage = vi.fn(() => basePageState);

vi.mock("../useCopilotPage", () => ({
  useCopilotPage: () => mockUseCopilotPage(),
}));

afterEach(() => {
  cleanup();
  mockUseCopilotPage.mockReset();
  mockUseCopilotPage.mockImplementation(() => basePageState);
  mockUseAuth.mockReset();
  mockUseAuth.mockImplementation(() => ({
    isUserLoading: false,
    isLoggedIn: true,
  }));
  mockSessionIdForQueryState = null;
  viewportState.isMobile = false;
  server.resetHandlers();
});

describe("CopilotPage child conversation", () => {
  it.each([false, true])(
    "opens the exact child without replacing the parent chat (mobile: %s)",
    async (mobile) => {
      const user = userEvent.setup();
      mockSessionIdForQueryState = "parent-chat";
      viewportState.isMobile = mobile;
      const getSession = vi.fn(({ params }) =>
        HttpResponse.json({
          id: params.sessionId,
          chat_status: "idle",
          messages: [
            { role: "user", content: "Compare these options", sequence: 0 },
            {
              role: "assistant",
              sequence: 1,
              tool_calls: [
                {
                  id: "child-tool",
                  function: {
                    name: "bash_exec",
                    arguments: '{"command":"pwd"}',
                  },
                },
              ],
            },
            {
              role: "tool",
              content: "workspace",
              tool_call_id: "child-tool",
              sequence: 2,
            },
            { role: "assistant", content: "Curie's comparison", sequence: 3 },
          ],
        }),
      );
      server.use(
        http.get("/api/proxy/api/chat/sessions/:sessionId", getSession),
      );
      mockUseCopilotPage.mockReturnValue({
        ...basePageState,
        sessionId: "parent-chat",
        messages: [
          {
            id: "parent-turn",
            role: "assistant",
            parts: [
              {
                type: "tool-delegate_to_expert",
                toolCallId: "curie-call",
                state: "output-available",
                input: { expert_id: "curie" },
                output: {
                  sub_autopilot_session_id: "curie-chat",
                  status: "completed",
                  expert: { name: "Curie" },
                },
              },
            ],
          },
        ],
      });

      render(<CopilotPage />);
      const parent = screen.getByTestId("chat-container");
      const entry = within(parent).getByRole("link", {
        name: "Curie completed",
      });
      await user.click(entry);

      const panel = await screen.findByRole(
        mobile ? "dialog" : "complementary",
        {
          name: "Curie's conversation",
        },
      );
      expect(
        await within(panel).findByText("Curie's comparison"),
      ).toBeDefined();
      expect(within(panel).getByText("Compare these options")).toBeDefined();
      expect(
        within(panel).getByRole("button", { name: /ran commands/i }),
      ).toBeDefined();
      expect(getSession).toHaveBeenCalledWith(
        expect.objectContaining({ params: { sessionId: "curie-chat" } }),
      );
      expect(screen.getByTestId("chat-container")).toBe(parent);

      if (mobile) await user.keyboard("{Escape}");
      else
        await user.click(
          within(panel).getByRole("button", { name: "Close sub-session" }),
        );
      await waitFor(() => expect(panel.isConnected).toBe(false));
      expect(
        within(parent).getByRole("link", { name: "Curie completed" }),
      ).toBe(entry);
    },
  );
});

describe("CopilotPage context panel reset", () => {
  it("forgets the previous chat's artifact on session entry even on mobile", async () => {
    viewportState.isMobile = true;
    mockSessionIdForQueryState = "session-b";
    mockUseCopilotPage.mockReturnValue({
      ...basePageState,
      sessionId: "session-b",
    });
    useCopilotUIStore.setState((s) => ({
      artifactPanel: {
        ...s.artifactPanel,
        isOpen: true,
        lastArtifact: {
          id: "session-a-file",
          title: "from-chat-a.md",
          mimeType: "text/markdown",
          sourceUrl: "/api/proxy/api/workspace/files/session-a-file/download",
          origin: "agent",
        },
      },
    }));

    render(<CopilotPage />);

    await waitFor(() =>
      expect(
        useCopilotUIStore.getState().artifactPanel.lastArtifact,
      ).toBeNull(),
    );
  });
});

describe("CopilotPage test-mode banner", () => {
  it("does not show test-mode banner when there is no active session", () => {
    render(<CopilotPage />);
    expect(
      screen.queryByText(/test mode.*this session runs workflows/i),
    ).toBeNull();
  });

  it("does not show test-mode banner when session exists but sessionDryRun is false", () => {
    mockSessionIdForQueryState = "session-abc";
    mockUseCopilotPage.mockReturnValue({
      ...basePageState,
      sessionId: "session-abc",
      sessionDryRun: false,
    });
    render(<CopilotPage />);
    expect(
      screen.queryByText(/test mode.*this session runs workflows/i),
    ).toBeNull();
  });

  it("shows test-mode banner when session exists and sessionDryRun is true", () => {
    mockSessionIdForQueryState = "session-abc";
    mockUseCopilotPage.mockReturnValue({
      ...basePageState,
      sessionId: "session-abc",
      sessionDryRun: true,
    });
    render(<CopilotPage />);
    expect(
      screen.getByText(/test mode.*this session runs workflows/i),
    ).toBeDefined();
  });

  it("does not show test-mode banner when sessionDryRun is true but no sessionId", () => {
    mockUseCopilotPage.mockReturnValue({
      ...basePageState,
      sessionId: null,
      sessionDryRun: true,
    });
    render(<CopilotPage />);
    expect(
      screen.queryByText(/test mode.*this session runs workflows/i),
    ).toBeNull();
  });

  it("shows loading spinner when user is loading", () => {
    // Auth check moved to CopilotPage — mock useAuth directly.
    mockUseAuth.mockReturnValue({ isUserLoading: true, isLoggedIn: false });
    render(<CopilotPage />);
    expect(screen.getByTestId("scale-loader")).toBeDefined();
    expect(screen.queryByTestId("chat-container")).toBeNull();
  });
});
