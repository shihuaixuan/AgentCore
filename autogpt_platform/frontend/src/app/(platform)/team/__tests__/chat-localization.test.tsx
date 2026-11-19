import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
import { ExpertChatDrawer } from "../components/ExpertChatDrawer/ExpertChatDrawer";

vi.mock("../components/ExpertChatDrawer/useExpertChatDrawer", () => ({
  useExpertChatDrawer: () => ({
    sessionId: null,
    startNewThread: vi.fn(),
    messages: [],
    status: "ready",
    error: undefined,
    stop: vi.fn(),
    onSend: vi.fn(),
    onActionSend: vi.fn(),
    queuedMessages: [],
    isResolvingSession: false,
    isCreating: false,
    pendingSend: null,
    isTurnSettling: false,
  }),
}));

vi.mock("@/app/(platform)/copilot/components/ChatInput/ChatInput", () => ({
  ChatInput: () => null,
}));
vi.mock(
  "@/app/(platform)/copilot/components/ChatMessagesContainer/ChatMessagesContainer",
  () => ({ ChatMessagesContainer: () => null }),
);

function SwitchLanguage() {
  const { setLocale } = useTranslation();
  return <button onClick={() => setLocale("en")}>English</button>;
}

test("switches known chat roles and panel actions while preserving expert names", () => {
  render(
    <LanguageProvider>
      <SwitchLanguage />
      <ExpertChatDrawer
        target={{
          expertId: "original-expert",
          name: "Original Nova",
          role: "SEO & Content",
          avatarUrl: null,
        }}
        onClose={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("Original Nova · SEO 内容经理")).toBeDefined();
  expect(screen.getByRole("button", { name: "关闭聊天面板" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByText("Original Nova · SEO Content Manager")).toBeDefined();
  expect(
    screen.getByRole("button", { name: "Close chat panel" }),
  ).toBeDefined();
});

test("keeps custom chat roles verbatim in Chinese", () => {
  render(
    <LanguageProvider>
      <ExpertChatDrawer
        target={{
          expertId: "original-expert",
          name: "Original Nova",
          role: "Custom Role 自定义",
          avatarUrl: null,
        }}
        onClose={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("Original Nova · Custom Role 自定义")).toBeDefined();
});
