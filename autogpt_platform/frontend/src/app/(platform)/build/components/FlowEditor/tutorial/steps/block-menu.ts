import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import { TUTORIAL_CONFIG, TUTORIAL_SELECTORS, BLOCK_IDS } from "../constants";
import {
  waitForElement,
  forceBlockMenuOpen,
  focusElement,
  highlightElement,
  removeAllHighlights,
  disableOtherBlocks,
  enableAllBlocks,
  pulseElement,
  highlightFirstBlockInSearch,
} from "../helpers";
import { ICONS } from "../icons";
import { banner } from "../styles";
import { useNodeStore } from "../../../../stores/nodeStore";

export const createBlockMenuSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  {
    id: "open-block-menu",
    title: t("Open the Block Menu", "打开模块菜单"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Let's start by opening the Block Menu.", "首先打开模块菜单。")}</p>
        ${banner(ICONS.ClickIcon, t("Click this button to open the menu", "点击此按钮打开菜单"), "action")}
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.BLOCKS_TRIGGER,
      on: "right",
    },
    advanceOn: {
      selector: TUTORIAL_SELECTORS.BLOCKS_TRIGGER,
      event: "click",
    },
    buttons: [],
    when: {
      show: () => {
        highlightElement(TUTORIAL_SELECTORS.BLOCKS_TRIGGER);
      },
      hide: () => {
        removeAllHighlights();
      },
    },
  },

  {
    id: "block-menu-overview",
    title: t("The Block Menu", "模块菜单"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("This is the <strong>Block Menu</strong> — your toolbox for building workflows.", "这是<strong>模块菜单</strong>，用于选择构建工作流所需的工具。")}</p>
        <p class="text-body font-medium text-foreground-emphasis m-0" style="margin-top: 0.5rem;">${t("Here you'll find:", "这里包括：")}</p>
        <ul>
          <li>${t("<strong>Input Blocks</strong> — Entry points for data", "<strong>输入模块</strong> — 数据入口")}</li>
          <li>${t("<strong>Action Blocks</strong> — Processing and AI operations", "<strong>操作模块</strong> — 数据处理与 AI 操作")}</li>
          <li>${t("<strong>Output Blocks</strong> — Results and responses", "<strong>输出模块</strong> — 结果与响应")}</li>
          <li>${t("<strong>Integrations</strong> — Third-party service blocks", "<strong>集成</strong> — 第三方服务模块")}</li>
          <li>${t("<strong>Library Workflows</strong> — Your personal workflows", "<strong>工作库工作流</strong> — 你的个人工作流")}</li>
          <li>${t("<strong>Marketplace Workflows</strong> — Community workflows", "<strong>市场工作流</strong> — 社区分享的工作流")}</li>
        </ul>
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.BLOCKS_CONTENT,
      on: "left",
    },
    beforeShowPromise: () => waitForElement(TUTORIAL_SELECTORS.BLOCKS_CONTENT),
    when: {
      show: () => forceBlockMenuOpen(true),
    },
    buttons: [
      {
        text: t("Next", "下一步"),
        action: () => tour.next(),
      },
    ],
  },

  {
    id: "search-calculator",
    title: t("Search for a Block", "搜索模块"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("Let's add a Calculator block to start.", "先添加一个计算器模块。")}</p>
        ${banner(ICONS.Keyboard, t(`Type ${TUTORIAL_CONFIG.SEARCH_TERM_CALCULATOR} in the search bar`, "在搜索栏中输入「计算器」"), "action")}
        <p class="text-caption font-normal text-foreground-tertiary m-0" style="margin-top: 0.5rem;">${t("The search will filter blocks as you type.", "输入时，搜索结果会同步筛选模块。")}</p>
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.BLOCKS_SEARCH_INPUT_BOX,
      on: "bottom",
    },
    beforeShowPromise: () =>
      waitForElement(TUTORIAL_SELECTORS.BLOCKS_SEARCH_INPUT_BOX),
    when: {
      show: () => {
        forceBlockMenuOpen(true);
        setTimeout(() => {
          focusElement(TUTORIAL_SELECTORS.BLOCKS_SEARCH_INPUT);
        }, 100);

        const checkForCalculator = setInterval(() => {
          const calcBlock = document.querySelector(
            TUTORIAL_SELECTORS.BLOCK_CARD_CALCULATOR_IN_SEARCH,
          );
          if (calcBlock) {
            clearInterval(checkForCalculator);

            const searchInput = document.querySelector(
              TUTORIAL_SELECTORS.BLOCKS_SEARCH_INPUT,
            ) as HTMLInputElement;
            if (searchInput) {
              searchInput.blur();
            }

            disableOtherBlocks(
              TUTORIAL_SELECTORS.BLOCK_CARD_CALCULATOR_IN_SEARCH,
            );
            pulseElement(TUTORIAL_SELECTORS.BLOCK_CARD_CALCULATOR_IN_SEARCH);
            calcBlock.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => {
              tour.next();
            }, 300);
          }
        }, TUTORIAL_CONFIG.ELEMENT_CHECK_INTERVAL);

        (window as any).__tutorialCalcInterval = checkForCalculator;
      },
      hide: () => {
        if ((window as any).__tutorialCalcInterval) {
          clearInterval((window as any).__tutorialCalcInterval);
          delete (window as any).__tutorialCalcInterval;
        }
        enableAllBlocks();
      },
    },
    buttons: [],
  },

  {
    id: "select-calculator",
    title: t("Add the Calculator Block", "添加计算器模块"),
    text: `
      <div class="text-body text-foreground-emphasis">
        <p class="text-body font-normal text-foreground-emphasis m-0">${t("You should see the <strong>Calculator</strong> block in the results.", "你应该能在结果中看到<strong>计算器</strong>模块。")}</p>
        ${banner(ICONS.ClickIcon, t("Click on the Calculator block to add it", "点击计算器模块进行添加"), "action")}
        
        <div class="bg-surface-hover ring-1 ring-border-base rounded-2xl p-2 px-4 mt-2 flex items-start gap-2 text-body leading-5 font-medium text-foreground-secondary">  
          <span class="flex-shrink-0">${ICONS.Drag}</span>
          <span>${t("You can also drag blocks onto the canvas", "也可以将模块拖到画布上")}</span>
        </div>
      </div>
    `,
    attachTo: {
      element: TUTORIAL_SELECTORS.BLOCK_CARD_CALCULATOR,
      on: "left",
    },
    beforeShowPromise: async () => {
      forceBlockMenuOpen(true);
      await waitForElement(TUTORIAL_SELECTORS.BLOCK_CARD_CALCULATOR, 5000);
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
    when: {
      show: () => {
        const calcBlock = document.querySelector(
          TUTORIAL_SELECTORS.BLOCK_CARD_CALCULATOR,
        );
        if (calcBlock) {
          disableOtherBlocks(TUTORIAL_SELECTORS.BLOCK_CARD_CALCULATOR);
        } else {
          highlightFirstBlockInSearch();
        }

        const CALCULATOR_BLOCK_ID = BLOCK_IDS.CALCULATOR;

        const initialNodeCount = useNodeStore.getState().nodes.length;

        const unsubscribe = useNodeStore.subscribe((state) => {
          if (state.nodes.length > initialNodeCount) {
            const calculatorNode = state.nodes.find(
              (node) => node.data?.block_id === CALCULATOR_BLOCK_ID,
            );

            if (calculatorNode) {
              unsubscribe();
              enableAllBlocks();
              forceBlockMenuOpen(false);
              tour.next();
            }
          }
        });

        (tour.getCurrentStep() as any)._nodeUnsubscribe = unsubscribe;
      },
    },
  },
];
