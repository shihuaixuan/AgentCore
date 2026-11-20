import { SESSION_LIST_QUERY_KEY } from "@/app/(platform)/copilot/useSessionList";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { archiveDestination } from "./api";
import type { NativeImportSource } from "./readLocalHistory";
import { syncDirectory, type DirectorySyncProgress } from "./syncDirectory";
import { ImportValidationError } from "./validation";

type SyncState = {
  phase: "reading" | "syncing" | "done" | "stopped";
  progress: DirectorySyncProgress | null;
  error?: unknown;
};

export function useDirectorySync(ownerID: string) {
  const [state, setState] = useState<SyncState>();
  const active = useRef<AbortController | null>(null);
  const client = useQueryClient();

  useEffect(() => () => active.current?.abort(), [ownerID]);

  async function start(source: NativeImportSource, files: File[]) {
    if (active.current || !files.length) return;
    const controller = new AbortController();
    active.current = controller;
    const { signal } = controller;
    const destination = archiveDestination(ownerID);
    let progress: DirectorySyncProgress | null = null;
    let startedSync = false;
    setState({ phase: "reading", progress });
    try {
      await syncDirectory(source, files, {
        destination,
        signal,
        beforeRequest() {
          if (destination !== archiveDestination(ownerID)) {
            throw new ImportValidationError("archive-destination");
          }
          if (startedSync) return;
          startedSync = true;
          setState({ phase: "syncing", progress });
        },
        onProgress(next) {
          signal.throwIfAborted();
          progress = next;
          setState({ phase: startedSync ? "syncing" : "reading", progress });
        },
      });
      if (!signal.aborted) setState({ phase: "done", progress });
    } catch (error) {
      if (!signal.aborted) setState({ phase: "stopped", progress, error });
    } finally {
      active.current = null;
      if (startedSync) {
        void client.invalidateQueries({ queryKey: SESSION_LIST_QUERY_KEY });
      }
    }
  }

  const busy = state?.phase === "reading" || state?.phase === "syncing";
  return { busy, state, start };
}
