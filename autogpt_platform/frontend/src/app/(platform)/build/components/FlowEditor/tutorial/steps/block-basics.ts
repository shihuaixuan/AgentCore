import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import { TUTORIAL_SELECTORS } from "../constants";
import {
  waitForElement,
  waitForNodeOnCanvas,
  closeBlockMenu,
  fitViewToScreen,
  highlightElement,
  removeAllHighlights,
} from "../helpers";
import { ICONS } from "../icons";
import { banner } from "../styles";

export const createBlockBasicsSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  {
    id: "focus-new-block",
    title: t("Your First Block!", "你的第一个模块！"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Excellent! This is your <strong>Calculator Block</strong>.", "很好！这就是你的<strong>计算器模块</strong>。")}</p>
        <p class="text-body font-normal text-foreground-emphasis m-0" style="margin-top: 0.5rem;">${t("Let's explore how blocks work.", "接下来了解模块的工作方式。")}</p>
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.REACT_FLOW_NODE,
      on: "right",
    },
    beforeShowPromise: async () => {
      closeBlockMenu();
      await waitForNodeOnCanvas(5000);
      await new Promise((resolve) => setTimeout(resolve, 300));
      fitViewToScreen();
    },
    when: {
      show: () => {
        const node = document.querySelector(TUTORIAL_SELECTORS.REACT_FLOW_NODE);
        if (node) {
          highlightElement(TUTORIAL_SELECTORS.REACT_FLOW_NODE);
        }
      },
      hide: () => {
        removeAllHighlights();
      },
    },
    buttons: [
      {
        text: t("Show me", "带我看看"),
        action: () => tour.next(),
      },
    ],
  },

  {
    id: "input-handles",
    title: t("Input Handles", "输入连接点"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("On the <strong>left side</strong> of the block are <strong>input handles</strong>.", "模块<strong>左侧</strong>是<strong>输入连接点</strong>。")}</p>
        <p class="text-body font-normal text-foreground-emphasis m-0" style="margin-top: 0.5rem;">${t("These are where data flows <em>into</em> the block from other blocks.", "其他模块的数据从这里<em>流入</em>此模块。")}</p>
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.NODE_INPUT_HANDLE,
      on: "bottom",
    },
    classes: "new-builder-tour input-handles-step",
    beforeShowPromise: () =>
      waitForElement(TUTORIAL_SELECTORS.NODE_INPUT_HANDLE, 3000).catch(
        () => {},
      ),
    buttons: [
      {
        text: t("Back", "上一步"),
        action: () => tour.back(),
        classes: "shepherd-button-secondary",
      },
      {
        text: t("Next", "下一步"),
        action: () => tour.next(),
      },
    ],
  },

  {
    id: "output-handles",
    title: t("Output Handles", "输出连接点"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("On the <strong>right side</strong> is the <strong>output handle</strong>.", "模块<strong>右侧</strong>是<strong>输出连接点</strong>。")}</p>
        <p class="text-body font-normal text-foreground-emphasis m-0" style="margin-top: 0.5rem;">${t("This is where the result flows <em>out</em> to connect to other blocks.", "结果从这里<em>流出</em>，传递给其他模块。")}</p>
        ${banner(ICONS.Drag, t("You can drag from output to input handler to connect blocks", "从输出连接点拖动到输入连接点，即可连接模块"), "info")}
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.NODE_OUTPUT_HANDLE,
      on: "right",
    },
    beforeShowPromise: () =>
      waitForElement(TUTORIAL_SELECTORS.NODE_OUTPUT_HANDLE, 3000).catch(
        () => {},
      ),
    buttons: [
      {
        text: t("Back", "上一步"),
        action: () => tour.back(),
        classes: "shepherd-button-secondary",
      },
      {
        text: t("Next →", "下一步 →"),
        action: () => tour.next(),
      },
    ],
  },
];
