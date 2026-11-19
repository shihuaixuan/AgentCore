import { ImpersonationState } from "@/lib/impersonation";
import { useEffect, useRef, useState } from "react";
import {
  saveConversations,
  type ArchiveSaveRequest,
  type SaveResult,
} from "./api";
import { PartialArchiveSaveError, saveNativeChats } from "./saveNativeChats";
import {
  ImportValidationError,
  MAX_SELECTION,
  type ImportConversation,
  type NativeChatDraft,
} from "./validation";
import { readWorkBuddyFiles } from "./workbuddyTranscript";

export function useSaveImport(ownerID: string, onSaved: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), [ownerID]);

  function clearNotice() {
    setError(null);
    setResult(null);
  }

  async function submit(
    persist: (request: ArchiveSaveRequest) => Promise<SaveResult>,
  ) {
    if (active.current) return false;
    const controller = new AbortController();
    active.current = controller;
    const destination = JSON.stringify([
      ownerID,
      ImpersonationState.get() ?? ownerID,
    ]);
    clearNotice();
    setPending(true);
    try {
      const saved = await persist({ destination, signal: controller.signal });
      if (controller.signal.aborted) return false;
      setResult(saved);
      void onSaved();
      return true;
    } catch (error) {
      if (controller.signal.aborted) return false;
      if (error instanceof PartialArchiveSaveError) {
        setError(error);
        void onSaved();
      } else {
        setError(error instanceof ImportValidationError ? error : "save");
      }
      return false;
    } finally {
      active.current = null;
      setPending(false);
    }
  }

  function save(getConversations: () => ImportConversation[]) {
    return submit((request) => saveConversations(getConversations(), request));
  }

  return { pending, error, result, save, submit, clearNotice };
}

export function useImportSelection() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState<number | null>(null);

  function clearSelection() {
    setSelected(new Set());
    setPreview(null);
  }

  function toggle(index: number, checked: boolean) {
    setSelected(function update(previous) {
      const next = new Set(previous);
      if (!checked) next.delete(index);
      else if (next.size < MAX_SELECTION) next.add(index);
      return next;
    });
  }

  function removeSelection(indexes: number[]) {
    setSelected(
      (previous) =>
        new Set([...previous].filter((index) => !indexes.includes(index))),
    );
  }

  return {
    selected,
    preview,
    setPreview,
    clearSelection,
    toggle,
    removeSelection,
  };
}

export function useWorkBuddyDraft() {
  const [entries, setEntries] = useState<NativeChatDraft[]>([]);
  const [filesRead, setFilesRead] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const selection = useImportSelection();

  function clear() {
    setEntries([]);
    setFilesRead(0);
    setError(null);
    selection.clearSelection();
  }

  async function read(files: File[]) {
    clear();
    setLoading(true);
    try {
      setEntries(await readWorkBuddyFiles(files));
      setFilesRead(files.length);
    } catch (error) {
      setError(error instanceof ImportValidationError ? error : "read");
    } finally {
      setLoading(false);
    }
  }

  return { entries, filesRead, loading, error, clear, read, ...selection };
}

export function useSaveNativeImport(
  ownerID: string,
  onSaved: () => Promise<void>,
) {
  const save = useSaveImport(ownerID, onSaved);

  function submitSelected(
    entries: NativeChatDraft[],
    selection: ReturnType<typeof useImportSelection>,
    selectedFiles: (index: number) => File[],
    checkFiles?: (files: File[]) => Promise<void>,
  ) {
    const indexes = [...selection.selected].sort((left, right) => left - right);
    const chats = indexes.map((index) => ({
      conversation: entries[index].conversation,
      files: selectedFiles(index),
    }));
    return save.submit(async (request) => {
      if (checkFiles) await checkFiles(chats.flatMap(({ files }) => files));
      return saveNativeChats(chats, request, (confirmed) => {
        selection.removeSelection(confirmed.map((index) => indexes[index]));
      });
    });
  }

  return { ...save, submitSelected };
}
