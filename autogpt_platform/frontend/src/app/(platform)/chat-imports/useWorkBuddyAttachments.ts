import { useState, type ChangeEvent } from "react";
import {
  indexAttachmentDirectory,
  resolveAttachment,
} from "./workbuddyAttachments";
import type { WorkBuddyDraftEntry } from "./workbuddyTranscript";

const MiB = 1024 * 1024;

export function readLocalSelection(event: ChangeEvent<HTMLInputElement>) {
  const files = Array.from(event.currentTarget.files ?? []);
  event.currentTarget.value = "";
  return files;
}

export function fitsAttachmentLimits(files: File[]) {
  return (
    files.length <= 10 &&
    files.every((file) => file.size > 0 && file.size <= 5 * MiB) &&
    files.reduce((total, file) => total + file.size, 0) <= 10 * MiB
  );
}

export function useWorkBuddyAttachments(suggestedRoot: string) {
  const [directory, setDirectory] =
    useState<ReturnType<typeof indexAttachmentDirectory>>();
  const [rootOverride, setRootOverride] = useState<string>();
  const [mapped, setMapped] = useState(false);
  const [manual, setManual] = useState(new Map<number, File[]>());
  const [checked, setChecked] = useState(new Map<number, File[]>());
  const sourceRoot = rootOverride ?? suggestedRoot;

  function clear() {
    setDirectory(undefined);
    setRootOverride(undefined);
    setMapped(false);
    setManual(new Map());
    clearChecks();
  }

  function clearChecks() {
    setChecked(new Map());
  }

  function chooseDirectory(files: File[]) {
    setDirectory(files.length ? indexAttachmentDirectory(files) : undefined);
    setMapped(false);
    clearChecks();
  }

  function changeRoot(root: string) {
    setRootOverride(root);
    setMapped(false);
    clearChecks();
  }

  function confirmMapping(confirmed: boolean) {
    setMapped(confirmed);
    clearChecks();
  }

  function chooseManual(index: number, files: File[]) {
    if (!files.length) return;
    setManual(new Map(manual).set(index, files));
    setChecked(
      new Map(checked).set(
        index,
        selectedFiles(index).filter(
          (file) => !manual.get(index)?.includes(file),
        ),
      ),
    );
  }

  function selectedFiles(index: number) {
    return checked.get(index) ?? [];
  }

  function toggle(index: number, file: File, include: boolean) {
    const before = selectedFiles(index);
    const after = include
      ? [...new Set([...before, file])]
      : before.filter((existing) => existing !== file);
    if (fitsAttachmentLimits(after))
      setChecked(new Map(checked).set(index, after));
  }

  function preview(entry: WorkBuddyDraftEntry, index: number) {
    const matched = new Set<File>();
    const unmatched = new Set<string>();
    for (const ref of entry.references) {
      const base = ref.cwd ?? entry.cwd ?? rootOverride ?? "";
      const file =
        mapped &&
        directory &&
        resolveAttachment(ref.path, sourceRoot, directory, base);
      if (file) matched.add(file);
      else unmatched.add(ref.path);
    }
    return {
      files: [...matched, ...(manual.get(index) ?? [])],
      unmatched: [...unmatched],
    };
  }

  return {
    clear,
    clearChecks,
    directory,
    mapped,
    confirmMapping,
    sourceRoot,
    changeRoot,
    chooseDirectory,
    chooseManual,
    selectedFiles,
    toggle,
    preview,
  };
}
