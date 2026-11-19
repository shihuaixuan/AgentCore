import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import { afterEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/components/molecules/Toast/use-toast";
import { CopyButton } from "../components/ChatMessagesContainer/components/CopyButton";
import { ChatOriginIcon } from "../components/ChatOriginIcon/ChatOriginIcon";
import { MessageImageThumbnail } from "../components/ChatMessagesContainer/components/MessageImageThumbnail";

vi.mock("@/components/molecules/Toast/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({ toast }),
}));

const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);

afterEach(() => {
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test("localizes copy failure recovery without changing clipboard text", async () => {
  const writeText = vi.fn().mockRejectedValue(new Error("Raw clipboard error"));
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(
    <LanguageProvider>
      <CopyButton text="Keep raw English /workspace/file" />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "复制" }));
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "复制失败",
        description: "你的浏览器可能不支持剪贴板访问，或发生了错误。",
      }),
    ),
  );
  expect(writeText).toHaveBeenCalledWith("Keep raw English /workspace/file");
});

test("localizes image actions but preserves the original title and URL", () => {
  render(
    <LanguageProvider>
      <MessageImageThumbnail
        artifact={{
          id: "raw-image-id",
          title: "Original Image.png",
          sourceUrl: "https://example.com/raw-image.png",
          mimeType: "image/png",
          origin: "user-upload",
        }}
      />
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("button", { name: "打开 Original Image.png" }),
  ).toBeDefined();
  expect(
    screen.getByRole("img", { name: "Original Image.png" }).getAttribute("src"),
  ).toBe("https://example.com/raw-image.png");
});

test("localizes source descriptions while preserving platform brands", () => {
  render(
    <LanguageProvider>
      <ChatOriginIcon sourcePlatform="github" />
    </LanguageProvider>,
  );
  expect(screen.getByTitle("来自 GitHub")).toBeDefined();
  expect(screen.getByRole("img", { name: "GitHub" })).toBeDefined();
});

test("keeps English defaults outside the language provider", () => {
  render(
    <>
      <CopyButton text="Raw text" />
      <ChatOriginIcon sourcePlatform="github" />
    </>,
  );
  expect(screen.getByRole("button", { name: "Copy" })).toBeDefined();
  expect(screen.getByTitle("From GitHub")).toBeDefined();
});
