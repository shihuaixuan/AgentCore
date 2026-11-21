import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { getGraphLoadErrorToast } from "../graphLoadError";
import { describeSaveError } from "../saveGraphError";
import { notifySkippedWebhookPresets } from "../skippedWebhookPresets";
import type { SkippedWebhookPreset } from "@/app/api/__generated__/models/skippedWebhookPreset";

function chinese(_english: string, translation: string) {
  return translation;
}

describe("localized builder errors", () => {
  it("localizes only the structured validation summary, never custom messages or field data", () => {
    const detail = {
      type: "validation_error",
      message: "Workflow validation failed: 3 issues on 2 nodes",
      node_errors: { "node-ID": { "Field key": "Original diagnostic" } },
    };
    const error = new ApiError(detail.message, 400, { detail });
    expect(describeSaveError(error, chinese).description).toBe(
      "工作流校验失败：2 个节点中有 3 个问题。请修复高亮字段后重新保存。",
    );
    expect(describeSaveError(error).description).toContain(detail.message);
    const message = "My custom node › Field key: Original diagnostic";
    expect(
      describeSaveError(
        new ApiError(message, 400, { detail: { ...detail, message } }),
        chinese,
      ).description,
    ).toContain(message);
    expect(error.response.detail.node_errors["node-ID"]).toEqual({
      "Field key": "Original diagnostic",
    });
    expect(describeSaveError(new Error(""), chinese).description).toBe(
      "发生意外错误。",
    );
  });

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
