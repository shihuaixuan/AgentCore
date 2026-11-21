import type { AriaLabelConfig } from "@xyflow/react";
import type { CustomEdge } from "../../edges/CustomEdge";
import type { CustomNode } from "../../nodes/CustomNode/CustomNode";

const directions: Record<string, string> = {
  left: "左",
  right: "右",
  up: "上",
  down: "下",
};

export const defaultFlowLabels: Partial<AriaLabelConfig> = {};
export const chineseFlowLabels: AriaLabelConfig = {
  "node.a11yDescription.default":
    "按回车键或空格键选择节点，按 Delete 键删除，按 Esc 键取消选择。",
  "node.a11yDescription.keyboardDisabled":
    "按回车键或空格键选择节点，使用方向键移动节点，按 Delete 键删除，按 Esc 键取消选择。",
  "edge.a11yDescription.default":
    "按回车键或空格键选择连接，按 Delete 键删除，按 Esc 键取消选择。",
  "node.a11yDescription.ariaLiveMessage": ({ direction, x, y }) =>
    `已向${directions[direction] ?? direction}移动所选节点。新位置：x：${x}，y：${y}。`,
  "controls.ariaLabel": "画布控件",
  "controls.zoomIn.ariaLabel": "放大",
  "controls.zoomOut.ariaLabel": "缩小",
  "controls.fitView.ariaLabel": "适应画布",
  "controls.interactive.ariaLabel": "切换画布交互",
  "minimap.ariaLabel": "缩略图",
  "handle.ariaLabel": "连接点",
};

function canvasViews<T extends object>(display: (element: T) => T) {
  const elements = new WeakMap<T, T>();
  const lists = new WeakMap<T[], T[]>();
  return function displayList(source: T[]) {
    const previous = lists.get(source);
    if (previous) return previous;
    const views = source.map((element) => {
      const cached = elements.get(element);
      if (cached) return cached;
      const view = display(element);
      elements.set(element, view);
      return view;
    });
    lists.set(source, views);
    return views;
  };
}

export const chineseCanvasNodes = canvasViews<CustomNode>((node) => ({
  ...node,
  domAttributes: { "aria-roledescription": "节点", ...node.domAttributes },
}));

export const chineseCanvasEdges = canvasViews<CustomEdge>((edge) => ({
  ...edge,
  ariaLabel:
    edge.ariaLabel === undefined || edge.ariaLabel === ""
      ? `从 ${edge.source} 到 ${edge.target} 的连接`
      : edge.ariaLabel,
  domAttributes: { "aria-roledescription": "连接", ...edge.domAttributes },
}));
