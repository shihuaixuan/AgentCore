import type { ToolUIPart } from "ai";
import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { CopilotChatActionsContext } from "../../components/CopilotChatActionsProvider/useCopilotChatActions";
import { SuggestedGoalCard } from "../CreateAgent/components/SuggestedGoalCard";
import { DecomposeGoalTool } from "../DecomposeGoal/DecomposeGoal";
import { BlockInputCard } from "../RunBlock/components/BlockInputCard/BlockInputCard";
import { FindCapabilitiesTool } from "../FindCapabilities/FindCapabilities";

test("localizes suggested goal actions without changing tool content or submitted goals", () => {
  const onUseSuggestedGoal = vi.fn();
  render(
    <LanguageProvider>
      <SuggestedGoalCard
        message="Raw model explanation"
        suggestedGoal="Original English goal"
        goalType="unachievable"
        onUseSuggestedGoal={onUseSuggestedGoal}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("无法完成此目标")).toBeDefined();
  expect(screen.getByText("Raw model explanation")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "使用此目标" }));
  expect(onUseSuggestedGoal).toHaveBeenCalledWith("Original English goal");
});

test("localizes decomposition recovery and preserves the retry instruction", () => {
  const onSend = vi.fn();
  render(
    <LanguageProvider>
      <CopilotChatActionsContext value={{ onSend, chatSurface: "copilot" }}>
        <DecomposeGoalTool
          part={
            {
              type: "tool-decompose_goal",
              toolCallId: "raw-call",
              state: "output-error",
              input: {},
              errorText: "Raw error",
            } as ToolUIPart
          }
        />
      </CopilotChatActionsContext>
    </LanguageProvider>,
  );
  expect(screen.getByText("分析目标失败。请重试。")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  expect(onSend).toHaveBeenCalledWith("Please try decomposing the goal again.");
});

test("localizes input disclosure without translating field names or raw values", () => {
  render(
    <LanguageProvider>
      <BlockInputCard
        inputData={{ raw_field: "Original English /workspace/path" }}
      />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "显示输入（1）" }));
  expect(screen.getByText("raw_field")).toBeDefined();
  expect(screen.getByText("Original English /workspace/path")).toBeDefined();
  expect(screen.getByRole("button", { name: "隐藏输入" })).toBeDefined();
});

test("localizes capability badges and result counts while preserving service data", () => {
  render(
    <LanguageProvider>
      <FindCapabilitiesTool
        part={{
          type: "tool-find_capability",
          toolCallId: "raw-call",
          state: "output-available",
          input: { query: "Raw query" },
          output: {
            type: "capability_list",
            query: "Raw query",
            count: 1,
            capabilities: [
              {
                id: "raw-service",
                name: "GitHub",
                purpose: "Raw English purpose",
                kind: "mcp_server",
                connected: "needs_expert_grant",
              },
            ],
          },
        }}
      />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { expanded: false }));
  expect(screen.getByText("需要授权")).toBeDefined();
  expect(screen.getByText("集成")).toBeDefined();
  expect(screen.getByText("Raw English purpose")).toBeDefined();
  expect(screen.getByText("GitHub")).toBeDefined();
});
