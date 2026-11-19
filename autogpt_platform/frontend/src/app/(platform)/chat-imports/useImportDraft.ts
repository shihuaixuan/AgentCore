import { saveConversations, type SaveResult } from "./api";
import { useState } from "react";
import { WorkBuddyPartialSaveError } from "./saveWorkBuddy";
import {
  ImportValidationError,
  MAX_SELECTION,
  type ImportConversation,
} from "./validation";
import {
  readWorkBuddyFiles,
  type WorkBuddyDraftEntry,
} from "./workbuddyTranscript";

export function useSaveImport(onSaved: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<SaveResult | null>(null);

  function clearNotice() {
    setError(null);
    setResult(null);
  }

  async function submit(persist: () => Promise<SaveResult>) {
    clearNotice();
    setPending(true);
    try {
      setResult(await persist());
      void onSaved();
      return true;
    } catch (error) {
      if (error instanceof WorkBuddyPartialSaveError) {
        setError(error);
        void onSaved();
      } else {
        setError(error instanceof ImportValidationError ? error : "save");
      }
      return false;
    } finally {
      setPending(false);
    }
  }

  function save(getConversations: () => ImportConversation[]) {
    return submit(() => saveConversations(getConversations()));
  }

  return { pending, error, result, save, submit, clearNotice };
}

export function useWorkBuddyDraft() {
  const [entries, setEntries] = useState<WorkBuddyDraftEntry[]>([]);
  const [filesRead, setFilesRead] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState<number | null>(null);

  function clear() {
    setEntries([]);
    setFilesRead(0);
    setError(null);
    setSelected(new Set());
    setPreview(null);
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
    entries,
    filesRead,
    loading,
    error,
    selected,
    preview,
    setPreview,
    clear,
    read,
    toggle,
    removeSelection,
  };
}
