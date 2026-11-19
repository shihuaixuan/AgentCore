import { SitrepItemData } from "../../types";
import {
  englishDisplayText,
  type DisplayTranslate,
} from "../../helpers/translation";

export function buildAutoPilotPrompt(
  item: SitrepItemData,
  t: DisplayTranslate = englishDisplayText,
): string {
  // Embed the exact library agent ID and steer the assistant to resolve it by
  // ID via find_library_agent's agent_id (direct lookup) instead of a fuzzy
  // name search.
  const idHint = t(
    ` Use find_library_agent with the exact agent_id ${item.agentID} to look it up.`,
    ` 请使用 find_library_agent，通过准确的 agent_id ${item.agentID} 查找此工作流。`,
  );
  switch (item.priority) {
    case "error":
      return (
        t(
          `What happened with ${item.agentName}? It says "${item.message}" — can you check the logs and tell me what to fix?`,
          `${item.agentName} 出了什么问题？提示为“${item.message}”。请检查日志，告诉我如何修复。`,
        ) + idHint
      );
    case "running":
      return (
        t(
          `Give me a status update on the ${item.agentName} run — what has it found so far?`,
          `请更新 ${item.agentName} 的运行状态，目前有什么发现？`,
        ) + idHint
      );
    case "stale":
      return (
        t(
          `${item.agentName} hasn't run recently. Should I keep it or update and re-run it?`,
          `${item.agentName} 最近没有运行。我应该保留现状，还是更新后重新运行？`,
        ) + idHint
      );
    case "warning":
      return (
        t(
          `${item.agentName}'s last run finished, but it says "${item.message}". Which step failed, why, and how do I fix it?`,
          `${item.agentName} 上次运行已结束，但提示“${item.message}”。哪一步失败了，原因是什么，应该如何修复？`,
        ) + idHint
      );
    case "success":
      return (
        t(
          `Show me what ${item.agentName} found in its last run — summarize the results and any key takeaways.`,
          `请总结 ${item.agentName} 上次运行的结果和重要发现。`,
        ) + idHint
      );
    case "listening":
      return (
        t(
          `What is ${item.agentName} listening for? Give me a summary of its trigger configuration.`,
          `${item.agentName} 正在监听什么？请概述它的触发器配置。`,
        ) + idHint
      );
    case "scheduled":
      return (
        t(
          `When is ${item.agentName} scheduled to run next?`,
          `${item.agentName} 下一次计划在何时运行？`,
        ) + idHint
      );
    case "idle":
      return (
        t(
          `${item.agentName} has been idle. Should I keep it or update and re-run it?`,
          `${item.agentName} 一直处于空闲状态。我应该保留现状，还是更新后重新运行？`,
        ) + idHint
      );
  }
}
