import { getGetV2GetSessionMockHandler200 } from "@/app/api/__generated__/endpoints/chat/chat.msw";
import { server } from "@/mocks/mock-server";
import { render, screen } from "@/tests/integrations/test-utils";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChainRow } from "../helpers";
import { ChainRowView } from "../ChainRowView";

function subSession(overrides: Record<string, unknown> = {}) {
  return getGetV2GetSessionMockHandler200({
    id: "sub-1",
    created_at: "2026-08-21T00:00:00Z",
    updated_at: "2026-08-21T00:00:00Z",
    user_id: "u-1",
    messages: [],
    ...overrides,
  });
}

function row(overrides: Partial<ChainRow>): ChainRow {
  return {
    key: "row-1",
    category: "agent",
    text: "Handing off to a teammate…",
    state: "running",
    ...overrides,
  };
}

afterEach(() => {
  server.resetHandlers();
});

describe("ChainRowView - live sub-session rows", () => {
  it("shows only the pending identity for a blocking delegate", async () => {
    render(
      <ChainRowView
        row={row({
          tool: "delegate_to_expert",
          state: "running",
          output: undefined,
          input: { expert_id: "exp-1", prompt: "Create a chat app" },
        })}
        isLast
      />,
    );

    expect(await screen.findByText("AI Expert")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("Create a chat app")).toBeNull();
  });

  it("does not auto-open a result-poll row with no output (nothing to show)", () => {
    render(
      <ChainRowView
        row={row({
          tool: "get_sub_session_result",
          state: "running",
          output: undefined,
          input: {},
        })}
        isLast
      />,
    );

    expect(screen.queryByText("AI Expert")).toBeNull();
  });

  it("does not treat a non-sub-session tool as a live sub-session row", () => {
    render(
      <ChainRowView
        row={row({
          tool: "run_agent",
          state: "running",
          output: undefined,
          input: {},
        })}
        isLast
      />,
    );

    expect(screen.queryByText("AI Expert")).toBeNull();
  });

  it("keeps showing the teammate identity while a delegate output is still working", async () => {
    server.use(subSession({ chat_status: "running", active_stream: false }));

    render(
      <ChainRowView
        row={row({
          tool: "delegate_to_expert",
          state: "done",
          output: {
            status: "running",
            sub_session_id: "sub-1",
            expert: { name: "Curie" },
          },
          input: { prompt: "Create a chat app" },
        })}
        isLast
      />,
    );

    expect(await screen.findByText("Curie")).toBeDefined();
    expect(screen.getByText("running")).toBeDefined();
  });

  it("does not claim the teammate finished when the poll dies", async () => {
    server.use(
      http.get("/api/proxy/api/chat/sessions/:sessionId", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(
      <ChainRowView
        row={row({
          tool: "delegate_to_expert",
          state: "done",
          text: 'Teammate handled: "Create a chat app"',
          output: { status: "running", sub_session_id: "sub-1" },
          input: { prompt: "Create a chat app" },
        })}
        isLast
      />,
    );

    expect(await screen.findByText("unknown")).toBeDefined();
    expect(screen.queryByText("completed")).toBeNull();
  });

  it("switches to completed once the polled sub-session goes idle", async () => {
    server.use(subSession({ chat_status: "completed" }));

    render(
      <ChainRowView
        row={row({
          tool: "delegate_to_expert",
          state: "done",
          text: 'Teammate handled: "Create a chat app"',
          output: { status: "running", sub_session_id: "sub-1" },
          input: { prompt: "Create a chat app" },
        })}
        isLast
      />,
    );

    expect(await screen.findByText("completed")).toBeDefined();
  });

  it("shows a completed sub-agent as an identity row with a transcript link", () => {
    render(
      <ChainRowView
        row={row({
          tool: "delegate_to_expert",
          state: "done",
          output: {
            status: "completed",
            response: "The full response belongs in the child transcript.",
            sub_session_id: "run-id",
            sub_autopilot_session_id: "sub-1",
            sub_autopilot_session_link: "/copilot?sessionId=wrong-chat",
            expert: {
              id: "exp-1",
              name: "Curie",
              role: "Researcher",
              avatar_url: "https://cdn.example.com/curie.png",
            },
          },
        })}
        isLast
      />,
    );

    expect(screen.getByText("Curie")).toBeDefined();
    expect(screen.queryByText("Researcher")).toBeNull();
    expect(screen.getByText("completed")).toBeDefined();
    expect(screen.getByAltText("Curie").getAttribute("src")).toBe(
      "https://cdn.example.com/curie.png",
    );
    expect(
      screen
        .getByRole("link", { name: "Curie completed" })
        .getAttribute("href"),
    ).toBe("/copilot?sessionId=sub-1");
    expect(
      screen.queryByText("The full response belongs in the child transcript."),
    ).toBeNull();
  });

  it("keeps private links, polling and Stop out of a shared transcript", () => {
    const getSession = vi.fn(() => new HttpResponse(null, { status: 500 }));
    server.use(http.get("/api/proxy/api/chat/sessions/:sessionId", getSession));

    render(
      <ChainRowView
        row={row({
          tool: "run_sub_session",
          state: "done",
          output: {
            status: "running",
            background_task_id: "job-1",
            sub_session_id: "sub-1",
          },
        })}
        isLast
        readOnly
      />,
    );

    expect(screen.getByText("Background subtask")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Stop background subtask" }),
    ).toBeNull();
    expect(getSession).not.toHaveBeenCalled();
  });
});
