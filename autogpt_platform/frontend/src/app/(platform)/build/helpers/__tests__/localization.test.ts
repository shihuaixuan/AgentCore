import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { getGraphLoadErrorToast } from "../graphLoadError";
import { notifySkippedWebhookPresets } from "../skippedWebhookPresets";
import type { SkippedWebhookPreset } from "@/app/api/__generated__/models/skippedWebhookPreset";

function chinese(_english: string, translation: string) {
  return translation;
}

describe("localized builder errors", () => {
  it("localizes missing graph feedback and preserves backend diagnostics", () => {
    const error = new ApiError("graph English diagnostic", 404, null);
    expect(getGraphLoadErrorToast(error, chinese)).toEqual({
      title: "未找到工作流",
      description: "graph English diagnostic",
    });
    expect(getGraphLoadErrorToast(null, chinese)).toEqual({
      title: "无法加载工作流",
      description: "发生意外错误。",
    });
    expect(getGraphLoadErrorToast(error).title).toBe("Workflow not found");
  });

  it("warns about incompatible triggers in Chinese without changing preset names", () => {
    const toast = vi.fn();
    notifySkippedWebhookPresets(
      toast,
      [{ name: "English preset" } as SkippedWebhookPreset],
      chinese,
    );
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "触发器预设需要重新配置",
        description: expect.stringMatching(
          /English preset.*新版本使用了不同的触发器/,
        ),
      }),
    );
  });
});
