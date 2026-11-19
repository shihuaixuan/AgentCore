import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ARCHIVE_PAGE_SIZE,
  deleteArchivedConversation,
  getAttachment,
  getArchivedConversation,
  listArchive,
} from "./api";

export function useArchiveDownloads(chatID: string) {
  return useMutation({
    async mutationFn({
      attachmentID,
      name,
    }: {
      attachmentID: string;
      name: string;
    }) {
      const content = await getAttachment(chatID, attachmentID);
      if (!(content instanceof Blob))
        throw new Error("Invalid attachment response");
      const url = URL.createObjectURL(content);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
    },
    gcTime: 0,
    retry: false,
  });
}

function listKey(ownerID: string) {
  return ["chat-imports", ownerID, "list"] as const;
}

export function useArchive(ownerID: string) {
  const [page, setPage] = useState(0);
  const [activeID, setActiveID] = useState<string | null>(null);
  const client = useQueryClient();
  const list = useQuery({
    queryKey: [...listKey(ownerID), page],
    queryFn: ({ signal }) => listArchive(page * ARCHIVE_PAGE_SIZE, signal),
    gcTime: 0,
    retry: false,
  });

  function changePage(nextPage: number) {
    setPage(nextPage);
    setActiveID(null);
  }

  async function refreshArchive() {
    setPage(0);
    setActiveID(null);
    await client.invalidateQueries({ queryKey: listKey(ownerID) });
  }

  return { page, list, activeID, setActiveID, changePage, refreshArchive };
}

export function useArchivedConversation(
  ownerID: string,
  id: string,
  onDeleted: () => Promise<void>,
) {
  const [confirming, setConfirming] = useState(false);
  const detail = useQuery({
    queryKey: ["chat-imports", ownerID, "detail", id],
    queryFn: ({ signal }) => getArchivedConversation(id, signal),
    gcTime: 0,
    retry: false,
  });
  const removal = useMutation({
    mutationFn: () => deleteArchivedConversation(id),
    onSuccess: onDeleted,
    gcTime: 0,
    retry: false,
  });

  function cancelDelete() {
    setConfirming(false);
    removal.reset();
  }

  return { detail, confirming, setConfirming, removal, cancelDelete };
}
