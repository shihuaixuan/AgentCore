import { useState } from "react";
import type { QwenWorkReadResult } from "./qwenWorkDatabase";
import { findQwenWorkDatabase } from "./qwenWorkDirectory";
import { readQwenWorkInWorker } from "./readQwenWorkInWorker";
import { useImportSelection } from "./useImportDraft";
import { ImportValidationError } from "./validation";

export function useQwenWorkDraft() {
  const [snapshot, setSnapshot] = useState<ArrayBuffer>();
  const [result, setResult] = useState<QwenWorkReadResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const selection = useImportSelection();

  function clear() {
    setSnapshot(undefined);
    setResult(undefined);
    setError(null);
    selection.clearSelection();
  }

  async function loadPage(
    getSnapshot: () => Promise<ArrayBuffer>,
    page: number,
  ) {
    setLoading(true);
    setError(null);
    try {
      const bytes = await getSnapshot();
      setResult(await readQwenWorkInWorker(bytes.slice(0), page));
      setSnapshot(bytes);
    } catch (error) {
      setError(error instanceof ImportValidationError ? error : "read");
    } finally {
      setLoading(false);
    }
  }

  function read(files: File[]) {
    clear();
    return loadPage(() => findQwenWorkDatabase(files).arrayBuffer(), 0);
  }

  function changePage(page: number) {
    if (!snapshot || page < 0 || loading || selection.selected.size) return;
    selection.clearSelection();
    return loadPage(async () => snapshot, page);
  }

  return {
    result,
    entries: result?.entries ?? [],
    loading,
    error,
    clear,
    read,
    changePage,
    ...selection,
  };
}
