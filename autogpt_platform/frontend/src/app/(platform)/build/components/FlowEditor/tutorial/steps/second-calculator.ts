import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import {
  waitForNodesCount,
  fitViewToScreen,
  highlightElement,
  removeAllHighlights,
  addSecondCalculatorBlock,
  getSecondCalculatorNode,
} from "../helpers";
import { ICONS } from "../icons";
import { banner } from "../styles";

const getSecondCalculatorFormSelector = (): string | HTMLElement => {
  const secondNode = getSecondCalculatorNode();
  if (secondNode) {
    const selector = `[data-id="form-creator-container-${secondNode.id}-node"]`;
    const element = document.querySelector(selector);
    if (element) {
      return element as HTMLElement;
    }
    return selector;
  }
  const formContainers = document.querySelectorAll(
    '[data-id^="form-creator-container-"]',
  );
  if (formContainers.length >= 2) {
    return formContainers[1] as HTMLElement;
  }
  return '[data-id^="form-creator-container-"]';
};

const getSecondCalcRequirementsHtml = (
  t: TutorialTranslate = englishTutorialText,
) => `
  <div id="second-calc-requirements-box" class="mt-3 p-3 bg-warning-surface ring-1 ring-warning-border rounded-2xl">
    <p id="second-calc-requirements-title" class="text-body leading-5 font-medium text-warning-foreground m-0 mb-2">${t("⚠️ Required to continue:", "⚠️ 继续前请完成：")}</p>
    <ul id="second-calc-requirements-list" class="text-body-sm leading-inherit text-warning-foreground m-0 pl-4 space-y-1">
      <li id="req2-b" class="flex items-center gap-2">
        <span class="req-icon">○</span>${t(" Enter a number in field <strong>B</strong> (e.g., 2)", " 在字段 <strong>B</strong> 中输入数字（例如 2）")}
      </li>
      <li id="req2-op" class="flex items-center gap-2">
        <span class="req-icon">○</span>${t(" Select an <strong>Operation</strong> (e.g., Multiply)", " 选择<strong>运算</strong>（例如乘法）")}
      </li>
    </ul>
    <p class="text-caption leading-inherit text-warning m-0 mt-2 italic">${t("Note: Field A will be connected from the first Calculator's output", "提示：字段 A 将连接到第一个计算器的输出")}</p>
  </div>
`;

const updateSecondCalcToSuccessState = (
  t: TutorialTranslate = englishTutorialText,
) => {
  const reqBox = document.querySelector("#second-calc-requirements-box");
  const reqTitle = document.querySelector("#second-calc-requirements-title");
  const reqList = document.querySelector("#second-calc-requirements-list");

  if (reqBox && reqTitle) {
    reqBox.classList.remove("bg-warning-surface", "ring-warning-border");
    reqBox.classList.add("bg-success-surface", "ring-success/40");
    reqTitle.classList.remove("text-warning-foreground");
    reqTitle.classList.add("text-success");
    reqTitle.innerHTML = t(
      "🎉 Hurray! All values are completed!",
      "🎉 所有数值已填写完成！",
    );
    if (reqList) {
      reqList.classList.add("hidden");
    }
  }
};

const updateSecondCalcToWarningState = (
  t: TutorialTranslate = englishTutorialText,
) => {
  const reqBox = document.querySelector("#second-calc-requirements-box");
  const reqTitle = document.querySelector("#second-calc-requirements-title");
  const reqList = document.querySelector("#second-calc-requirements-list");

  if (reqBox && reqTitle) {
    reqBox.classList.remove("bg-success-surface", "ring-success/40");
    reqBox.classList.add("bg-warning-surface", "ring-warning-border");
    reqTitle.classList.remove("text-success");
    reqTitle.classList.add("text-warning-foreground");
    reqTitle.innerHTML = t("⚠️ Required to continue:", "⚠️ 继续前请完成：");
    if (reqList) {
      reqList.classList.remove("hidden");
    }
  }
};

export const createSecondCalculatorSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  {
    id: "adding-second-calculator",
    title: t("Adding Second Calculator", "添加第二个计算器"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Great job configuring the first Calculator!", "你已完成第一个计算器的配置！")}</p>
        <p class="text-body font-normal text-foreground-emphasis m-0" style="margin-top: 0.5rem;">${t("Now let's add a <strong>second Calculator block</strong> and connect them together.", "现在添加<strong>第二个计算器模块</strong>，并将它们连接起来。")}</p>
        
        <div class="mt-3 p-3 bg-info-surface ring-1 ring-info/30 rounded-2xl">
          <p class="text-body leading-5 font-medium text-info-foreground m-0 mb-1">${t("We'll create a chain:", "我们将创建如下链路：")}</p>
          <p class="text-body-sm leading-inherit text-info-foreground m-0">${t("Calculator 1 → Calculator 2", "计算器 1 → 计算器 2")}</p>
          <p class="text-caption leading-inherit text-info m-0 mt-1 italic">${t("The output of the first will feed into the second!", "第一个模块的输出将作为第二个模块的输入！")}</p>
        </div>
      </div>
    `,
    buttons: [
      {
        text: t("Back", "上一步"),
        action: () => tour.back(),
        classes: "shepherd-button-secondary",
      },
      {
        text: t("Add Second Calculator", "添加第二个计算器"),
        action: () => tour.next(),
      },
    ],
  },

  {
    id: "second-calculator-added",
    title: t("Second Calculator Added! ✅", "第二个计算器已添加！✅"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("I've added a <strong>second Calculator block</strong> to your canvas.", "已在画布中添加<strong>第二个计算器模块</strong>。")}</p>
        <p class="text-body font-normal text-foreground-emphasis m-0" style="margin-top: 0.5rem;">${t("Now let's configure it and connect them together.", "接下来配置它，并连接两个模块。")}</p>
        
        <div class="mt-3 p-3 bg-success-surface ring-1 ring-success/40 rounded-2xl">
          <p class="text-body leading-5 font-medium text-success m-0">${t("You now have 2 Calculator blocks!", "现在你有两个计算器模块了！")}</p>
        </div>
      </div>
    `,
    beforeShowPromise: async () => {
      addSecondCalculatorBlock();
      await waitForNodesCount(2, 5000);
      await new Promise((resolve) => setTimeout(resolve, 500));
      fitViewToScreen();
    },
    buttons: [
      {
        text: t("Let's configure it", "开始配置"),
        action: () => tour.next(),
      },
    ],
  },

  {
    id: "configure-second-calculator",
    title: t("Configure Second Calculator", "配置第二个计算器"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Now configure the <strong>second Calculator block</strong>.", "现在配置<strong>第二个计算器模块</strong>。")}</p>
        ${getSecondCalcRequirementsHtml(t)}
        ${banner(ICONS.ClickIcon, t("Fill in field B and select an Operation", "填写字段 B 并选择运算"), "action")}
      </div>
    `,
    beforeShowPromise: async () => {
      fitViewToScreen();
      await new Promise<void>((resolve) => {
        const checkNode = () => {
          const secondNode = getSecondCalculatorNode();
          if (secondNode) {
            const formContainer = document.querySelector(
              `[data-id="form-creator-container-${secondNode.id}-node"]`,
            );
            if (formContainer) {
              resolve();
            } else {
              setTimeout(checkNode, 100);
            }
          } else {
            setTimeout(checkNode, 100);
          }
        };
        checkNode();
      });
    },
    attachTo: {
      element: getSecondCalculatorFormSelector,
      on: "right",
    },
    when: {
      show: () => {
        const secondNode = getSecondCalculatorNode();
        if (secondNode) {
          highlightElement(`[data-id="custom-node-${secondNode.id}"]`);
        }

        let wasComplete = false;

        const checkInterval = setInterval(() => {
          const secondNode = getSecondCalculatorNode();
          if (!secondNode) return;

          const hardcodedValues = secondNode.data?.hardcodedValues || {};
          const hasB =
            hardcodedValues.b !== undefined &&
            hardcodedValues.b !== null &&
            hardcodedValues.b !== "";
          const hasOp =
            hardcodedValues.operation !== undefined &&
            hardcodedValues.operation !== null &&
            hardcodedValues.operation !== "";

          const allComplete = hasB && hasOp;

          const reqB = document.querySelector("#req2-b .req-icon");
          const reqOp = document.querySelector("#req2-op .req-icon");

          if (reqB) reqB.textContent = hasB ? "✓" : "○";
          if (reqOp) reqOp.textContent = hasOp ? "✓" : "○";

          const reqBEl = document.querySelector("#req2-b");
          const reqOpEl = document.querySelector("#req2-op");

          if (reqBEl) {
            reqBEl.classList.toggle("text-success", hasB);
            reqBEl.classList.toggle("text-warning-foreground", !hasB);
          }
          if (reqOpEl) {
            reqOpEl.classList.toggle("text-success", hasOp);
            reqOpEl.classList.toggle("text-warning-foreground", !hasOp);
          }

          if (allComplete && !wasComplete) {
            updateSecondCalcToSuccessState(t);
            wasComplete = true;
          } else if (!allComplete && wasComplete) {
            updateSecondCalcToWarningState(t);
            wasComplete = false;
          }

          const nextBtn = document.querySelector(
            ".shepherd-button-primary",
          ) as HTMLButtonElement;
          if (nextBtn) {
            nextBtn.style.opacity = allComplete ? "1" : "0.5";
            nextBtn.style.pointerEvents = allComplete ? "auto" : "none";
          }
        }, 300);

        (window as any).__tutorialSecondCalcInterval = checkInterval;
      },
      hide: () => {
        removeAllHighlights();
        if ((window as any).__tutorialSecondCalcInterval) {
          clearInterval((window as any).__tutorialSecondCalcInterval);
          delete (window as any).__tutorialSecondCalcInterval;
        }
      },
    },
    buttons: [
      {
        text: t("Back", "上一步"),
        action: () => tour.back(),
        classes: "shepherd-button-secondary",
      },
      {
        text: t("Continue", "继续"),
        action: () => {
          const secondNode = getSecondCalculatorNode();
          if (!secondNode) return;

          const hardcodedValues = secondNode.data?.hardcodedValues || {};
          const hasB =
            hardcodedValues.b !== undefined &&
            hardcodedValues.b !== null &&
            hardcodedValues.b !== "";
          const hasOp =
            hardcodedValues.operation !== undefined &&
            hardcodedValues.operation !== null &&
            hardcodedValues.operation !== "";

          if (hasB && hasOp) {
            tour.next();
          }
        },
        classes: "shepherd-button-primary",
      },
    ],
  },
];
