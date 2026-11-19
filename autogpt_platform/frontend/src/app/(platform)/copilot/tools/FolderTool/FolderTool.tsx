"use client";

import type { ToolUIPart } from "ai";
import {
  File as TreeFile,
  Folder as TreeFolder,
  Tree,
  type TreeViewElement,
} from "@/components/molecules/file-tree";
import { MorphingTextAnimation } from "../../components/MorphingTextAnimation/MorphingTextAnimation";
import { ToolAccordion } from "../../components/ToolAccordion/ToolAccordion";
import {
  ContentCard,
  ContentCardHeader,
  ContentCardTitle,
  ContentGrid,
  ContentHint,
  ContentMessage,
} from "../../components/ToolAccordion/AccordionContent";
import { OrbitLoader } from "../../components/OrbitLoader/OrbitLoader";
import {
  getAnimationText,
  getFolderToolOutput,
  isAgentsMoved,
  isErrorOutput,
  isFolderCreated,
  isFolderDeleted,
  isFolderList,
  isFolderMoved,
  isFolderUpdated,
  type FolderInfo,
  type FolderToolOutput,
  type FolderTreeInfo,
} from "./helpers";
import {
  AlertDiamondIcon,
  Delete02Icon,
  FileEmpty02Icon,
  Folder01Icon,
  FolderAddIcon,
  FolderLibraryIcon,
  FolderOpenIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  part: ToolUIPart;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function ToolStatusIcon({
  isStreaming,
  isError,
}: {
  isStreaming: boolean;
  isError: boolean;
}) {
  if (isError) {
    return <Icon icon={AlertDiamondIcon} size={14} tone="error" />;
  }
  if (isStreaming) {
    return <OrbitLoader size={14} />;
  }
  return <Icon icon={Folder01Icon} size={14} tone="subtle" />;
}

/* ------------------------------------------------------------------ */
/*  Folder card                                                        */
/* ------------------------------------------------------------------ */

function FolderCard({ folder }: { folder: FolderInfo }) {
  const { t } = useTranslation();
  return (
    <ContentCard>
      <ContentCardHeader>
        <div className="flex items-center gap-2">
          {folder.color ? (
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
          ) : (
            <Icon icon={Folder01Icon} size={14} tone="secondary" />
          )}
          <ContentCardTitle>{folder.name}</ContentCardTitle>
        </div>
      </ContentCardHeader>
      <ContentHint>
        {t(
          `${folder.agent_count} workflow${folder.agent_count !== 1 ? "s" : ""}`,
          `${folder.agent_count} 个工作流`,
        )}
        {folder.subfolder_count > 0 &&
          t(
            ` · ${folder.subfolder_count} subfolder${folder.subfolder_count !== 1 ? "s" : ""}`,
            ` · ${folder.subfolder_count} 个子文件夹`,
          )}
      </ContentHint>
      {folder.agents && folder.agents.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-border-base pt-2">
          {folder.agents.map((a) => (
            <div key={a.id} className="flex items-center gap-1.5">
              <Icon icon={FileEmpty02Icon} size={12} tone="secondary" />
              <Text variant="small-tight" as="span" tone="secondary">
                {a.name}
              </Text>
            </div>
          ))}
        </div>
      )}
    </ContentCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Tree renderer using file-tree component                            */
/* ------------------------------------------------------------------ */

type TreeNode = TreeViewElement & { isAgent?: boolean };

function folderTreeToElements(
  nodes: FolderTreeInfo[],
  t: ReturnType<typeof useTranslation>["t"],
): TreeNode[] {
  return nodes.map((node) => {
    const children: TreeNode[] = [
      ...folderTreeToElements(node.children, t),
      ...(node.agents ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        isAgent: true,
      })),
    ];
    return {
      id: node.id,
      name: t(
        `${node.name} (${node.agent_count} workflow${node.agent_count !== 1 ? "s" : ""})`,
        `${node.name}（${node.agent_count} 个工作流）`,
      ),
      children: children.length > 0 ? children : undefined,
    };
  });
}

function collectAllIDs(nodes: FolderTreeInfo[]): string[] {
  return nodes.flatMap((n) => [n.id, ...collectAllIDs(n.children)]);
}

function FolderTreeView({ tree }: { tree: FolderTreeInfo[] }) {
  const { t } = useTranslation();
  const elements = folderTreeToElements(tree, t);
  const allIDs = collectAllIDs(tree);

  return (
    <Tree
      initialExpandedItems={allIDs}
      elements={elements}
      openIcon={<Icon icon={FolderOpenIcon} size={16} tone="secondary" />}
      closeIcon={<Icon icon={Folder01Icon} size={16} tone="secondary" />}
      className="max-h-64"
    >
      {elements.map((el) => (
        <FolderTreeNodes key={el.id} element={el} />
      ))}
    </Tree>
  );
}

function FolderTreeNodes({ element }: { element: TreeNode }) {
  if (element.isAgent) {
    return (
      <TreeFile
        value={element.id}
        fileIcon={<Icon icon={FileEmpty02Icon} size={14} tone="secondary" />}
      >
        <Text variant="body-tight" as="span" tone="body">
          {element.name}
        </Text>
      </TreeFile>
    );
  }

  if (element.children && element.children.length > 0) {
    return (
      <TreeFolder value={element.id} element={element.name} isSelectable>
        {element.children.map((child) => (
          <FolderTreeNodes key={child.id} element={child as TreeNode} />
        ))}
      </TreeFolder>
    );
  }

  return <TreeFolder value={element.id} element={element.name} isSelectable />;
}

/* ------------------------------------------------------------------ */
/*  Accordion content per output type                                  */
/* ------------------------------------------------------------------ */

function AccordionContent({ output }: { output: FolderToolOutput }) {
  const { t } = useTranslation();
  if (isFolderCreated(output)) {
    return (
      <ContentGrid>
        <FolderCard folder={output.folder} />
      </ContentGrid>
    );
  }

  if (isFolderList(output)) {
    if (output.tree && output.tree.length > 0) {
      return <FolderTreeView tree={output.tree} />;
    }
    if (output.folders && output.folders.length > 0) {
      return (
        <ContentGrid className="sm:grid-cols-2">
          {output.folders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </ContentGrid>
      );
    }
    return (
      <ContentMessage>
        {t("No folders found.", "未找到文件夹。")}
      </ContentMessage>
    );
  }

  if (isFolderUpdated(output) || isFolderMoved(output)) {
    return (
      <ContentGrid>
        <FolderCard folder={output.folder} />
      </ContentGrid>
    );
  }

  if (isFolderDeleted(output)) {
    return <ContentMessage>{output.message}</ContentMessage>;
  }

  if (isAgentsMoved(output)) {
    return <ContentMessage>{output.message}</ContentMessage>;
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

function getAccordionTitle(
  output: FolderToolOutput,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  if (isFolderCreated(output))
    return t(
      `Created "${output.folder.name}"`,
      `已创建“${output.folder.name}”`,
    );
  if (isFolderList(output))
    return t(
      `${output.count} folder${output.count !== 1 ? "s" : ""}`,
      `${output.count} 个文件夹`,
    );
  if (isFolderUpdated(output))
    return t(
      `Updated "${output.folder.name}"`,
      `已更新“${output.folder.name}”`,
    );
  if (isFolderMoved(output))
    return t(`Moved "${output.folder.name}"`, `已移动“${output.folder.name}”`);
  if (isFolderDeleted(output)) return t("Folder deleted", "文件夹已删除");
  if (isAgentsMoved(output))
    return t(
      `Moved ${output.count} workflow${output.count !== 1 ? "s" : ""}`,
      `已移动 ${output.count} 个工作流`,
    );
  return t("Folder operation", "文件夹操作");
}

function getAccordionIcon(output: FolderToolOutput) {
  if (isFolderCreated(output)) return <Icon icon={FolderAddIcon} size={32} />;
  if (isFolderList(output)) return <Icon icon={FolderLibraryIcon} size={32} />;
  if (isFolderDeleted(output)) return <Icon icon={Delete02Icon} size={32} />;
  return <Icon icon={Folder01Icon} size={32} />;
}

export function FolderTool({ part }: Props) {
  const { t } = useTranslation();
  const text = getAnimationText(part, t);
  const output = getFolderToolOutput(part);

  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available";
  const isError =
    part.state === "output-error" || (!!output && isErrorOutput(output));

  const hasContent =
    part.state === "output-available" && !!output && !isErrorOutput(output);

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 text-body text-foreground-tertiary">
        <ToolStatusIcon isStreaming={isStreaming} isError={isError} />
        <MorphingTextAnimation
          text={text}
          className={isError ? "text-error" : undefined}
        />
      </div>

      {hasContent && output && (
        <ToolAccordion
          icon={getAccordionIcon(output)}
          title={getAccordionTitle(output, t)}
          defaultExpanded={isFolderList(output)}
        >
          <AccordionContent output={output} />
        </ToolAccordion>
      )}
    </div>
  );
}
