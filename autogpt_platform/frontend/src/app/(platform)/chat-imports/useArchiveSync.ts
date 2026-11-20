import { SESSION_LIST_QUERY_KEY } from "@/app/(platform)/copilot/useSessionList";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { archiveDestination, syncArchivedConversation } from "./api";
import { ImportValidationError } from "./validation";

export function useArchiveSync(ownerID: string, id: string) {
  const router = useRouter();
  const client = useQueryClient();
  const active = useRef<AbortController | null>(null);
  const sync = useMutation({
    async mutationFn({
      signal,
      destination,
    }: {
      signal: AbortSignal;
      destination: string;
    }) {
      const result = await syncArchivedConversation(id, {
        signal,
        destination,
      });
      signal.throwIfAborted();
      if (destination !== archiveDestination(ownerID)) {
        throw new ImportValidationError("archive-destination");
      }
      if (typeof result?.session_id !== "string" || !result.session_id) {
        throw new Error("Missing chat session");
      }
      void client.invalidateQueries({ queryKey: SESSION_LIST_QUERY_KEY });
      router.push(`/home?sessionId=${encodeURIComponent(result.session_id)}`);
    },
    gcTime: 0,
    retry: false,
  });

  useEffect(() => () => active.current?.abort(), [ownerID, id]);

  async function openChat() {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    try {
      await sync.mutateAsync({
        signal: controller.signal,
        destination: archiveDestination(ownerID),
      });
    } catch {
      return;
    } finally {
      active.current = null;
    }
  }

  return { openChat, isPending: sync.isPending, error: sync.error };
}
