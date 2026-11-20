import { SESSION_LIST_QUERY_KEY } from "@/app/(platform)/copilot/useSessionList";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { archiveDestination } from "./api";
import {
  reviewDirectory,
  type DirectoryReview,
  type ReviewEntry,
} from "./directoryReview";
import type { NativeImportSource } from "./readLocalHistory";
import {
  syncReviewedSelection,
  type DirectorySyncProgress,
} from "./syncDirectory";
import { ImportValidationError } from "./validation";

type SyncState = {
  phase: "reading" | "review" | "syncing" | "done" | "stopped";
  progress: DirectorySyncProgress | null;
  scan?: { read: number; total: number };
  error?: unknown;
};

type Session = {
  controller: AbortController;
  destination: string;
  syncing: boolean;
};

export function useDirectorySync(ownerID: string) {
  const [state, setState] = useState<SyncState>();
  const [review, setReview] = useState<DirectoryReview>();
  const [selected, setSelected] = useState<Set<ReviewEntry>>(new Set());
  const active = useRef<Session | null>(null);
  const client = useQueryClient();

  useEffect(() => () => active.current?.controller.abort(), [ownerID]);

  function clear() {
    active.current?.controller.abort();
    active.current = null;
    setReview(undefined);
    setSelected(new Set());
    setState(undefined);
  }

  async function start(source: NativeImportSource, files: File[]) {
    if (active.current?.syncing || !files.length) return;
    clear();
    const controller = new AbortController();
    const { signal } = controller;
    const destination = archiveDestination(ownerID);
    active.current = { controller, destination, syncing: false };
    setState({ phase: "reading", progress: null });
    try {
      const result = await reviewDirectory(
        source,
        files,
        signal,
        (read, total) => {
          setState({ phase: "reading", progress: null, scan: { read, total } });
        },
      );
      signal.throwIfAborted();
      setReview(result);
      setState({ phase: "review", progress: null });
    } catch (error) {
      if (!signal.aborted)
        setState({ phase: "stopped", progress: null, error });
    }
  }

  async function confirm() {
    const session = active.current;
    if (!session || session.syncing || !review || !selected.size) return;
    session.syncing = true;
    const {
      destination,
      controller: { signal },
    } = session;
    let progress: DirectorySyncProgress | null = null;
    let sent = false;
    setState({ phase: "syncing", progress });
    try {
      await syncReviewedSelection(review, selected, {
        destination,
        signal,
        beforeRequest() {
          if (destination !== archiveDestination(ownerID)) {
            throw new ImportValidationError("archive-destination");
          }
          sent = true;
        },
        onConfirmed(entries) {
          setSelected((previous) => {
            const next = new Set(previous);
            for (const entry of entries) next.delete(entry);
            return next;
          });
        },
        onProgress(next) {
          signal.throwIfAborted();
          progress = next;
          setState({ phase: "syncing", progress });
        },
      });
      if (!signal.aborted) setState({ phase: "done", progress });
    } catch (error) {
      if (!signal.aborted) setState({ phase: "stopped", progress, error });
    } finally {
      session.syncing = false;
      if (sent) {
        void client.invalidateQueries({ queryKey: SESSION_LIST_QUERY_KEY });
      }
    }
  }

  function toggle(entry: ReviewEntry, checked: boolean) {
    if (active.current?.syncing) return;
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(entry);
      else next.delete(entry);
      return next;
    });
  }

  function selectAll(checked: boolean) {
    if (!active.current?.syncing)
      setSelected(new Set(checked ? review?.entries : []));
  }

  const busy = state?.phase === "syncing";
  return {
    busy,
    state,
    review,
    selected,
    toggle,
    selectAll,
    start,
    confirm,
    clear,
  };
}
