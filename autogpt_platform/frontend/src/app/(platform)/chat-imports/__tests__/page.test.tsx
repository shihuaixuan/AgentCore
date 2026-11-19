import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ArchiveSummary } from "../api";
import ChatImportsPage from "../page";
import {
  addRecentToolOnlyConversations,
  makeQwenWorkFixture,
  pickedFile,
} from "./qwenWorkFixture";

const auth = vi.hoisted(() => ({
  user: { id: "owner" } as { id: string } | null,
}));
vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: auth.user, isUserLoading: false }),
}));
vi.mock("../readQwenWorkInWorker", async () => {
  const { readQwenWorkDatabase } = await import("../qwenWorkDatabase");
  return { readQwenWorkInWorker: readQwenWorkDatabase };
});

const workBuddyChat = {
  source: "workbuddy",
  source_id: "a".repeat(64),
  title: "Work notes",
  messages: [
    { role: "user", text: "First question" },
    { role: "assistant", text: "<img src=example>\n**Literal text**" },
  ],
};

function setup(
  locale: "en" | "zh-CN" = "en",
  archiveSource: ArchiveSummary["source"] = "workbuddy",
) {
  const summary = {
    id: "archive-id",
    source: archiveSource,
    title: "Saved chat",
    created_at: null,
    imported_at: "2026-09-01T12:00:00Z",
    message_count: 2,
  };
  const saved = {
    ...summary,
    attachments: [{ id: "file-id", name: "notes.md", size: 12 }],
    messages: [
      ...workBuddyChat.messages,
      { role: "user", text: "2026-09-01T12:00:00Z" },
    ],
  };
  let deleted = false;
  const request = vi.fn(async (url: string, init: RequestInit) => {
    const path = new URL(url, "http://localhost");
    expect(path.pathname).toMatch(
      /^\/api\/proxy\/api\/chat\/imports(?:\/(?:archive-id|with-attachments|archive-id\/attachments\/file-id))?$/,
    );
    if (init.method === "POST")
      return Response.json({ added: 1, duplicates: 1 });
    if (init.method === "DELETE") {
      deleted = true;
      return new Response(null, { status: 204 });
    }
    if (path.pathname.endsWith("/attachments/file-id")) {
      return new Response(new Uint8Array([0, 255]), {
        headers: { "Content-Type": "application/octet-stream" },
      });
    }
    if (path.pathname.endsWith("/archive-id")) return Response.json(saved);
    const isFirstPage = path.searchParams.get("offset") === "0";
    expect(path.searchParams.get("limit")).toBe("25");
    return Response.json({
      items: deleted || isFirstPage ? [] : [summary],
      has_more: !deleted && isFirstPage,
    });
  });
  vi.stubGlobal("fetch", request);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <LanguageProvider initialLocale={locale}>
        <ChatImportsPage />
      </LanguageProvider>
    </QueryClientProvider>,
  );
  return { request, user: userEvent.setup() };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  auth.user = { id: "owner" };
});

describe("conversation archive", () => {
  it("imports a checked QwenWork conversation without Web Crypto or posting its database", async () => {
    vi.stubGlobal("crypto", {});
    const { request, user } = setup();
    await user.click(screen.getByRole("tab", { name: "QwenWork" }));
    const panel = screen.getByRole("tabpanel", { name: "QwenWork" });
    const db = pickedFile(
      "QwenWorkCN/data/agents.db",
      await makeQwenWorkFixture(),
    );
    const unrelated = pickedFile(
      "QwenWorkCN/cache/private.db",
      "unrelated content",
    );
    const readUnrelated = vi.spyOn(unrelated, "arrayBuffer");
    fireEvent.change(within(panel).getByLabelText("QwenWork history folder"), {
      target: { files: [unrelated, db] },
    });
    const first = await within(panel).findByRole("checkbox", {
      name: "Select Local fixture",
    });
    const save = within(panel).getByRole<HTMLButtonElement>("button", {
      name: "Save selected",
    });
    expect(save.disabled).toBe(true);
    expect(within(panel).queryByText("Deleted fixture")).toBeNull();
    await user.click(
      within(first.closest("li")!).getByRole("button", { name: "Preview" }),
    );
    expect(
      within(panel).getByText("<img src=example>").querySelector("img"),
    ).toBeNull();
    expect(within(panel).queryByText(/PRIVATE TOOL INPUT/)).toBeNull();
    expect(readUnrelated).not.toHaveBeenCalled();
    await user.click(first);
    expect(request.mock.calls.every(([, init]) => init.method === "GET")).toBe(
      true,
    );
    await user.click(save);
    await within(panel).findByText("Saved: 1. Duplicates skipped: 1.");
    const post = request.mock.calls.find(([, init]) => init.method === "POST")!;
    expect(post[0]).toBe("/api/proxy/api/chat/imports");
    expect(new Headers(post[1].headers).get("x-archive-destination")).toBe(
      '["owner","owner"]',
    );
    expect(JSON.parse(String(post[1].body))).toEqual({
      conversations: [
        {
          source: "qwenwork",
          source_id: expect.stringMatching(/^[0-9a-f]{64}$/),
          title: "Local fixture",
          messages: [
            {
              role: "user",
              text: "A local question",
              timestamp: "2026-09-01T12:00:00.000Z",
            },
            {
              role: "assistant",
              text: "<img src=example>",
              timestamp: "2026-09-01T12:00:01.000Z",
            },
            { role: "assistant", text: "Second sub-chat" },
          ],
        },
      ],
    });
  });

  it("saves only explicitly checked QwenWork attachments and not local paths", async () => {
    const { request, user } = setup();
    await user.click(screen.getByRole("tab", { name: "QwenWork" }));
    const panel = within(screen.getByRole("tabpanel", { name: "QwenWork" }));
    const db = pickedFile("data/agents.db", await makeQwenWorkFixture());
    fireEvent.change(panel.getByLabelText("QwenWork history folder"), {
      target: { files: [db] },
    });
    const chat = await panel.findByRole("checkbox", {
      name: "Select Local fixture",
    });
    await user.click(
      within(chat.closest("li")!).getByRole("button", { name: "Preview" }),
    );

    const report = pickedFile("Project/output/report.pdf", "report bytes");
    fireEvent.change(panel.getByLabelText("Choose attachment folder"), {
      target: { files: [report] },
    });
    await user.click(
      panel.getByRole("checkbox", {
        name: "Use this folder for the original path",
      }),
    );
    fireEvent.change(panel.getByLabelText("Choose individual attachments"), {
      target: { files: [db, new File(["not requested"], "unused.txt")] },
    });

    const attachment = panel.getByRole("checkbox", {
      name: "Include report.pdf",
    });
    expect(attachment.getAttribute("aria-checked")).toBe("false");
    expect(
      panel
        .getByRole("checkbox", { name: "Include unused.txt" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      panel.queryByRole("checkbox", { name: "Include agents.db" }),
    ).toBeNull();
    await user.click(attachment);
    await user.click(chat);
    expect(
      request.mock.calls.filter(([, init]) => init.method === "POST"),
    ).toEqual([]);
    await user.click(panel.getByRole("button", { name: "Save selected" }));
    await panel.findByText("Saved: 1. Duplicates skipped: 1.");

    const posts = request.mock.calls.filter(
      ([, init]) => init.method === "POST",
    );
    expect(posts).toHaveLength(1);
    const [[url, init]] = posts;
    expect(url).toBe("/api/proxy/api/chat/imports/with-attachments");
    const body = init.body as FormData;
    expect([...body.keys()]).toEqual(["conversation", "files"]);
    const conversation = String(body.get("conversation"));
    expect(JSON.parse(conversation)).toMatchObject({
      source: "qwenwork",
      title: "Local fixture",
    });
    expect(conversation).not.toMatch(
      /D:\/Project|report\.pdf|PRIVATE TOOL INPUT/,
    );
    const file = body.get("files") as File;
    expect(file.name).toBe("report.pdf");
    expect(await file.text()).toBe("report bytes");
  });

  it("can preview older chats when the newest batch has no text", async () => {
    const { request, user } = setup();
    await user.click(screen.getByRole("tab", { name: "QwenWork" }));
    const panel = within(screen.getByRole("tabpanel", { name: "QwenWork" }));
    const db = pickedFile(
      "data/agents.db",
      await makeQwenWorkFixture(addRecentToolOnlyConversations),
    );
    fireEvent.change(panel.getByLabelText("QwenWork history folder"), {
      target: { files: [db] },
    });
    const older = await panel.findByRole("button", {
      name: "Older conversations",
    });
    expect(
      panel.queryByRole("checkbox", { name: "Select Local fixture" }),
    ).toBeNull();
    await user.click(older);
    expect(
      await panel.findByRole("checkbox", { name: "Select Local fixture" }),
    ).toBeDefined();
    await user.click(
      panel.getByRole("button", { name: "Newer conversations" }),
    );
    await panel.findByText(
      "No supported local text conversations in this batch.",
    );
    expect(request.mock.calls.every(([, init]) => init.method === "GET")).toBe(
      true,
    );
  });

  it("reports a renamed database selected as an attachment without sending any conversation", async () => {
    const { request, user } = setup();
    await user.click(screen.getByRole("tab", { name: "QwenWork" }));
    const panel = within(screen.getByRole("tabpanel", { name: "QwenWork" }));
    const bytes = await makeQwenWorkFixture();
    fireEvent.change(panel.getByLabelText("QwenWork history folder"), {
      target: { files: [pickedFile("data/agents.db", bytes)] },
    });
    const chat = await panel.findByRole("checkbox", {
      name: "Select Local fixture",
    });
    await user.click(
      within(chat.closest("li")!).getByRole("button", { name: "Preview" }),
    );
    fireEvent.change(panel.getByLabelText("Choose individual attachments"), {
      target: { files: [new File([bytes], "backup.txt")] },
    });
    await user.click(
      panel.getByRole("checkbox", { name: "Include backup.txt" }),
    );
    await user.click(chat);
    await user.click(panel.getByRole("button", { name: "Save selected" }));
    expect((await panel.findByRole("alert")).textContent).toContain(
      "Uncheck the database file",
    );
    expect(request.mock.calls.every(([, init]) => init.method === "GET")).toBe(
      true,
    );
  });

  it("matches an authorized directory locally and uploads only checked attachment bytes", async () => {
    const { request, user } = setup();
    const transcript = new File(
      [
        JSON.stringify({
          type: "message",
          sessionId: "with-files",
          id: "first",
          role: "assistant",
          cwd: "E:/Project",
          content: [
            { type: "output_text", text: "The report is ready." },
            { type: "output_file", path: "out/report.pdf" },
            { type: "output_file", path: "out/notes.md" },
            { type: "output_file", path: "E:/Project-old/out/private.txt" },
            { type: "output_file", path: "other/private.txt" },
          ],
        }),
      ],
      "activity.jsonl",
    );
    function pick(relativePath: string, text: string) {
      const file = new File([text], relativePath.split("/").at(-1)!);
      Object.defineProperty(file, "webkitRelativePath", {
        value: relativePath,
      });
      return file;
    }
    fireEvent.change(screen.getByLabelText("Choose WorkBuddy files"), {
      target: { files: [transcript] },
    });
    const chat = await screen.findByRole("checkbox", {
      name: "Select WorkBuddy",
    });
    await user.click(screen.getByRole("button", { name: "Preview" }));
    fireEvent.change(screen.getByLabelText("Choose attachment folder"), {
      target: {
        files: [
          pick("Project/out/report.pdf", "report bytes"),
          pick("Project/out/notes.md", "unchecked"),
          pick("Project/out/private.txt", "must not match"),
        ],
      },
    });
    expect(
      screen.queryByRole("checkbox", { name: "Include report.pdf" }),
    ).toBeNull();
    await user.click(
      screen.getByRole("checkbox", {
        name: "Use this folder for the original path",
      }),
    );
    const report = screen.getByRole("checkbox", { name: "Include report.pdf" });
    expect(report.getAttribute("aria-checked")).toBe("false");
    expect(
      screen
        .getByRole("checkbox", { name: "Include notes.md" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      screen.queryByRole("checkbox", { name: "Include private.txt" }),
    ).toBeNull();
    expect(screen.getByText("E:/Project-old/out/private.txt")).toBeDefined();
    const manual = new File(["manual bytes"], "manual.txt");
    fireEvent.change(screen.getByLabelText("Choose individual attachments"), {
      target: { files: [manual] },
    });
    const manualChoice = screen.getByRole("checkbox", {
      name: "Include manual.txt",
    });
    expect(manualChoice.getAttribute("aria-checked")).toBe("false");
    await user.click(report);
    await user.click(manualChoice);
    await user.click(chat);
    expect(request.mock.calls.every(([, init]) => init.method === "GET")).toBe(
      true,
    );
    await user.click(screen.getByRole("button", { name: "Save selected" }));
    await screen.findByText("Saved: 1. Duplicates skipped: 1.");
    const post = request.mock.calls.find(([, init]) => init.method === "POST")!;
    expect(post[0]).toBe("/api/proxy/api/chat/imports/with-attachments");
    const body = post[1].body as FormData;
    expect([...body.keys()]).toEqual(["conversation", "files", "files"]);
    const archiveJSON = body.get("conversation") as string;
    expect(JSON.parse(archiveJSON)).toEqual({
      source: "workbuddy",
      source_id: expect.stringMatching(/^[0-9a-f]{64}$/),
      title: "WorkBuddy",
      messages: [{ role: "assistant", text: "The report is ready." }],
    });
    const files = body.getAll("files") as File[];
    expect(files.map(({ name }) => name)).toEqual(["report.pdf", "manual.txt"]);
    expect(await Promise.all(files.map((file) => file.text()))).toEqual([
      "report bytes",
      "manual bytes",
    ]);
  });

  it("previews native WorkBuddy files without Web Crypto or uploading the originals", async () => {
    vi.stubGlobal("crypto", {});
    const { request, user } = setup();
    function nativeFile(sessionID: string, title: string) {
      const records = [
        { type: "ai-title", sessionId: sessionID, aiTitle: title },
        {
          type: "message",
          sessionId: sessionID,
          id: "first",
          role: "assistant",
          content: [{ type: "output_text", text: "Preview text" }],
        },
        {
          type: "function_call",
          sessionId: sessionID,
          arguments: "Private tool input",
        },
      ];
      return new File(
        [records.map((record) => JSON.stringify(record)).join("\n")],
        `${sessionID}.jsonl`,
      );
    }

    fireEvent.change(screen.getByLabelText("Choose WorkBuddy files"), {
      target: {
        files: [
          nativeFile("session-a", "Keep this"),
          nativeFile("session-b", "Skip this"),
        ],
      },
    });
    const checkbox = await screen.findByRole("checkbox", {
      name: "Select Keep this",
    });
    const unselected = screen.getByRole("checkbox", {
      name: "Select Skip this",
    });
    expect(unselected.getAttribute("aria-checked")).toBe("false");
    await user.click(
      within(checkbox.closest("li")!).getByRole("button", { name: "Preview" }),
    );
    expect(screen.getByText("Preview text")).toBeDefined();
    expect(request.mock.calls.every(([, init]) => init.method === "GET")).toBe(
      true,
    );
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "Save selected" }));
    await screen.findByText("Saved: 1. Duplicates skipped: 1.");
    const post = request.mock.calls.find(([, init]) => init.method === "POST");
    expect(JSON.parse(String(post?.[1].body))).toEqual({
      conversations: [
        {
          source: "workbuddy",
          source_id: expect.stringMatching(/^[0-9a-f]{64}$/),
          title: "Keep this",
          messages: [{ role: "assistant", text: "Preview text" }],
        },
      ],
    });
  });

  it("keeps the selected chats and files available for retry after a partial save", async () => {
    const { request, user } = setup();
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          conversations: [
            workBuddyChat,
            { ...workBuddyChat, source_id: "b".repeat(64), title: "Follow-up" },
          ],
        }),
      ],
      "workbuddy.json",
    );
    fireEvent.change(screen.getByLabelText("Choose WorkBuddy files"), {
      target: { files: [file] },
    });
    const notes = await screen.findByRole("checkbox", {
      name: "Select Work notes",
    });
    const followUp = screen.getByRole("checkbox", { name: "Select Follow-up" });
    await user.click(
      within(followUp.closest("li")!).getByRole("button", { name: "Preview" }),
    );
    fireEvent.change(screen.getByLabelText("Choose individual attachments"), {
      target: { files: [new File(["notes"], "notes.txt")] },
    });
    const attachment = screen.getByRole("checkbox", {
      name: "Include notes.txt",
    });
    await user.click(attachment);
    await user.click(notes);
    await user.click(followUp);
    const original = request.getMockImplementation()!;
    let tries = 0;
    request.mockImplementation(async (url, init) => {
      if (url.endsWith("/with-attachments") && ++tries === 1) {
        return Response.json({ detail: "Unavailable" }, { status: 503 });
      }
      if (init.method === "POST")
        return Response.json({ added: 1, duplicates: 0 });
      return original(url, init);
    });
    const save = screen.getByRole("button", { name: "Save selected" });
    await user.click(save);
    await screen.findByText(
      "Confirmed so far: 1 new chats, 0 already archived. Some requests did not finish. You can retry this selection.",
    );
    expect(followUp.getAttribute("aria-checked")).toBe("true");
    expect(attachment.getAttribute("aria-checked")).toBe("true");
    await user.click(save);
    await screen.findByText("Saved: 1. Duplicates skipped: 0.");
    const posts = request.mock.calls.filter(
      ([, init]) => init.method === "POST",
    );
    expect(posts.map(([url]) => url.split("/").at(-1))).toEqual([
      "imports",
      "with-attachments",
      "with-attachments",
    ]);
    expect((posts[1][1].body as FormData).get("conversation")).toEqual(
      (posts[2][1].body as FormData).get("conversation"),
    );
    expect((posts[2][1].body as FormData).getAll("files")).toHaveLength(1);
  });

  it("previews real text locally and sends only checked WorkBuddy entries after Save", async () => {
    const { request, user } = setup();
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          conversations: [
            workBuddyChat,
            { ...workBuddyChat, source_id: "b".repeat(64), title: "Leave out" },
          ],
        }),
      ],
      "workbuddy.json",
    );
    fireEvent.change(screen.getByLabelText("Choose WorkBuddy files"), {
      target: { files: [file] },
    });
    const checkbox = await screen.findByRole("checkbox", {
      name: "Select Work notes",
    });
    expect(checkbox.getAttribute("aria-label")).toBeNull();
    expect(checkbox.closest(".ph-no-capture")).not.toBeNull();
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    const save = screen.getByRole<HTMLButtonElement>("button", {
      name: "Save selected",
    });
    expect(save.disabled).toBe(true);
    const row = checkbox.closest("li")!;
    await user.click(within(row).getByRole("button", { name: "Preview" }));
    const text = screen.getByText("<img src=example> **Literal text**");
    expect(text.textContent).toBe(workBuddyChat.messages[1].text);
    expect(text.closest(".ph-no-capture")).not.toBeNull();
    expect(text.querySelector("img")).toBeNull();
    await user.click(checkbox);
    expect(request.mock.calls.every(([, init]) => init.method === "GET")).toBe(
      true,
    );
    await user.click(save);
    await screen.findByText("Saved: 1. Duplicates skipped: 1.");
    const post = request.mock.calls.find(([, init]) => init.method === "POST");
    expect(JSON.parse(String(post?.[1].body))).toEqual({
      conversations: [workBuddyChat],
    });
  });

  it("offers only the two native sources but still opens existing Qianwen archives", async () => {
    const { user } = setup("zh-CN", "qianwen");
    const tabs = within(screen.getByRole("tablist", { name: "导入来源" }));
    expect(tabs.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "WorkBuddy",
      "千问办公",
    ]);
    expect(screen.queryByText(/通义千问/)).toBeNull();

    await user.click(await screen.findByRole("button", { name: "下一页" }));
    expect(await screen.findByText(/通义千问 · 2 条消息/)).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Saved chat" }));
    expect(await screen.findByText("First question")).toBeDefined();
  });

  it("pages through the archive, opens saved text, and confirms deletion", async () => {
    const { request, user } = setup();
    await user.click(await screen.findByRole("button", { name: "Next page" }));
    const row = await screen.findByRole("button", { name: "Saved chat" });
    expect(row.closest(".ph-no-capture")).not.toBeNull();
    expect(row.getAttribute("aria-label")).toBeNull();
    expect(row.getAttribute("title")).toBeNull();
    await user.click(row);
    expect(
      (await screen.findByText("First question")).closest(".ph-no-capture"),
    ).not.toBeNull();
    expect(screen.getByText("2026-09-01T12:00:00Z")).toBeDefined();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test");
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe("notes.md");
        expect(this.href).toBe("blob:test");
      });
    try {
      await user.click(screen.getByRole("button", { name: "notes.md" }));
      await waitFor(() => expect(click).toHaveBeenCalledOnce());
      const [downloaded] = createObjectURL.mock.calls[0];
      if (!(downloaded instanceof Blob))
        throw new Error("Expected a file download");
      expect(new Uint8Array(await downloaded.arrayBuffer())).toEqual(
        new Uint8Array([0, 255]),
      );
      expect(
        request.mock.calls.find(([url]) =>
          url.endsWith("/attachments/file-id"),
        )?.[1],
      ).toMatchObject({ method: "GET", cache: "no-store", redirect: "error" });
    } finally {
      createObjectURL.mockRestore();
      click.mockRestore();
    }
    await user.click(
      screen.getByRole("button", { name: "Delete from archive" }),
    );
    expect(
      request.mock.calls.some(([, init]) => init.method === "DELETE"),
    ).toBe(false);
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    await screen.findByText("No saved conversations yet.");
    expect(
      request.mock.calls.some(([, init]) => init.method === "DELETE"),
    ).toBe(true);
  });

  it("does not fetch or accept drafts before authentication", () => {
    auth.user = null;
    const { request } = setup();
    expect(screen.queryByRole("tab", { name: "WorkBuddy" })).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });
});
