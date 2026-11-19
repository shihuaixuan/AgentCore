import { SearchableNode } from "../GraphMenuSearchBar/useGraphMenuSearchBar";
import {
  englishDisplayText,
  type DisplayTranslate,
} from "../../../../helpers/translation";

export function getNodeInputOutputSummary(
  node: SearchableNode,
  t: DisplayTranslate = englishDisplayText,
) {
  if (!node?.data) return "";

  const inputs = Object.keys(node.data.inputSchema?.properties || {});
  const outputs = Object.keys(node.data.outputSchema?.properties || {});
  const parts = [];

  if (inputs.length > 0) {
    parts.push(
      `${t("Inputs: ", "输入：")}${inputs.slice(0, 3).join(", ")}${inputs.length > 3 ? "..." : ""}`,
    );
  }
  if (outputs.length > 0) {
    parts.push(
      `${t("Outputs: ", "输出：")}${outputs.slice(0, 3).join(", ")}${outputs.length > 3 ? "..." : ""}`,
    );
  }

  return parts.join(" | ");
}
