import { describe, expect, it } from "vitest";
import { COPILOT_TOOL_CATALOG, getCatalogLabel } from "../toolCatalog";
import type { ToolDisplayContext } from "../toolCatalog.shared";

describe("getCatalogLabel", () => {
  it("returns null for tools missing from the catalog", () => {
    expect(getCatalogLabel("totally_unknown_tool", {}, "running")).toBeNull();
  });

  it("builds running, done and error labels around the subject", () => {
    const input = { query: "copilot news" };

    expect(getCatalogLabel("web_search", input, "running")).toEqual({
      category: "web",
      text: 'Searching the web for "copilot news"…',
    });
    expect(getCatalogLabel("web_search", input, "done")).toEqual({
      category: "web",
      text: 'Searched the web for "copilot news"',
    });
    expect(getCatalogLabel("web_search", input, "error")).toEqual({
      category: "web",
      text: 'Failed while searching the web for "copilot news"',
    });
  });

  it("omits the subject when input is not an object", () => {
    expect(getCatalogLabel("web_search", undefined, "running")?.text).toBe(
      "Searching the web for…",
    );
    expect(getCatalogLabel("web_search", "raw", "done")?.text).toBe(
      "Searched the web for",
    );
  });

  it("truncates long subjects with an ellipsis", () => {
    const url = `https://example.com/${"a".repeat(80)}`;
    const text = getCatalogLabel("web_fetch", { url }, "done")?.text ?? "";

    expect(text.startsWith('Fetched "https://example.com/')).toBe(true);
    expect(text.endsWith('…"')).toBe(true);
    expect(text.length).toBeLessThan(url.length);
  });

  it.each([
    ["bash_exec", { command: "ls -la" }, "done", 'Ran command "ls -la"'],
    [
      "browser_navigate",
      { url: "https://agpt.co" },
      "running",
      'Opening "https://agpt.co"…',
    ],
    ["read_workspace_file", { path: "notes.md" }, "done", 'Read "notes.md"'],
    [
      "read_workspace_file",
      { filename: "notes.md" },
      "done",
      'Read "notes.md"',
    ],
    [
      "write_workspace_file",
      { filename: "out.csv" },
      "running",
      'Writing "out.csv"…',
    ],
    ["delete_workspace_file", { path: "tmp.txt" }, "done", 'Deleted "tmp.txt"'],
    [
      "delete_workspace_file",
      { filename: "tmp.txt" },
      "done",
      'Deleted "tmp.txt"',
    ],
    [
      "post_to_chat_platform",
      { channel: "#general" },
      "done",
      'Posted to "#general"',
    ],
    ["run_block", { block_name: "Web Search" }, "done", "Ran block"],
    [
      "run_block",
      { block_id: "abcdefabcdefabcdefabcdef" },
      "done",
      "Ran block",
    ],
    [
      "run_mcp_tool",
      { tool_name: "list_issues" },
      "done",
      'Ran MCP tool "list_issues"',
    ],
    [
      "search_docs",
      { query: "webhooks" },
      "done",
      'Searched docs for "webhooks"',
    ],
    [
      "get_doc_page",
      { path: "platform/blocks" },
      "done",
      "Read doc page platform/blocks",
    ],
    ["store_skill", { name: "scraper" }, "done", 'Saved skill "scraper"'],
    ["read_skill", { name: "scraper" }, "running", 'Reading skill "scraper"…'],
    ["delete_skill", { name: "scraper" }, "done", 'Deleted skill "scraper"'],
    [
      "connect_integration",
      { provider: "github" },
      "running",
      "Connecting github…",
    ],
    [
      "search_feature_requests",
      { query: "dark mode" },
      "done",
      'Searched feature requests for "dark mode"',
    ],
    [
      "create_feature_request",
      { title: "Dark mode" },
      "done",
      'Filed feature request "Dark mode"',
    ],
    ["TodoWrite", {}, "done", "Updated tasks"],
    ["TodoWrite", {}, "error", "Failed while updating tasks"],
    ["get_platform_info", {}, "running", "Checking platform info…"],
  ])("labels platform tool %s", (tool, input, state, expected) => {
    expect(
      getCatalogLabel(tool, input, state as "running" | "done" | "error")?.text,
    ).toBe(expected);
  });

  it.each([
    [
      "decompose_goal",
      { goal: "Track prices" },
      "done",
      'Broke down the goal "Track prices"',
    ],
    ["find_block", { query: "email" }, "done", 'Found blocks for "email"'],
    [
      "find_agent",
      { query: "scraper" },
      "running",
      'Finding workflows for "scraper"…',
    ],
    [
      "find_library_agent",
      { query: "newsletter" },
      "done",
      'Searched your library for "newsletter"',
    ],
    [
      "memory_search",
      { query: "budget" },
      "done",
      'Searched memory for "budget"',
    ],
    [
      "memory_store",
      { name: "preferences" },
      "done",
      'Stored memory "preferences"',
    ],
    ["create_folder", { name: "Reports" }, "done", 'Created folder "Reports"'],
    ["update_folder", { name: "Reports" }, "done", 'Updated folder "Reports"'],
    [
      "run_agent",
      { username_agent_slug: "abhi/scraper" },
      "done",
      "Ran workflow",
    ],
    [
      "run_agent",
      { library_agent_id: "0123456789012345678901234" },
      "done",
      "Ran workflow",
    ],
    ["add_understanding", {}, "done", "Noted context"],
    ["enter_agent_building_mode", {}, "running", "Entering building mode…"],
  ])("labels agent tool %s", (tool, input, state, expected) => {
    expect(
      getCatalogLabel(tool, input, state as "running" | "done" | "error")?.text,
    ).toBe(expected);
  });

  it("truncates run_sub_session prompts to 45 characters", () => {
    const prompt = "Investigate every failing pipeline in the workspace today";
    const text =
      getCatalogLabel("run_sub_session", { prompt }, "running")?.text ?? "";

    expect(text.startsWith('Delegating subtask: "Investigate')).toBe(true);
    expect(text.endsWith('…"…')).toBe(true);
  });

  it("reads ask_question subjects from the direct field or the array", () => {
    expect(
      getCatalogLabel("ask_question", { question: "Which region?" }, "done")
        ?.text,
    ).toBe('Asked you a question "Which region?"');

    expect(
      getCatalogLabel(
        "ask_question",
        { questions: [{ question: "Which format?" }] },
        "done",
      )?.text,
    ).toBe('Asked you a question "Which format?"');

    expect(
      getCatalogLabel("ask_question", { questions: ["plain"] }, "done")?.text,
    ).toBe("Asked you a question");

    expect(getCatalogLabel("ask_question", {}, "done")?.text).toBe(
      "Asked you a question",
    );
  });

  it("ignores blank and non-string subject values", () => {
    expect(getCatalogLabel("web_search", { query: "   " }, "done")?.text).toBe(
      "Searched the web for",
    );
    expect(getCatalogLabel("web_search", { query: 42 }, "done")?.text).toBe(
      "Searched the web for",
    );
  });

  it("labels the expert team tools", () => {
    expect(
      getCatalogLabel("hire_expert", { template_id: "tpl" }, "done"),
    ).toEqual({ category: "team", text: "Ready to hire" });
    expect(getCatalogLabel("raise_expert", { name: "Otto" }, "done")).toEqual({
      category: "team",
      text: 'Ready to create "Otto"',
    });
    expect(
      getCatalogLabel(
        "confirm_expert_change",
        { confirmation_id: "c" },
        "done",
      ),
    ).toEqual({ category: "team", text: "Added to the team" });
    expect(
      getCatalogLabel("handoff_to_expert", { prompt: "own it" }, "done")?.text,
    ).toBe('Handed over: "own it"');
    expect(
      getCatalogLabel(
        "consult_teammate",
        { question: "Does this commit us to a refund?" },
        "running",
      ),
    ).toEqual({
      category: "team",
      text: 'Asking a teammate to check: "Does this commit us to a refund?"…',
    });
    expect(
      getCatalogLabel(
        "consult_teammate",
        { question: "Does this commit us to a refund?" },
        "done",
      )?.text,
    ).toBe('Teammate checked: "Does this commit us to a refund?"');
    expect(getCatalogLabel("find_session", {}, "running")).toEqual({
      category: "team",
      text: "Looking for a session…",
    });
    expect(getCatalogLabel("find_session", {}, "done")?.text).toBe(
      "Found sessions",
    );
    // The message is quoted and truncated, so the row never carries the whole
    // payload into the chain label.
    expect(
      getCatalogLabel(
        "message_session",
        { message: "the numbers are in" },
        "done",
      )?.text,
    ).toBe('Messaged a session: "the numbers are in"');
  });

  it("labels the capability tools by what they act on", () => {
    expect(
      getCatalogLabel("find_capability", { query: "linear issue" }, "running")
        ?.text,
    ).toBe('Searching capabilities for "linear issue"…');
    expect(
      getCatalogLabel("describe_capability", { id: "block:abc" }, "done")?.text,
    ).toBe('Read capability "block:abc"');
  });

  it("names a run by its block, falling back to the capability id", () => {
    // The display name only arrives once the run reports back, so the id
    // has to carry the label until then.
    expect(
      getCatalogLabel(
        "run_capability",
        { id: "tool:list_schedules" },
        "running",
      )?.text,
    ).toBe('Running "tool:list_schedules"…');
    expect(
      getCatalogLabel("run_capability", { id: "block:abc" }, "done", {
        displayName: "Send Web Request",
      })?.text,
    ).toBe('Ran "Send Web Request"');
    expect(
      getCatalogLabel("resume_capability", { review_id: "r" }, "done", {
        displayName: "Send Web Request",
      })?.text,
    ).toBe('Resumed "Send Web Request"');
  });

  describe("localization", () => {
    const states = ["running", "done", "error"] as const;
    const toolNames = Object.keys(COPILOT_TOOL_CATALOG);

    it("localizes Chinese status labels around the raw subject", () => {
      const input = { query: "Searching the web for" };

      expect(
        getCatalogLabel("web_search", input, "running", {}, "zh-CN"),
      ).toEqual({
        category: "web",
        text: '正在搜索网页 "Searching the web for"…',
      });
      expect(getCatalogLabel("web_search", input, "done", {}, "zh-CN")).toEqual(
        {
          category: "web",
          text: '已搜索网页 "Searching the web for"',
        },
      );
      expect(
        getCatalogLabel("web_search", input, "error", {}, "zh-CN"),
      ).toEqual({
        category: "web",
        text: '执行失败：正在搜索网页 "Searching the web for"',
      });
    });

    it.each(toolNames)("localizes all static states for %s", (toolName) => {
      for (const state of states) {
        const label = getCatalogLabel(toolName, {}, state, {}, "zh-CN");

        expect(label?.category).toBe(COPILOT_TOOL_CATALOG[toolName].category);
        expect(label?.text).toMatch(/[\u3400-\u9fff]/);
        expect(label?.text.replaceAll("MCP", "")).not.toMatch(/[A-Za-z]/);
        expect(label?.emptyResult).toBeUndefined();
        if (state === "running") expect(label?.text.endsWith("…")).toBe(true);
        if (state === "error")
          expect(label?.text.startsWith("执行失败：")).toBe(true);
      }
    });

    it.each(toolNames)("preserves the English default for %s", (toolName) => {
      const meta = COPILOT_TOOL_CATALOG[toolName];
      const expected = {
        running: `${meta.running}…`,
        done: meta.done,
        error: `Failed while ${meta.running.charAt(0).toLowerCase()}${meta.running.slice(1)}`,
      };

      for (const state of states) {
        expect(getCatalogLabel(toolName, {}, state)).toEqual({
          category: meta.category,
          text: expected[state],
        });
        expect(getCatalogLabel(toolName, {}, state, {}, "en")).toEqual(
          getCatalogLabel(toolName, {}, state),
        );
      }
    });

    it.each(
      toolNames.filter((toolName) => COPILOT_TOOL_CATALOG[toolName].empty),
    )("localizes the empty lookup for %s", (toolName) => {
      const output = { items: [] };
      const emptyText =
        toolName === "list_team"
          ? "暂无成员"
          : toolName === "list_chat_platform_channels"
            ? "未找到结果"
            : "暂无";
      const label = getCatalogLabel(toolName, {}, "done", { output }, "zh-CN");

      expect(label?.emptyResult).toBe(true);
      expect(label?.text).toMatch(/[\u3400-\u9fff]/);
      expect(label?.text).not.toMatch(/[A-Za-z]/);
      expect(label?.text.endsWith(` – ${emptyText}`)).toBe(true);
      expect(getCatalogLabel(toolName, {}, "done", { output })).toEqual({
        category: COPILOT_TOOL_CATALOG[toolName].category,
        text: `${COPILOT_TOOL_CATALOG[toolName].done} – ${COPILOT_TOOL_CATALOG[toolName].empty}`,
        emptyResult: true,
      });
    });

    it("only marks completed empty lookups as empty", () => {
      const context = { output: { folders: [] } };

      expect(
        getCatalogLabel("list_folders", {}, "done", context, "zh-CN"),
      ).toEqual({
        category: "folder",
        text: "已列出文件夹 – 暂无",
        emptyResult: true,
      });
      expect(
        getCatalogLabel("list_folders", {}, "running", context, "zh-CN"),
      ).toEqual({
        category: "folder",
        text: "正在列出文件夹…",
      });
      expect(
        getCatalogLabel("list_folders", {}, "error", context, "zh-CN"),
      ).toEqual({
        category: "folder",
        text: "执行失败：正在列出文件夹",
      });
      expect(
        getCatalogLabel(
          "list_folders",
          {},
          "done",
          { output: { folders: [{ name: "Reports" }] } },
          "zh-CN",
        ),
      ).toEqual({ category: "folder", text: "已列出文件夹" });
    });

    it.each<[string, Record<string, unknown>, ToolDisplayContext, string]>([
      [
        "bash_exec",
        { command: "echo 'Running command'" },
        {},
        "\"echo 'Running command'\"",
      ],
      ["read_workspace_file", { path: "Read/notes.md" }, {}, '"Read/notes.md"'],
      [
        "web_fetch",
        { url: "https://example.com/Fetching?id=42" },
        {},
        '"https://example.com/Fetching?id=42"',
      ],
      [
        "describe_capability",
        { id: "tool:list_schedules" },
        {},
        '"tool:list_schedules"',
      ],
      ["get_doc_page", { path: "platform/blocks" }, {}, "platform/blocks"],
      ["connect_integration", { provider: "github" }, {}, "github"],
      [
        "run_agent",
        {},
        { displayName: "Created workflow" },
        '"Created workflow"',
      ],
      [
        "run_agent",
        {},
        { output: { graph_name: "Updated tasks" } },
        '"Updated tasks"',
      ],
      [
        "run_block",
        {},
        { output: { block_name: "Send Web Request" } },
        '"Send Web Request"',
      ],
      ["run_mcp_tool", { tool_name: "list_issues" }, {}, '"list_issues"'],
    ])(
      "keeps the dynamic subject of %s untranslated",
      (toolName, input, context, subject) => {
        const originalInput = structuredClone(input);
        const originalContext = structuredClone(context);

        for (const state of states) {
          const text = getCatalogLabel(
            toolName,
            input,
            state,
            context,
            "zh-CN",
          )?.text;

          expect(text).toContain(subject);
          expect(text).toMatch(/[\u3400-\u9fff]/);
        }
        expect(input).toEqual(originalInput);
        expect(context).toEqual(originalContext);
      },
    );

    it.each([undefined, null, "raw", { query: "   " }, { query: 42 }])(
      "omits invalid subjects in Chinese labels for %j",
      (input) => {
        expect(
          getCatalogLabel("web_search", input, "running", undefined, "zh-CN")
            ?.text,
        ).toBe("正在搜索网页…");
      },
    );

    it("keeps subject truncation unchanged in Chinese", () => {
      const url = `https://example.com/${"a".repeat(80)}`;

      expect(
        getCatalogLabel("web_fetch", { url }, "done", {}, "zh-CN")?.text,
      ).toBe(`已获取 "${url.slice(0, 60)}…"`);
    });

    it("still returns null for unknown tools in Chinese", () => {
      expect(
        getCatalogLabel("totally_unknown_tool", {}, "running", {}, "zh-CN"),
      ).toBeNull();
    });
  });
});
