import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import {
  assistantTextChunks,
  createStreamHold,
  streamSseResponse,
} from "@/tests/integrations/copilot-sse";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, type HttpResponseResolver } from "msw";
import type { UIMessageChunk } from "ai";
import { useCopilotUIStore } from "../store";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopilotPage } from "../CopilotPage";
import type { ChatContainerProps } from "../components/ChatContainer/ChatContainer";

const TEST_STREAM_ORIGIN = "http://localhost:18006";

vi.mock("@/services/environment", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/environment")>();
  return {
    ...actual,
    environment: {
      ...actual.environment,
      getAGPTServerBaseUrl: () => TEST_STREAM_ORIGIN,
    },
  };
});

vi.mock("../helpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../helpers")>()),
  getCopilotAuthHeaders: async () => ({ "x-test-auth": "yes" }),
}));

vi.mock("@/providers/onboarding/onboarding-provider", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock child components that are complex and not under test here
vi.mock("../components/ChatContainer/ChatContainer", async () => {
  const { ToolChain } = await import("../components/ToolChain/ToolChain");
  const { deriveRowParts } = await import(
    "../components/ChatMessagesContainer/components/MessageRow/helpers"
  );
  const { CopilotChatActionsProvider } = await import(
    "../components/CopilotChatActionsProvider/CopilotChatActionsProvider"
  );
  function ChatContainer({ messages, onSend, status }: ChatContainerProps) {
    return (
      <div data-testid="chat-container">
        <CopilotChatActionsProvider onSend={onSend}>
          <ToolChain
            parts={messages.flatMap(
              (message) =>
                deriveRowParts(message.role, message.parts).renderableParts,
            )}
            isStreaming={status === "streaming"}
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
  status: "ready" as ChatContainerProps["status"],
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
  useCopilotUIStore.getState().closeSubSessionPreview();
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
  it("shows a running child's task and unpersisted stream, then the saved answer once", async () => {
    const user = userEvent.setup();
    const sessionID = "analyst-child";
    const turnID = "analysis-turn";
    const prompt = "Compare the data from this week";
    const liveAnswer = "I found three changes.";
    const finalAnswer = `${liveAnswer} Here is the comparison.`;
    const textChunks = assistantTextChunks(liveAnswer);
    const chunks: UIMessageChunk[] = [
      ...textChunks.slice(0, 5),
      {
        type: "tool-input-available",
        toolCallId: "child-command",
        toolName: "bash_exec",
        input: { command: "pwd" },
      },
      {
        type: "tool-output-available",
        toolCallId: "child-command",
        output: "workspace",
      },
      ...textChunks.slice(5),
    ];
    const startReply = Promise.withResolvers<void>();
    const heldFinish = createStreamHold(chunks.length - 1);
    let completed = false;
    const stream = vi.fn<HttpResponseResolver>(async ({ request }) => {
      await startReply.promise;
      return streamSseResponse(chunks, {
        turnId: turnID,
        hold: heldFinish.hold,
        abortSignal: request.signal,
      });
    });
    server.use(
      http.get(`/api/proxy/api/chat/sessions/${sessionID}`, () =>
        HttpResponse.json({
          id: sessionID,
          chat_status: completed ? "idle" : "running",
          active_stream: completed
            ? null
            : { turn_id: turnID, last_message_id: "8-0" },
          has_more_messages: false,
          messages: completed
            ? [
                { role: "user", content: prompt, sequence: 0 },
                { role: "assistant", content: finalAnswer, sequence: 1 },
              ]
            : [],
        }),
      ),
      http.get(
        `${TEST_STREAM_ORIGIN}/api/chat/sessions/${sessionID}/stream`,
        stream,
      ),
    );
    mockSessionIdForQueryState = "parent-chat";
    mockUseCopilotPage.mockReturnValue({
      ...basePageState,
      sessionId: "parent-chat",
      status: "streaming",
      messages: [
        {
          id: "parent-turn",
          role: "assistant",
          parts: [
            {
              type: "tool-run_sub_session",
              toolCallId: "analysis-call",
              state: "input-available",
              input: { prompt, system_context: "Test-only internal context" },
            },
            {
              type: "data-tool-display",
              data: { toolCallId: "analysis-call", subSessionId: sessionID },
            },
          ],
        },
      ],
    });

    try {
      render(<CopilotPage />);
      const parent = screen.getByTestId("chat-container");
      await user.click(
        within(parent).getByRole("link", { name: "Sub-agent running" }),
      );
      const drawer = within(
        await screen.findByRole("complementary", {
          name: "Sub-agent's conversation",
        }),
      );
      expect(await drawer.findByText(prompt)).toBeDefined();
      expect(
        drawer.getByText("Waiting for the sub-agent's reply…"),
      ).toBeDefined();
      expect(drawer.queryByText("Test-only internal context")).toBeNull();
      startReply.resolve();
      expect(await drawer.findByText(liveAnswer)).toBeDefined();
      expect(
        drawer.getByRole("button", { name: /ran commands/i }),
      ).toBeDefined();
      expect(stream).toHaveBeenCalledTimes(1);
      const request = stream.mock.calls[0][0].request;
      expect(request.headers.get("x-test-auth")).toBe("yes");
      expect(new URL(request.url).searchParams.get("turn")).toBe(turnID);

      completed = true;
      heldFinish.release();
      expect(await drawer.findByText(finalAnswer)).toBeDefined();
      expect(drawer.getAllByText(prompt)).toHaveLength(1);
      expect(drawer.queryByText(liveAnswer)).toBeNull();
      expect(within(parent).queryByText(finalAnswer)).toBeNull();
    } finally {
      startReply.resolve();
      heldFinish.release();
    }
  });

  it("opens the matching running child of two calls to the same expert", async () => {
    const user = userEvent.setup();
    mockSessionIdForQueryState = "parent-chat";
    const getSession = vi.fn<HttpResponseResolver>(({ params }) => {
      const first = params.sessionId === "harper-a";
      return HttpResponse.json({
        id: params.sessionId,
        expert_id: "harper",
        chat_status: first ? "running" : "queued",
        active_stream: first
          ? { turn_id: "harper-turn", last_message_id: "0-0" }
          : null,
        messages: [
          {
            role: "user",
            content: `Task for ${params.sessionId}`,
            sequence: 0,
          },
        ],
      });
    });
    const parked = createStreamHold(5);
    const stream = vi.fn<HttpResponseResolver>(({ request }) =>
      streamSseResponse(assistantTextChunks("正在整理招聘要求。"), {
        turnId: "harper-turn",
        hold: parked.hold,
        abortSignal: request.signal,
      }),
    );
    server.use(
      http.get("/api/proxy/api/chat/sessions/:sessionId", getSession),
      http.get(
        `${TEST_STREAM_ORIGIN}/api/chat/sessions/harper-a/stream`,
        stream,
      ),
      http.get("/api/proxy/api/experts/identities", () =>
        HttpResponse.json([
          {
            id: "harper",
            name: "哈珀",
            role: "招聘与录用",
            job_title: "招聘专员",
            avatar_url: "/experts/professional/expert-harper.webp",
            is_archived: false,
          },
        ]),
      ),
    );
    mockUseCopilotPage.mockReturnValue({
      ...basePageState,
      sessionId: "parent-chat",
      status: "streaming",
      messages: [
        {
          id: "parent-turn",
          role: "assistant",
          parts: [
            ...["call-a", "call-b"].map((toolCallId) => ({
              type: "tool-run_capability" as const,
              toolCallId,
              state: "input-available" as const,
              input: {
                id: "tool:delegate_to_expert",
                input: {
                  expert_id: "harper",
                  prompt: "Draft a job description",
                },
              },
            })),
            {
              type: "data-tool-display",
              data: { toolCallId: "call-b", subSessionId: "harper-b" },
            },
            {
              type: "data-tool-display",
              data: { toolCallId: "call-a", subSessionId: "harper-a" },
            },
          ],
        },
      ],
    });

    try {
      render(
        <LanguageProvider initialLocale="zh-CN">
          <CopilotPage />
        </LanguageProvider>,
      );
      const parent = screen.getByTestId("chat-container");
      const entries = await within(parent).findAllByRole("link", {
        name: "招聘专员 运行中",
      });
      expect(entries).toHaveLength(2);
      await user.click(entries[0]);

      const panel = await screen.findByRole("complementary", {
        name: "招聘专员 的会话",
      });
      const child = within(panel);
      expect(await child.findByText("Task for harper-a")).toBeDefined();
      expect(await child.findByText("正在整理招聘要求。")).toBeDefined();
      const author = await child.findByTestId("expert-assistant-identity");
      expect(await within(author).findByText("招聘专员")).toBeDefined();
      expect(within(author).getByAltText("招聘专员").getAttribute("src")).toBe(
        "/experts/professional/expert-harper.webp",
      );
      expect(within(author).queryByText("通用办公助手")).toBeNull();
      expect(getSession).not.toHaveBeenCalledWith(
        expect.objectContaining({ params: { sessionId: "harper-b" } }),
      );
      expect(useCopilotUIStore.getState().subSessionPreview).toMatchObject({
        parentSessionID: "parent-chat",
        sessionID: "harper-a",
      });
      expect(screen.getByTestId("chat-container")).toBe(parent);

      const { request } = stream.mock.calls[0][0];
      await user.click(entries[1]);
      expect(await child.findByText("Task for harper-b")).toBeDefined();
      expect(child.getByText("任务排队中")).toBeDefined();
      expect(child.queryByText("Task for harper-a")).toBeNull();
      expect(child.queryByText("正在整理招聘要求。")).toBeNull();
      expect(request.signal.aborted).toBe(true);
      await user.click(child.getByRole("button", { name: "关闭子对话" }));
      expect(panel.isConnected).toBe(false);
      expect(screen.getByTestId("chat-container")).toBe(parent);

      await user.click(entries[0]);
      const reopened = within(
        await screen.findByRole("complementary", { name: "招聘专员 的会话" }),
      );
      expect(await reopened.findByText("正在整理招聘要求。")).toBeDefined();
      expect(reopened.queryByText("Task for harper-b")).toBeNull();
      expect(stream).toHaveBeenCalledTimes(2);
      const resumedRequest = stream.mock.calls[1][0].request;
      await user.click(reopened.getByRole("button", { name: "关闭子对话" }));
      expect(resumedRequest.signal.aborted).toBe(true);
      expect(screen.getByTestId("chat-container")).toBe(parent);
    } finally {
      parked.release();
    }
  });

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
                  expert: { name: "Curie", role: "Research Analyst" },
                },
              },
            ],
          },
        ],
      });

      render(<CopilotPage />);
      const parent = screen.getByTestId("chat-container");
      const entry = within(parent).getByRole("link", {
        name: "Research Analyst completed",
      });
      await user.click(entry);

      const panel = await screen.findByRole(
        mobile ? "dialog" : "complementary",
        {
          name: "Research Analyst's conversation",
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
        within(parent).getByRole("link", {
          name: "Research Analyst completed",
        }),
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
