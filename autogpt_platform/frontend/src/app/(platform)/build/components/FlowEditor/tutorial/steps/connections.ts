import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import {
  fitViewToScreen,
  highlightElement,
  removeAllHighlights,
} from "../helpers";
import { ICONS } from "../icons";
import { banner } from "../styles";
import { useEdgeStore } from "../../../../stores/edgeStore";
import { TUTORIAL_SELECTORS } from "../constants";

const getConnectionStatusHtml = (
  id: string,
  isConnected: boolean = false,
  t: TutorialTranslate = englishTutorialText,
) => `
  <div id="${id}" class="mt-3 p-2 ${isConnected ? "bg-success-surface ring-1 ring-success/40" : "bg-warning-surface ring-1 ring-warning-border"} rounded-2xl text-center text-body leading-5 ${isConnected ? "text-success" : "text-warning-foreground"}">
    ${isConnected ? t("✅ Connected!", "✅ 已连接！") : t("Waiting for connection...", "等待连接…")}
  </div>
`;

const updateConnectionStatus = (
  id: string,
  isConnected: boolean,
  message: string | undefined,
  t: TutorialTranslate = englishTutorialText,
) => {
  const statusEl = document.querySelector(`#${id}`);
  if (statusEl) {
    statusEl.innerHTML =
      message ||
      (isConnected
        ? t("✅ Connected!", "✅ 已连接！")
        : t("Waiting for connection...", "等待连接…"));
    statusEl.classList.remove(
      "bg-warning-surface",
      "ring-warning-border",
      "text-warning-foreground",
      "bg-success-surface",
      "ring-success/40",
      "text-success",
    );
    if (isConnected) {
      statusEl.classList.add(
        "bg-success-surface",
        "ring-success/40",
        "text-success",
      );
    } else {
      statusEl.classList.add(
        "bg-warning-surface",
        "ring-warning-border",
        "text-warning-foreground",
      );
    }
  }
};

const hasAnyEdge = (): boolean => {
  return useEdgeStore.getState().edges.length > 0;
};

// Shepherd 14 positions the popover via @floating-ui/dom (absolute left/top),
// so CSS margins don't move it. Use a floating-ui offset middleware to push the
// popover away from the handle, leaving room to grab and drag the connection.
export const CONNECTION_STEP_OFFSET = 72;

export const connectionHandleOffset = ({
  placement,
  x,
  y,
}: {
  placement: string;
  x: number;
  y: number;
}): { x?: number; y?: number } => {
  const side = placement.split("-")[0];
  if (side === "left") return { x: x - CONNECTION_STEP_OFFSET };
  if (side === "right") return { x: x + CONNECTION_STEP_OFFSET };
  if (side === "top") return { y: y - CONNECTION_STEP_OFFSET };
  if (side === "bottom") return { y: y + CONNECTION_STEP_OFFSET };
  return {};
};

const connectionFloatingOptions: StepOptions["floatingUIOptions"] = {
  middleware: [
    {
      name: "connectionHandleOffset",
      fn: (state) =>
        connectionHandleOffset({
          placement: state.placement,
          x: state.x,
          y: state.y,
        }),
    },
  ],
};

export const createConnectionSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => {
  let isConnecting = false;

  const handleMouseDown = () => {
    isConnecting = true;

    const inputSelector =
      TUTORIAL_SELECTORS.FIRST_CALCULATOR_RESULT_OUTPUT_HANDLER;
    if (inputSelector) {
      highlightElement(inputSelector);
    }

    setTimeout(() => {
      if (isConnecting) {
        tour.next();
      }
    }, 100);
  };

  const resetConnectionState = () => {
    isConnecting = false;
  };

  return [
    {
      id: "connect-blocks-output",
      title: t("Connect the Blocks: Output", "连接模块：输出"),
      text: `
        <div class="text-body text-foreground-emphasis">
          <p class="text-body font-normal text-foreground-emphasis m-0">${t("Now, let's connect the <strong>Result output</strong> of the first Calculator to the <strong>input (A)</strong> of the second Calculator.", "现在将第一个计算器的<strong>结果输出</strong>连接到第二个计算器的<strong>输入 A</strong>。")}</p>
          
          <div class="mt-3 p-3 bg-info-surface ring-1 ring-info/30 rounded-2xl">
            <p class="text-body leading-5 font-medium text-info-foreground m-0 mb-2">${t("Drag from the Result output:", "从结果输出处拖动：")}</p>
            <p class="text-body-sm leading-inherit text-info-foreground m-0">${t("Click and drag from the <strong>Result</strong> output pin (right side) of the <strong>first Calculator block</strong>.", "按住<strong>第一个计算器模块</strong>右侧的<strong>结果</strong>输出连接点并拖动。")}</p>
          </div>
          ${getConnectionStatusHtml("connection-status-output", false, t)}
          ${banner(ICONS.Drag, t("Drag from the Result output pin", "从结果输出连接点拖动"), "action")}
        </div>
      `,
      attachTo: {
        element: TUTORIAL_SELECTORS.FIRST_CALCULATOR_RESULT_OUTPUT_HANDLER,
        on: "left",
      },
      floatingUIOptions: connectionFloatingOptions,

      when: {
        show: () => {
          resetConnectionState();

          if (hasAnyEdge()) {
            updateConnectionStatus(
              "connection-status-output",
              true,
              t("✅ Connection already exists!", "✅ 连接已存在！"),
              t,
            );
            setTimeout(() => {
              tour.next();
            }, 1000);
            return;
          }

          const outputSelector =
            TUTORIAL_SELECTORS.FIRST_CALCULATOR_RESULT_OUTPUT_HANDLER;
          if (outputSelector) {
            const outputHandle = document.querySelector(outputSelector);
            if (outputHandle) {
              highlightElement(outputSelector);
              outputHandle.addEventListener("mousedown", handleMouseDown);
            }
          }

          const unsubscribe = useEdgeStore.subscribe(() => {
            if (hasAnyEdge()) {
              updateConnectionStatus(
                "connection-status-output",
                true,
                undefined,
                t,
              );
              setTimeout(() => {
                unsubscribe();
                tour.next();
              }, 500);
            }
          });

          (tour.getCurrentStep() as any)._edgeUnsubscribe = unsubscribe;
        },
        hide: () => {
          removeAllHighlights();
          const step = tour.getCurrentStep() as any;
          if (step?._edgeUnsubscribe) {
            step._edgeUnsubscribe();
          }
          const outputSelector =
            TUTORIAL_SELECTORS.FIRST_CALCULATOR_RESULT_OUTPUT_HANDLER;
          if (outputSelector) {
            const outputHandle = document.querySelector(outputSelector);
            if (outputHandle) {
              outputHandle.removeEventListener("mousedown", handleMouseDown);
            }
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
          text: t("Skip (already connected)", "跳过（已连接）"),
          action: () => tour.show("connection-complete"),
          classes: "shepherd-button-secondary",
        },
      ],
    },

    {
      id: "connect-blocks-input",
      title: t("Connect the Blocks: Input", "连接模块：输入"),
      text: `
        <div class="text-body text-foreground-emphasis">
          <p class="text-body font-normal text-foreground-emphasis m-0">${t("Now, connect to the <strong>input (A)</strong> of the second Calculator block.", "现在连接到第二个计算器模块的<strong>输入 A</strong>。")}</p>
          
          <div class="mt-3 p-3 bg-info-surface ring-1 ring-info/30 rounded-2xl">
            <p class="text-body leading-5 font-medium text-info-foreground m-0 mb-2">${t("Drop on the A input:", "松开到 A 输入处：")}</p>
            <p class="text-body-sm leading-inherit text-info-foreground m-0">${t("Drag to the <strong>A</strong> input handle (left side) of the <strong>second Calculator block</strong>.", "拖动到<strong>第二个计算器模块</strong>左侧的 <strong>A</strong> 输入连接点。")}</p>
          </div>
          ${getConnectionStatusHtml("connection-status-input", false, t)}
        </div>
      `,
      attachTo: {
        element: TUTORIAL_SELECTORS.SECOND_CALCULATOR_NUMBER_A_INPUT_HANDLER,
        on: "right",
      },
      floatingUIOptions: connectionFloatingOptions,
      when: {
        show: () => {
          const inputSelector =
            TUTORIAL_SELECTORS.SECOND_CALCULATOR_NUMBER_A_INPUT_HANDLER;
          if (inputSelector) {
            highlightElement(inputSelector);
          }

          if (hasAnyEdge()) {
            updateConnectionStatus(
              "connection-status-input",
              true,
              t("✅ Connected!", "✅ 已连接！"),
              t,
            );
            setTimeout(() => {
              tour.next();
            }, 500);
            return;
          }

          const unsubscribe = useEdgeStore.subscribe(() => {
            if (hasAnyEdge()) {
              updateConnectionStatus(
                "connection-status-input",
                true,
                undefined,
                t,
              );
              setTimeout(() => {
                unsubscribe();
                tour.next();
              }, 500);
            }
          });

          (tour.getCurrentStep() as any)._edgeUnsubscribe = unsubscribe;

          const handleMouseUp = () => {
            setTimeout(() => {
              if (!hasAnyEdge()) {
                isConnecting = false;
                tour.show("connect-blocks-output");
              }
            }, 200);
          };
          document.addEventListener("mouseup", handleMouseUp, true);
          (tour.getCurrentStep() as any)._mouseUpHandler = handleMouseUp;
        },
        hide: () => {
          removeAllHighlights();
          const step = tour.getCurrentStep() as any;
          if (step?._edgeUnsubscribe) {
            step._edgeUnsubscribe();
          }
          if (step?._mouseUpHandler) {
            document.removeEventListener("mouseup", step._mouseUpHandler, true);
          }
        },
      },
      buttons: [
        {
          text: t("Back", "上一步"),
          action: () => tour.show("connect-blocks-output"),
          classes: "shepherd-button-secondary",
        },
        {
          text: t("Skip (already connected)", "跳过（已连接）"),
          action: () => tour.next(),
          classes: "shepherd-button-secondary",
        },
      ],
    },

    {
      id: "connection-complete",
      title: t("Blocks Connected! 🎉", "模块已连接！🎉"),
      text: `
        <div class="text-body text-foreground-emphasis">
          <p class="text-body font-normal text-foreground-emphasis m-0">${t("Excellent! Your Calculator blocks are now connected:", "很好！你的计算器模块现已连接：")}</p>
          
          <div class="mt-3 p-3 bg-success-surface ring-1 ring-success/40 rounded-2xl">
            <div class="flex items-center justify-center gap-2 text-body leading-5 font-medium text-success">
              <span>${t("Calculator 1", "计算器 1")}</span>
              <span>→</span>
              <span>${t("Calculator 2", "计算器 2")}</span>
            </div>
            <p class="text-caption leading-inherit text-success m-0 mt-2 text-center italic">${t("The result of Calculator 1 flows into Calculator 2's input A", "计算器 1 的结果传入计算器 2 的输入 A")}</p>
          </div>
          
          <p class="text-body font-normal text-foreground-emphasis m-0" style="margin-top: 0.75rem;">${t("Now let's save and run your workflow!", "现在保存并运行工作流！")}</p>
        </div>
      `,
      beforeShowPromise: async () => {
        fitViewToScreen();
        return Promise.resolve();
      },
      buttons: [
        {
          text: t("Save My Workflow", "保存我的工作流"),
          action: () => tour.next(),
        },
      ],
    },
  ];
};
