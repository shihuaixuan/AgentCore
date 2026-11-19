import type { ToolUIPart } from "ai";

interface FolderAgentSummary {
  id: string;
  name: string;
  description?: string;
}

interface FolderInfo {
  id: string;
  name: string;
  parent_id?: string | null;
  icon?: string | null;
  color?: string | null;
  agent_count: number;
  subfolder_count: number;
  agents?: FolderAgentSummary[] | null;
}

interface FolderTreeInfo extends FolderInfo {
  children: FolderTreeInfo[];
}

interface FolderCreatedOutput {
  type: "folder_created";
  message: string;
  folder: FolderInfo;
}

interface FolderListOutput {
  type: "folder_list";
  message: string;
  folders?: FolderInfo[];
  tree?: FolderTreeInfo[];
  count: number;
}

interface FolderUpdatedOutput {
  type: "folder_updated";
  message: string;
  folder: FolderInfo;
}

interface FolderMovedOutput {
  type: "folder_moved";
  message: string;
  folder: FolderInfo;
  target_parent_id?: string | null;
}

interface FolderDeletedOutput {
  type: "folder_deleted";
  message: string;
  folder_id: string;
}

interface AgentsMovedOutput {
  type: "agents_moved_to_folder";
  message: string;
  agent_ids: string[];
  folder_id?: string | null;
  count: number;
}

interface ErrorOutput {
  type: "error";
  message: string;
  error?: string;
}

export type FolderToolOutput =
  | FolderCreatedOutput
  | FolderListOutput
  | FolderUpdatedOutput
  | FolderMovedOutput
  | FolderDeletedOutput
  | AgentsMovedOutput
  | ErrorOutput;

export type { FolderAgentSummary, FolderInfo, FolderTreeInfo };

function parseOutput(output: unknown): FolderToolOutput | null {
  if (!output) return null;
  if (typeof output === "string") {
    const trimmed = output.trim();
    if (!trimmed) return null;
    try {
      return parseOutput(JSON.parse(trimmed) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof output === "object") {
    const obj = output as Record<string, unknown>;
    if (typeof obj.type === "string") {
      return output as FolderToolOutput;
    }
  }
  return null;
}

export function getFolderToolOutput(part: {
  output?: unknown;
}): FolderToolOutput | null {
  return parseOutput(part.output);
}

export function isFolderCreated(o: FolderToolOutput): o is FolderCreatedOutput {
  return o.type === "folder_created";
}

export function isFolderList(o: FolderToolOutput): o is FolderListOutput {
  return o.type === "folder_list";
}

export function isFolderUpdated(o: FolderToolOutput): o is FolderUpdatedOutput {
  return o.type === "folder_updated";
}

export function isFolderMoved(o: FolderToolOutput): o is FolderMovedOutput {
  return o.type === "folder_moved";
}

export function isFolderDeleted(o: FolderToolOutput): o is FolderDeletedOutput {
  return o.type === "folder_deleted";
}

export function isAgentsMoved(o: FolderToolOutput): o is AgentsMovedOutput {
  return o.type === "agents_moved_to_folder";
}

export function isErrorOutput(o: FolderToolOutput): o is ErrorOutput {
  return o.type === "error";
}

export function getAnimationText(
  part: {
    type: string;
    state: ToolUIPart["state"];
    output?: unknown;
  },
  t = (english: string, _chinese: string) => english,
): string {
  const toolName = part.type.replace(/^tool-/, "");

  switch (part.state) {
    case "input-streaming":
    case "input-available": {
      switch (toolName) {
        case "create_folder":
          return t("Creating folder…", "正在创建文件夹…");
        case "list_folders":
          return t("Loading folders…", "正在加载文件夹…");
        case "update_folder":
          return t("Updating folder…", "正在更新文件夹…");
        case "move_folder":
          return t("Moving folder…", "正在移动文件夹…");
        case "delete_folder":
          return t("Deleting folder…", "正在删除文件夹…");
        case "move_agents_to_folder":
          return t("Moving workflows…", "正在移动工作流…");
        default:
          return t("Managing folders…", "正在管理文件夹…");
      }
    }
    case "output-available": {
      const output = getFolderToolOutput(part);
      if (!output) return t("Done", "已完成");
      if (isErrorOutput(output))
        return t("Folder operation failed", "文件夹操作失败");
      return output.message;
    }
    case "output-error":
      return t("Folder operation failed", "文件夹操作失败");
    default:
      return t("Managing folders…", "正在管理文件夹…");
  }
}
