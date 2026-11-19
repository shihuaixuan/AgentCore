import { describe, expect, test } from "vitest";
import { buildTourArtifactRef } from "../helpers";
import {
  getNextTourScenario,
  getTourScenario,
  tourScenarios,
} from "../script/tourScenarios";

const scenarioCases = [
  {
    id: "daily-brief",
    label: "每日简报",
    prompt: "每天早上，把我的未读邮件和日程汇总成一份简报",
    heading: "# 今日简报 — 7 月 2 日，周四",
  },
  {
    id: "call-prep",
    label: "通话准备",
    prompt: "每次销售通话前，向我简要介绍对方的公司和参会人",
    heading: "# 通话准备 — Acme Corp · 下午 2:00",
  },
  {
    id: "competitor-watch",
    label: "竞品监测",
    prompt: "监测竞争对手的定价页面，价格变化时给我发邮件",
    heading: "# 检测到价格变化 — 竞品 Pro 方案",
  },
  {
    id: "support-queue",
    label: "客服工单",
    prompt: "对新客服工单分类，并为常见问题起草回复",
    heading: "# 工单已分类 — 14 张新工单",
  },
];

describe("Tour scenario localization", () => {
  test.each(scenarioCases)(
    "selects Chinese authored content for $id without translating identifiers",
    ({ id, label, prompt, heading }) => {
      const english = getTourScenario(id);
      const chinese = getTourScenario(id, "zh-CN");

      expect(chinese.label).toBe(label);
      expect(chinese.script[0].userPrompt).toBe(prompt);
      expect(chinese.completionArtifact.markdown).toContain(heading);
      expect(chinese.id).toBe(english.id);
      expect(chinese.icon).toEqual(english.icon);
      expect(chinese.completionArtifact.filename).toBe(
        english.completionArtifact.filename,
      );

      for (const [turnIndex, turn] of chinese.script.entries()) {
        const englishTurn = english.script[turnIndex];
        expect(turn.userPrompt).toMatch(/\p{Script=Han}/u);
        expect(turn.assistantMessageId).toBe(englishTurn.assistantMessageId);
        for (const [stepIndex, step] of turn.steps.entries()) {
          const englishStep = englishTurn.steps[stepIndex];
          expect(step.delayMs).toBe(englishStep.delayMs);
          expect(step.part.type).toBe(englishStep.part.type);
          const part = step.part;
          const englishPart = englishStep.part;
          if (part.type === "text") {
            expect(part.text).toMatch(/\p{Script=Han}/u);
          } else if (part.type === "plan" && englishPart.type === "plan") {
            expect(part.plan.goal).toMatch(/\p{Script=Han}/u);
            for (const [planIndex, planStep] of part.plan.steps.entries()) {
              expect(planStep.description).toMatch(/\p{Script=Han}/u);
              expect(planStep.blockName).toBe(
                englishPart.plan.steps[planIndex].blockName,
              );
            }
          } else if (part.type === "agent" && englishPart.type === "agent") {
            expect(part.agent.name).toMatch(/\p{Script=Han}/u);
            expect(part.agent.schedule).toMatch(/\p{Script=Han}/u);
            expect(part.agent.blocks).toEqual(englishPart.agent.blocks);
          } else if (part.type === "artifact") {
            expect(part.artifact.caption).toMatch(/\p{Script=Han}/u);
            expect(part.artifact.title).toMatch(/\p{Script=Han}/u);
            if (part.artifact.subtitle) {
              expect(part.artifact.subtitle).toMatch(/\p{Script=Han}/u);
            }
            for (const bullet of part.artifact.bullets ?? []) {
              expect(bullet).toMatch(/\p{Script=Han}/u);
            }
          }
        }
      }

      expect(getTourScenario(id, "en")).toEqual(english);
    },
  );

  test("preserves URLs, code blocks, names and identifiers in Chinese reports", () => {
    const competitor = getTourScenario("competitor-watch", "zh-CN");
    const english = getTourScenario("competitor-watch");
    expect(competitor.completionArtifact.markdown).toContain(
      "competitor.com/pricing",
    );
    expect(
      competitor.completionArtifact.markdown.match(/```diff[\s\S]*?```/)?.[0],
    ).toBe(
      english.completionArtifact.markdown.match(/```diff[\s\S]*?```/)?.[0],
    );
    expect(
      getTourScenario("call-prep", "zh-CN").completionArtifact.markdown,
    ).toContain("Dana Patel");
    expect(
      getTourScenario("support-queue", "zh-CN").completionArtifact.markdown,
    ).toContain("#support");
  });

  test("keeps unknown-scenario fallback and next-unwatched selection localized", () => {
    expect(getTourScenario("missing", "zh-CN").label).toBe("竞品监测");
    expect(
      getNextTourScenario("competitor-watch", ["support-queue"], "zh-CN").label,
    ).toBe("每日简报");
    expect(
      getNextTourScenario(
        "competitor-watch",
        tourScenarios.map((scenario) => scenario.id),
        "zh-CN",
      ).id,
    ).toBe("support-queue");
    expect(getTourScenario("competitor-watch").label).toBe("Competitor watch");
  });

  test("exports a readable UTF-8 Chinese artifact with its actual byte size", () => {
    const scenario = getTourScenario("daily-brief", "zh-CN");
    const artifact = buildTourArtifactRef(scenario);
    const markdown = decodeURIComponent(artifact.sourceUrl!.split(",")[1]);

    expect(markdown).toContain("## 📬 收件箱摘要");
    expect(artifact.title).toBe("daily-brief-jul-2.md");
    expect(artifact.id).toBe("tour-daily-brief");
    expect(artifact.mimeType).toBe("text/markdown");
    expect(artifact.sizeBytes).toBe(new Blob([markdown]).size);
  });
});
