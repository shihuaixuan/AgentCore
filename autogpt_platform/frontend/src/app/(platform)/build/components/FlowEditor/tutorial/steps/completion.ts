import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";

export const createCompletionSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  {
    id: "congratulations",
    title: t("Congratulations! 🎉", "恭喜！🎉"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("You have successfully created and run your first workflow!", "你已成功创建并运行第一个工作流！")}</p>
        
        <div class="mt-3 p-3 bg-success-surface ring-1 ring-success/40 rounded-2xl">
          <p class="text-body leading-5 font-medium text-success m-0">${t("You learned how to:", "你已学会：")}</p>
          <ul class="text-body-sm leading-inherit text-success m-0 pl-4 mt-2 space-y-1">
            <li>${t("• Add blocks from the Block Menu", "• 从模块菜单添加模块")}</li>
            <li>${t("• Understand input and output handles", "• 理解输入与输出连接点")}</li>
            <li>${t("• Configure block values", "• 配置模块数值")}</li>
            <li>${t("• Connect blocks together", "• 连接模块")}</li>
            <li>${t("• Save and run your workflow", "• 保存并运行工作流")}</li>
            <li>${t("• View execution status and output", "• 查看运行状态与输出")}</li>
          </ul>
        </div>
        
        <p class="text-body font-medium text-foreground-emphasis m-0" style="margin-top: 0.75rem;">${t("Happy building! 🚀", "祝你构建顺利！🚀")}</p>
      </div>
    `,
    when: {
      show: () => {
        const modal = document.querySelector(
          ".shepherd-modal-overlay-container",
        );
        if (modal) {
          (modal as HTMLElement).style.opacity = "0.3";
        }
      },
    },
    buttons: [
      {
        text: t("Restart Tutorial", "重新开始教程"),
        action: () => {
          tour.cancel();
          setTimeout(() => tour.start(), 100);
        },
        classes: "shepherd-button-secondary",
      },
      {
        text: t("Finish", "完成"),
        action: () => tour.complete(),
      },
    ],
  },
];
