import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import { TUTORIAL_SELECTORS } from "../constants";
import {
  waitForElement,
  fitViewToScreen,
  highlightElement,
  removeAllHighlights,
} from "../helpers";
import { ICONS } from "../icons";
import { banner } from "../styles";

export const createRunSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  {
    id: "press-run",
    title: t("Run Your Workflow", "运行工作流"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Your workflow is saved and ready! Now let's <strong>run it</strong> to see it in action.", "工作流已保存并准备就绪！现在<strong>运行它</strong>，看看实际效果。")}</p>
        ${banner(ICONS.ClickIcon, t("Click the Run button", "点击运行按钮"), "action")}
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.RUN_BUTTON,
      on: "top",
    },
    advanceOn: {
      selector: TUTORIAL_SELECTORS.RUN_BUTTON,
      event: "click",
    },
    beforeShowPromise: () =>
      waitForElement(TUTORIAL_SELECTORS.RUN_BUTTON, 3000).catch(() => {}),
    when: {
      show: () => {
        highlightElement(TUTORIAL_SELECTORS.RUN_BUTTON);
      },
      hide: () => {
        removeAllHighlights();
        setTimeout(() => {
          fitViewToScreen();
        }, 500);
      },
    },
    buttons: [],
  },

  {
    id: "show-output",
    title: t("View the Output", "查看输出"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Here's the <strong>output</strong> of your block!", "这里显示模块的<strong>输出</strong>！")}</p>
        
        <div class="mt-3 p-3 bg-info-surface ring-1 ring-info/30 rounded-2xl">
          <p class="text-body leading-5 font-medium text-info-foreground m-0">${t("Latest Output:", "最新输出：")}</p>
          <p class="text-body-sm leading-inherit text-info-foreground m-0 mt-1">${t("After each run, you can see the result of each block at the bottom of the block.", "每次运行后，都可以在各模块底部查看结果。")}</p>
        </div>
        
        <div class="mt-2 p-2 bg-surface-hover ring-1 ring-border-base rounded-xl">
          <p class="text-body-sm leading-inherit text-foreground-secondary m-0">${t("The output shows:", "输出内容包括：")}</p>
          <ul class="text-body-sm leading-inherit text-foreground-tertiary m-0 mt-1 pl-4">
            <li>${t("• The calculated result", "• 计算结果")}</li>
            <li>${t("• Execution timestamp", "• 运行时间")}</li>
          </ul>
        </div>
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.FIRST_CALCULATOR_NODE_OUTPUT,
      on: "top",
    },
    beforeShowPromise: () =>
      waitForElement(TUTORIAL_SELECTORS.FIRST_CALCULATOR_NODE_OUTPUT, 20000)
        .then(async () => {
          fitViewToScreen();
          // fitView animates the viewport over 800ms. Wait for it to settle so
          // Shepherd measures the output at its final position before opening
          // the overlay — otherwise the spotlight lands where the output used
          // to be and the output stays hidden under the dimmed overlay.
          await new Promise((resolve) => setTimeout(resolve, 900));
        })
        .catch(() => {}),
    when: {
      show: () => {
        highlightElement(TUTORIAL_SELECTORS.FIRST_CALCULATOR_NODE_OUTPUT);
      },
      hide: () => {
        removeAllHighlights();
      },
    },
    buttons: [
      {
        text: t("Finish Tutorial", "完成教程"),
        action: () => tour.next(),
      },
    ],
  },
];
