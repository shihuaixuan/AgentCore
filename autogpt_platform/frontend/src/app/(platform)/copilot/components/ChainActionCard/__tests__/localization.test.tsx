import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { expect, it, vi } from "vitest";
import { QuestionsSection } from "../QuestionsSection";
import { McpConnectorRow } from "../McpConnectorRow";

it("localizes question controls but preserves user-facing question values", () => {
  const skip = vi.fn();
  render(
    <LanguageProvider>
      <QuestionsSection
        requests={[
          {
            id: "raw",
            questions: [
              {
                keyword: "answer",
                question: "Keep this custom question",
                example: "Raw example",
              },
            ],
            answers: {},
            onAnswer: vi.fn(),
            onSkip: skip,
          },
        ]}
        isReady={false}
        onProceed={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("回答几个问题")).toBeDefined();
  expect(screen.getByText("Keep this custom question")).toBeDefined();
  expect(screen.getByPlaceholderText("例如：Raw example")).toBeDefined();
  expect(screen.getByRole("button", { name: "发送答案" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "跳过" }));
  expect(skip).toHaveBeenCalledOnce();
});

it("localizes a connector action without changing its service or destination", () => {
  const connect = vi.fn();
  render(
    <LanguageProvider>
      <McpConnectorRow
        request={{
          id: "mcp",
          service: "My MCP service",
          serverUrl: "https://mcp.example.com",
          connected: false,
          loading: false,
          error: null,
          showManualToken: false,
          authScheme: "bearer",
          grantable: false,
          granting: false,
          onGrant: vi.fn(),
          onConnect: connect,
          onUseToken: vi.fn(),
        }}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("My MCP service")).toBeDefined();
  expect(screen.getByText("mcp.example.com")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "连接" }));
  expect(connect).toHaveBeenCalledOnce();
});
