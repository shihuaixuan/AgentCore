import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@/tests/integrations/test-utils";
import { toast } from "@/components/molecules/Toast/use-toast";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AppEnv, environment } from "@/services/environment";
import { Key, storage } from "@/services/storage/local-storage";
import {
  countAnswerTowardStarToast,
  resetStarToastCounts,
} from "../githubStarToast";

vi.mock("@/components/molecules/Toast/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({ toast }),
}));

afterEach(() => {
  storage.clean(Key.GITHUB_STAR_PROMPT_COUNT);
  resetStarToastCounts();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test("localizes the real star toast content and preserves its external destination", () => {
  vi.spyOn(environment, "getAppEnv").mockReturnValue(AppEnv.LOCAL);
  storage.set(Key.GITHUB_STAR_PROMPT_COUNT, "4");
  countAnswerTowardStarToast({
    messages: [
      {
        id: "raw-prompt",
        role: "user",
        parts: [{ type: "text", text: "Original English prompt" }],
      },
    ],
  });
  const shown = vi.mocked(toast).mock.calls[0][0];
  render(
    <LanguageProvider>
      <p>{shown.title}</p>
      <p>{shown.description}</p>
      {shown.action}
    </LanguageProvider>,
  );
  expect(screen.getByText("喜欢 AutoGPT 吗？")).toBeDefined();
  expect(
    screen.getByText("在 GitHub 上点亮 Star，让更多人发现这个项目。"),
  ).toBeDefined();
  expect(
    screen
      .getByRole("link", { name: /在 GitHub 上点亮 Star/ })
      .getAttribute("href"),
  ).toBe("https://github.com/Significant-Gravitas/AutoGPT");
  expect(screen.getByText("（在新标签页中打开）")).toBeDefined();
});
