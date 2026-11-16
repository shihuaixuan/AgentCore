import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import { handleTutorialSkip } from "../helpers";

export const createWelcomeSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  {
    id: "welcome",
    title: t("Welcome to AutoGPT Builder! 👋🏻", "欢迎使用 AutoGPT 编辑器！👋🏻"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("This interactive tutorial will teach you how to build your first AI workflow.", "本交互教程将教你创建第一个 AI 工作流。")}</p>
        <p class="text-body font-medium text-foreground-emphasis m-0" style="margin-top: 0.75rem;">${t("You'll learn how to:", "你将学会：")}</p>
        <ul class="pl-2 text-body leading-5 pt-2">
          <li>${t("- Add blocks to your workflow", "- 向工作流添加模块")}</li>
          <li>${t("- Understand block inputs and outputs", "- 理解模块的输入与输出")}</li>
          <li>${t("- Save and run your workflow", "- 保存并运行工作流")}</li>
          <li>${t("- and much more...", "- 以及更多操作…")}</li>
        </ul>
        <p class="text-caption font-normal text-foreground-tertiary m-0" style="margin-top: 0.75rem;">${t("Estimated time: 3-4 minutes", "预计用时：3–4 分钟")}</p>
      </div>
    `,
    buttons: [
      {
        text: t("Skip Tutorial", "跳过教程"),
        action: () => handleTutorialSkip(tour),
        classes: "shepherd-button-secondary",
      },
      {
        text: t("Let's Begin", "开始学习"),
        action: () => tour.next(),
      },
    ],
  },
];
