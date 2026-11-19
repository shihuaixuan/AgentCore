import { describe, expect, it } from "vitest";
import {
  humanizeCronExpression,
  safeHumanizeCronExpression,
} from "../cron-expression-utils";
import { formatInTimezone, getTimezoneDisplayName } from "../timezone-utils";
import { getFileSizeError, isFileTooLarge } from "../direct-upload";
import {
  getMicrosoftServicePurpose,
  getMicrosoftSetupMessage,
  getMicrosoftStatusLabel,
  microsoftCallbackMessage,
} from "../microsoft-setup";
import { getPlanLabel } from "@/services/billing/subscription-plan";
import {
  getLearningLabel,
  reuseLabel,
  stepChanges,
} from "@/services/skill-learning/helpers";
import { formatDate } from "@/lib/utils/time";
import {
  formatWhen as memoryWhen,
  getScopeName,
  getMemoryChatPrompt,
} from "@/app/(platform)/settings/memory/helpers";
import { formatWhen as toolWhen } from "@/app/(platform)/copilot/components/ToolChain/resultHelpers";

describe("Chinese display helpers", () => {
  it("localizes memory seeds, missing scopes and dates without changing raw values", () => {
    expect(getMemoryChatPrompt("summary", "zh-CN")).toBe(
      "请总结你记住的所有关于我的信息",
    );
    expect(getMemoryChatPrompt("summary")).toBe(
      "Give me a summary of everything you know about me",
    );
    expect(getScopeName("missing", [], "zh-CN")).toBe("这位专家");
    expect(
      memoryWhen(new Date(Date.now() - 300_000).toISOString(), "zh-CN"),
    ).toBe("5 分钟前");
    expect(toolWhen("2026-11-18T09:00:00Z", "zh-CN")).toContain("11月18日");
    expect(toolWhen("Raw invalid date", "zh-CN")).toBe("Raw invalid date");
    expect(formatDate(new Date("2026-11-18T09:00:00Z"), "zh-CN")).toContain(
      "2026年11月18日",
    );
  });
  it("localizes scheduling sentences without modifying cron expressions", () => {
    expect(humanizeCronExpression("0 9 * * 1-3", "zh-CN")).toBe(
      "每周一、周二、周三 09:00",
    );
    expect(humanizeCronExpression("*/5 * * * *", "zh-CN")).toBe("每 5 分钟");
    expect(humanizeCronExpression("0 12 1 1,6,12 *", "zh-CN")).toBe(
      "每年 1月、6月、12月的第 1 天 12:00",
    );
    expect(humanizeCronExpression("0 9 * * 1")).toBe("Every Monday at 09:00");
    expect(safeHumanizeCronExpression("invalid", "zh-CN")).toBe("已安排");
  });

  it("localizes date fallbacks and month names", () => {
    expect(formatInTimezone(null, "UTC", undefined, "zh-CN")).toBe("未安排");
    expect(
      formatInTimezone("2026-11-18T09:00:00Z", "UTC", undefined, "zh-CN"),
    ).toContain("11月18日");
    expect(getTimezoneDisplayName("not-set", "zh-CN")).toBe("未设置");
    expect(getTimezoneDisplayName("UTC", "zh-CN")).toBe("UTC");
  });

  it("localizes generated upload messages and preserves file names", () => {
    const file = new File([new Uint8Array(2 * 1024 * 1024)], "My report.txt");
    expect(getFileSizeError(file, 1, "zh-CN")).toBe(
      "文件过大（2.0 MB）。最大允许 1 MB，请选择较小的文件。",
    );
    let title = "";
    expect(
      isFileTooLarge({
        file,
        maxSizeMB: 1,
        locale: "zh-CN",
        toast: (notice) => {
          title = notice.title;
        },
      }),
    ).toBe(true);
    expect(title).toBe("文件过大");
    expect(file.name).toBe("My report.txt");
  });

  it("localizes Microsoft setup labels without changing error codes or brands", () => {
    expect(getMicrosoftStatusLabel("admin_required", "zh-CN")).toBe(
      "需要 Microsoft 管理员批准",
    );
    expect(getMicrosoftServicePurpose("teams", "zh-CN")).toContain("Teams");
    expect(getMicrosoftSetupMessage("access_denied", "zh-CN")).toContain(
      "现有连接仍可使用",
    );
    expect(
      microsoftCallbackMessage("access_denied", "AADSTS65004", "zh-CN"),
    ).toContain("AADSTS65004: Microsoft 访问请求被拒绝");
  });

  it("localizes plan and generated skill labels while preserving source text", () => {
    expect(getLearningLabel("Saved overnight", "zh-CN")).toBe("夜间保存");
    expect(getLearningLabel("Custom English content", "zh-CN")).toBe(
      "Custom English content",
    );
    expect(
      reuseLabel(
        {
          use: { loads: 3, reuse_label: "Loaded 3 times · Outcome unknown" },
        } as unknown as Parameters<typeof reuseLabel>[0],
        "zh-CN",
      ),
    ).toBe("已加载 3 次 · 结果未知");
    expect(getPlanLabel("NO_TIER", "zh-CN")).toBe("无有效订阅");
    expect(getPlanLabel("BUSINESS", "zh-CN")).toBe("团队版");
    expect(getPlanLabel("Custom Plan", "zh-CN")).toBe("Custom Plan");
    expect(
      stepChanges(
        "1. Original English text",
        "1. Changed English text",
        "zh-CN",
      ),
    ).toEqual([
      {
        step: "步骤 1",
        before: "Original English text",
        after: "Changed English text",
      },
    ]);
    expect(
      reuseLabel(
        { use: null } as unknown as Parameters<typeof reuseLabel>[0],
        "zh-CN",
      ),
    ).toBe("尚未复用");
  });
});
