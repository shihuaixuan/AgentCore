"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetV2ListLibraryAgentsQueryKey,
  useDeleteV2DeleteLibraryAgent,
  useGetV2ListLibraryAgents,
  usePostV2AddMarketplaceAgent,
} from "@/app/api/__generated__/endpoints/library/library";
import { getV2GetSpecificAgent } from "@/app/api/__generated__/endpoints/store/store";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { LibraryAgentResponse } from "@/app/api/__generated__/models/libraryAgentResponse";
import { Button } from "@/components/atoms/Button/Button";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import * as Sentry from "@sentry/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

function UndoActions({
  libraryAgentID,
  libraryHref,
  onUndo,
}: {
  libraryAgentID: string;
  libraryHref: string;
  onUndo: (id: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [isUndoing, setIsUndoing] = useState(false);

  return (
    <div className="mt-6 flex items-center gap-2">
      <Button
        variant="primary"
        size="small"
        as="NextLink"
        tone="primary"
        // oxlint-disable-next-line design-system/no-restyle -- a light button on the dark toast; no Button variant is light-on-dark
        className="bg-surface-active hover:bg-border-strong hover:text-foreground-emphasis"
        href={libraryHref}
      >
        {t("Open workflow", "打开工作流")}
      </Button>
      <Button
        variant="ghost"
        size="small"
        loading={isUndoing}
        // oxlint-disable-next-line design-system/no-restyle -- a quiet text button on the dark toast; no Button variant is light-on-dark
        className="border-none text-surface-active hover:bg-transparent hover:text-foreground-subtle"
        onClick={async () => {
          setIsUndoing(true);
          try {
            await onUndo(libraryAgentID);
          } finally {
            setIsUndoing(false);
          }
        }}
      >
        {isUndoing ? t("Undoing...", "正在撤销…") : t("Undo", "撤销")}
      </Button>
    </div>
  );
}

interface Props {
  creatorSlug: string;
  agentSlug: string;
  agentName: string;
  agentGraphID: string;
  className?: string;
  isInLibrary?: boolean;
}

export function AddToLibraryButton({
  creatorSlug,
  agentSlug,
  agentName,
  agentGraphID,
  className,
  isInLibrary,
}: Props) {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [justAdded, setJustAdded] = useState(false);

  // Only fetch library list if isInLibrary wasn't provided by parent
  const { data: libraryAgents } = useGetV2ListLibraryAgents(
    { is_hidden: false },
    {
      query: {
        enabled: isLoggedIn && isInLibrary === undefined,
        select: (res) =>
          res.status === 200 ? (res.data as LibraryAgentResponse) : undefined,
      },
    },
  );

  const { mutateAsync: addToLibrary, isPending } =
    usePostV2AddMarketplaceAgent();

  const { mutateAsync: removeFromLibrary } = useDeleteV2DeleteLibraryAgent();

  if (!isLoggedIn) return null;
  if (justAdded) return null;

  const isAlreadyInLibrary =
    isInLibrary ??
    libraryAgents?.agents?.some(
      (a: LibraryAgent) => a.graph_id === agentGraphID,
    );

  if (isAlreadyInLibrary) return null;

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    try {
      const details = await getV2GetSpecificAgent(creatorSlug, agentSlug);

      if (details.status !== 200) {
        throw new Error(
          t("Failed to fetch workflow details", "无法获取工作流详情"),
        );
      }

      const { data: response } = await addToLibrary({
        data: {
          store_listing_version_id: details.data.store_listing_version_id,
        },
      });

      const data = response as LibraryAgent;
      setJustAdded(true);

      await queryClient.invalidateQueries({
        queryKey: getGetV2ListLibraryAgentsQueryKey(),
      });

      const addedToast = toast({
        title: t(
          `Workflow ${agentName} added to your library.`,
          `工作流 ${agentName} 已添加到你的工作流库。`,
        ),
        description: (
          <UndoActions
            libraryAgentID={data.id}
            libraryHref={`/library/agents/${data.id}`}
            onUndo={async (id) => {
              try {
                await removeFromLibrary({ libraryAgentId: id });
                await queryClient.invalidateQueries({
                  queryKey: getGetV2ListLibraryAgentsQueryKey(),
                });
                setJustAdded(false);
                addedToast.dismiss();
                toast({
                  title: t("Action undone.", "操作已撤销。"),
                  variant: "info",
                  duration: 3000,
                });
              } catch (undoError) {
                Sentry.captureException(undoError);
                toast({
                  title: t(
                    "Failed to undo. Please try again.",
                    "撤销失败，请重试。",
                  ),
                  variant: "destructive",
                });
              }
            }}
          />
        ),
        dismissable: false,
        duration: 10000,
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to add workflow to library. Please try again.",
          "无法将工作流添加到库，请重试。",
        ),
        variant: "destructive",
      });
    }
  }

  return (
    <Button
      variant="secondary"
      size="small"
      loading={isPending}
      leftIcon={<Icon icon={PlusSignIcon} size={14} />}
      onClick={handleClick}
      className={`z-10 ${className ?? ""}`}
      aria-label={t(
        `Add ${agentName} to library`,
        `将 ${agentName} 添加到工作流库`,
      )}
    >
      {isPending ? t("Adding...", "正在添加…") : t("Add", "添加")}
    </Button>
  );
}
