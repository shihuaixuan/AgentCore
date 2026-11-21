import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import { TUTORIAL_SELECTORS } from "../constants";
import {
  fitViewToScreen,
  highlightElement,
  removeAllHighlights,
  getFirstNode,
} from "../helpers";
import { ICONS } from "../icons";
import { banner } from "../styles";

const getRequirementsHtml = (t: TutorialTranslate = englishTutorialText) => `
  <div id="requirements-box" class="mt-3 p-3 bg-warning-surface ring-1 ring-warning-border rounded-2xl">
    <p id="requirements-title" class="text-body leading-5 font-medium text-warning-foreground m-0 mb-2">${t("⚠️ Required to continue:", "⚠️ 继续前请完成：")}</p>
    <ul id="requirements-list" class="text-body-sm leading-inherit text-warning-foreground m-0 pl-4 space-y-1">
      <li id="req-a" class="flex items-center gap-2">
        <span class="req-icon">○</span>${t(" Enter a number in field <strong>A</strong> (e.g., 10)", " 在字段 <strong>A</strong> 中输入数字（例如 10）")}
      </li>
      <li id="req-b" class="flex items-center gap-2">
        <span class="req-icon">○</span>${t(" Enter a number in field <strong>B</strong> (e.g., 5)", " 在字段 <strong>B</strong> 中输入数字（例如 5）")}
      </li>
      <li id="req-op" class="flex items-center gap-2">
        <span class="req-icon">○</span>${t(" Select an <strong>Operation</strong> (Add, Multiply, etc.)", " 选择<strong>运算</strong>（例如加法或乘法）")}
      </li>
    </ul>
  </div>
`;

const updateToSuccessState = (t: TutorialTranslate = englishTutorialText) => {
  const reqBox = document.querySelector("#requirements-box");
  const reqTitle = document.querySelector("#requirements-title");
  const reqList = document.querySelector("#requirements-list");

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

const updateToWarningState = (t: TutorialTranslate = englishTutorialText) => {
  const reqBox = document.querySelector("#requirements-box");
  const reqTitle = document.querySelector("#requirements-title");
  const reqList = document.querySelector("#requirements-list");

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

export const createConfigureCalculatorSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  {
    id: "enter-values",
    title: t("Enter Values", "填写数值"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Now let's configure the block with actual values.", "现在为模块填写实际数值。")}</p>
        ${getRequirementsHtml(t)}
        ${banner(ICONS.ClickIcon, t("Fill in all the required fields above", "填写上方所有必填字段"), "action")}
      </div>
    `,
    beforeShowPromise: () => {
      fitViewToScreen();
      return Promise.resolve();
    },
    attachTo: {
      element: TUTORIAL_SELECTORS.CALCULATOR_NODE_FORM_CONTAINER,
      on: "right",
    },
    when: {
      show: () => {
        const node = getFirstNode();
        if (node) {
          highlightElement(`[data-id="custom-node-${node.id}"]`);
        }

        let wasComplete = false;

        const checkInterval = setInterval(() => {
          const node = getFirstNode();
          if (!node) return;

          const hardcodedValues = node.data?.hardcodedValues || {};
          const hasA =
            hardcodedValues.a !== undefined &&
            hardcodedValues.a !== null &&
            hardcodedValues.a !== "";
          const hasB =
            hardcodedValues.b !== undefined &&
            hardcodedValues.b !== null &&
            hardcodedValues.b !== "";
          const hasOp =
            hardcodedValues.operation !== undefined &&
            hardcodedValues.operation !== null &&
            hardcodedValues.operation !== "";

          const allComplete = hasA && hasB && hasOp;

          const reqA = document.querySelector("#req-a .req-icon");
          const reqB = document.querySelector("#req-b .req-icon");
          const reqOp = document.querySelector("#req-op .req-icon");

          if (reqA) reqA.textContent = hasA ? "✓" : "○";
          if (reqB) reqB.textContent = hasB ? "✓" : "○";
          if (reqOp) reqOp.textContent = hasOp ? "✓" : "○";

          const reqAEl = document.querySelector("#req-a");
          const reqBEl = document.querySelector("#req-b");
          const reqOpEl = document.querySelector("#req-op");

          if (reqAEl) {
            reqAEl.classList.toggle("text-success", hasA);
            reqAEl.classList.toggle("text-warning-foreground", !hasA);
          }
          if (reqBEl) {
            reqBEl.classList.toggle("text-success", hasB);
            reqBEl.classList.toggle("text-warning-foreground", !hasB);
          }
          if (reqOpEl) {
            reqOpEl.classList.toggle("text-success", hasOp);
            reqOpEl.classList.toggle("text-warning-foreground", !hasOp);
          }

          if (allComplete && !wasComplete) {
            updateToSuccessState(t);
            wasComplete = true;
          } else if (!allComplete && wasComplete) {
            updateToWarningState(t);
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

        (window as any).__tutorialCheckInterval = checkInterval;
      },
      hide: () => {
        removeAllHighlights();
        if ((window as any).__tutorialCheckInterval) {
          clearInterval((window as any).__tutorialCheckInterval);
          delete (window as any).__tutorialCheckInterval;
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
          const node = getFirstNode();
          if (!node) return;

          const hardcodedValues = node.data?.hardcodedValues || {};
          const hasA =
            hardcodedValues.a !== undefined &&
            hardcodedValues.a !== null &&
            hardcodedValues.a !== "";
          const hasB =
            hardcodedValues.b !== undefined &&
            hardcodedValues.b !== null &&
            hardcodedValues.b !== "";
          const hasOp =
            hardcodedValues.operation !== undefined &&
            hardcodedValues.operation !== null &&
            hardcodedValues.operation !== "";

          if (hasA && hasB && hasOp) {
            tour.next();
          }
        },
        classes: "shepherd-button-primary",
      },
    ],
  },
];
