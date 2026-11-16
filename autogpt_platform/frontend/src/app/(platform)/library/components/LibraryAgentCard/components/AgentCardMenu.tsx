"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetV2ListLibraryAgentsQueryKey,
  useDeleteV2DeleteLibraryAgent,
  usePostV2ForkLibraryAgent,
} from "@/app/api/__generated__/endpoints/library/library";
import {
  usePostV2BulkMoveAgents,
  getGetV2ListLibraryFoldersQueryKey,
} from "@/app/api/__generated__/endpoints/folders/folders";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoveToFolderDialog } from "../../MoveToFolderDialog/MoveToFolderDialog";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface AgentCardMenuProps {
  agent: LibraryAgent;
}

export function AgentCardMenu({ agent }: AgentCardMenuProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);
  const [isDuplicatingAgent, setIsDuplicatingAgent] = useState(false);
  const [isRemovingFromFolder, setIsRemovingFromFolder] = useState(false);

  const { mutateAsync: deleteAgent } = useDeleteV2DeleteLibraryAgent();
  const { mutateAsync: forkAgent } = usePostV2ForkLibraryAgent();
  const { mutateAsync: bulkMoveAgents } = usePostV2BulkMoveAgents({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetV2ListLibraryAgentsQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetV2ListLibraryFoldersQueryKey(),
        });
      },
    },
  });

  async function handleDuplicateAgent() {
    if (!agent.id) return;

    setIsDuplicatingAgent(true);

    try {
      const result = await forkAgent({ libraryAgentId: agent.id });

      if (result.status === 200) {
        await queryClient.refetchQueries({
          queryKey: getGetV2ListLibraryAgentsQueryKey(),
        });

        toast({
          title: "Workflow duplicated",
          description: `${result.data.name} has been created.`,
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Failed to duplicate workflow",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDuplicatingAgent(false);
    }
  }

  async function handleRemoveFromFolder() {
    if (!agent.id) return;

    setIsRemovingFromFolder(true);

    try {
      await bulkMoveAgents({
        data: {
          agent_ids: [agent.id],
          folder_id: null,
        },
      });

      toast({
        title: "Removed from folder",
        description: "Workflow has been moved back to your library.",
      });
    } catch (error: unknown) {
      toast({
        title: "Failed to remove from folder",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingFromFolder(false);
    }
  }

  async function handleDeleteAgent() {
    if (!agent.id) return;

    setIsDeletingAgent(true);

    try {
      await deleteAgent({ libraryAgentId: agent.id });

      await queryClient.refetchQueries({
        queryKey: getGetV2ListLibraryAgentsQueryKey(),
      });

      toast({ title: "Workflow deleted" });
      setShowDeleteDialog(false);
      router.push("/library");
    } catch (error: unknown) {
      toast({
        title: "Failed to delete workflow",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAgent(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute top-1 right-2 rounded p-1.5 text-foreground-secondary transition-opacity hover:bg-surface-hover"
            onClick={(e) => e.stopPropagation()}
            aria-label={t("More actions", "更多操作")}
          >
            <Icon icon={MoreHorizontalIcon} className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {agent.can_access_graph && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`/build?flowID=${agent.graph_id}&flowVersion=${agent.graph_version}`}
                  target="_blank"
                  className="flex items-center gap-2"
                  data-testid="library-agent-card-open-in-builder-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("Edit workflow", "编辑工作流")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicateAgent();
            }}
            disabled={isDuplicatingAgent}
          >
            {t("Duplicate workflow", "复制工作流")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveDialog(true);
            }}
          >
            {t("Move to folder", "移动到文件夹")}
          </DropdownMenuItem>
          {agent.folder_id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFromFolder();
                }}
                disabled={isRemovingFromFolder}
              >
                {t("Remove from folder", "从文件夹移出")}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            // oxlint-disable-next-line design-system/no-restyle -- DropdownMenuItem has no destructive variant
            className="text-error-foreground focus:bg-error-surface focus:text-error-foreground"
          >
            {t("Delete workflow", "删除工作流")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        controlled={{
          isOpen: showDeleteDialog,
          set: setShowDeleteDialog,
        }}
        styling={{ maxWidth: "32rem" }}
        title={t("Delete workflow", "删除工作流")}
      >
        <Dialog.Content>
          <div>
            <Text variant="large">
              {t(
                "Are you sure you want to delete this workflow? This action cannot be undone.",
                "确定要删除此工作流吗？此操作无法撤销。",
              )}
            </Text>
            <Dialog.Footer>
              <Button
                variant="secondary"
                disabled={isDeletingAgent}
                onClick={() => setShowDeleteDialog(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAgent}
                loading={isDeletingAgent}
              >
                {t("Delete Workflow", "删除工作流")}
              </Button>
            </Dialog.Footer>
          </div>
        </Dialog.Content>
      </Dialog>

      <MoveToFolderDialog
        agentId={agent.id}
        agentName={agent.name}
        currentFolderId={agent.folder_id}
        isOpen={showMoveDialog}
        setIsOpen={setShowMoveDialog}
      />
    </>
  );
}
