import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import { TUTORIAL_SELECTORS } from "../constants";
import {
  waitForElement,
  highlightElement,
  removeAllHighlights,
  forceSaveOpen,
} from "../helpers";
import { ICONS } from "../icons";
import { banner } from "../styles";
export const createSaveSteps = (
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  {
    id: "open-save",
    title: t("Save Your Workflow", "保存工作流"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Before running, we need to <strong>save</strong> your workflow.", "运行之前，需要先<strong>保存</strong>工作流。")}</p>
        ${banner(ICONS.ClickIcon, t("Click the Save button", "点击保存按钮"), "action")}
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.SAVE_TRIGGER,
      on: "right",
    },
    advanceOn: {
      selector: TUTORIAL_SELECTORS.SAVE_TRIGGER,
      event: "click",
    },
    beforeShowPromise: () =>
      waitForElement(TUTORIAL_SELECTORS.SAVE_TRIGGER, 3000).catch(() => {}),
    buttons: [],
    when: {
      show: () => {
        highlightElement(TUTORIAL_SELECTORS.SAVE_TRIGGER);
      },
      hide: () => {
        removeAllHighlights();
      },
    },
  },

  {
    id: "save-details",
    title: t("Name Your Workflow", "为工作流命名"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Give your workflow a <strong>name</strong> and optional description.", "填写工作流的<strong>名称</strong>，也可添加描述。")}</p>
        ${banner(ICONS.ClickIcon, t('Enter a name and click "Save Workflow"', "输入名称并点击“保存工作流”"), "action")}
        <p class="text-caption font-normal text-foreground-tertiary m-0" style="margin-top: 0.5rem;">${t('Example: "My Calculator Workflow"', "示例：“我的计算器工作流”")}</p>
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.SAVE_CONTENT,
      on: "right",
    },
    advanceOn: {
      selector: TUTORIAL_SELECTORS.SAVE_AGENT_BUTTON,
      event: "click",
    },
    beforeShowPromise: () => waitForElement(TUTORIAL_SELECTORS.SAVE_CONTENT),
    when: {
      show: () => {
        forceSaveOpen(true);
      },
      hide: () => {
        forceSaveOpen(false);
      },
    },
    buttons: [],
  },
];
