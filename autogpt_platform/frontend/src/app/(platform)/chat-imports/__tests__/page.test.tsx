import { webcrypto } from "node:crypto";
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
import ChatImportsPage from "../page";

const auth = vi.hoisted(() => ({
  user: { id: "owner" } as { id: string } | null,
}));
vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: auth.user, isUserLoading: false }),
}));

const workBuddyChat = {
  source: "workbuddy",
  source_id: "a".repeat(64),
  title: "Work notes",
  messages: [
    { role: "user", text: "First question" },
    { role: "assistant", text: "<img src=example>\n**Literal text**" },
  ],
};

function setup(locale: "en" | "zh-CN" = "en") {
  const summary = {
    id: "archive-id",
    source: "workbuddy",
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
  it("matches an authorized directory locally and uploads only checked attachment bytes", async () => {
    vi.stubGlobal("crypto", webcrypto);
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

  it("previews native WorkBuddy files without uploading the originals", async () => {
    vi.stubGlobal("crypto", webcrypto);
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

  it("saves repeated Qianwen pairs in order in Chinese", async () => {
    const { request, user } = setup("zh-CN");
    await user.click(screen.getByRole("tab", { name: "通义千问" }));
    for (const label of ["标题", "问题", "回答"]) {
      const field = screen.getByLabelText(label);
      expect(field.closest(".ph-no-capture")).not.toBeNull();
      expect(field.getAttribute("spellcheck")).toBe("false");
    }
    await user.type(screen.getByLabelText("标题"), "调研");
    await user.type(screen.getByLabelText("问题"), "你好？");
    await user.type(screen.getByLabelText("回答"), "你好！");
    await user.click(screen.getByRole("button", { name: "添加问答" }));
    const second = screen.getByRole("group", { name: "问答 2" });
    await user.type(within(second).getByLabelText("问题"), "接下来呢？");
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "保存到归档" })
        .disabled,
    ).toBe(true);
    await user.type(within(second).getByLabelText("回答"), "继续。正在记录。");
    expect(request.mock.calls.every(([, init]) => init.method === "GET")).toBe(
      true,
    );
    await user.click(screen.getByRole("button", { name: "保存到归档" }));
    await screen.findByText("已保存 1 条，已跳过 1 条重复对话。");
    const post = request.mock.calls.find(([, init]) => init.method === "POST");
    expect(JSON.parse(String(post?.[1].body))).toEqual({
      conversations: [
        {
          source: "qianwen",
          title: "调研",
          messages: [
            { role: "user", text: "你好？" },
            { role: "assistant", text: "你好！" },
            { role: "user", text: "接下来呢？" },
            { role: "assistant", text: "继续。正在记录。" },
          ],
        },
      ],
    });
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
