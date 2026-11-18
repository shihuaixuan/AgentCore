import {
  useEffect,
  useInsertionEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { useAuthStore } from "@/lib/auth/hooks/useAuthStore";
import { useReadEveryRender } from "@/hooks/useReadEveryRender";

const subscribers = new Map<string, Set<(value: string) => void>>();
// Drafts browser storage refused, for a reader that doesn't follow the draft.
// A draft leaves once storage takes a later write of it.
const written = new Map<string, string>();

function readDraft(key: string | null) {
  if (!key || typeof window === "undefined") return "";
  const inMemory = written.get(key);
  if (inMemory !== undefined) return inMemory;
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(key: string | null, value: string) {
  if (!key || typeof window === "undefined") return;
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
    written.delete(key);
  } catch {
    /* Keep the in-memory draft when browser storage is unavailable. */
    written.set(key, value);
  }
  subscribers.get(key)?.forEach((receive) => receive(value));
}

function storageKey(userID?: string, draftKey?: string) {
  return draftKey && userID
    ? `autogpt:chat-draft:${encodeURIComponent(userID)}:${encodeURIComponent(draftKey)}`
    : null;
}

export function useChatDraft(draftKey?: string) {
  const userID = useAuthStore((state) => state.user?.id);
  const key = storageKey(userID, draftKey);
  const [snapshot, setSnapshot] = useState(() => ({
    key,
    value: readDraft(key),
  }));
  const unsynced = useReadEveryRender(() =>
    snapshot.key === key ? null : readDraft(key),
  );
  const visible = unsynced === null ? snapshot : { key, value: unsynced };
  const current = useRef(visible);
  useInsertionEffect(() => {
    current.current = visible;
  });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!key) return;
    function receive(value: string) {
      const next = { key, value };
      current.current = next;
      setSnapshot(next);
    }
    const listeners = subscribers.get(key) ?? new Set();
    listeners.add(receive);
    subscribers.set(key, listeners);
    return () => {
      listeners.delete(receive);
      if (!listeners.size) subscribers.delete(key);
    };
  }, [key]);
  function setValue(update: SetStateAction<string>) {
    const previous =
      mounted.current && current.current.key === key
        ? current.current.value
        : readDraft(key);
    const value = typeof update === "function" ? update(previous) : update;
    writeDraft(key, value);
    if (mounted.current && current.current.key === key) {
      const next = { key, value };
      current.current = next;
      setSnapshot(next);
    }
  }
  return [visible.value, setValue] as const;
}

/** The draft for a hook that acts on it without showing it. It is read when
 *  asked rather than followed, so typing doesn't re-render the hook's host. */
export function useChatDraftAccess(draftKey?: string) {
  const userID = useAuthStore((state) => state.user?.id);
  const key = storageKey(userID, draftKey);
  function read() {
    return readDraft(key);
  }
  function write(update: SetStateAction<string>) {
    writeDraft(key, typeof update === "function" ? update(read()) : update);
  }
  function moveTo(destination: string, value: string) {
    const target = storageKey(userID, destination);
    if (!key || !target || key === target || !value.trim()) return;
    const existing = readDraft(target);
    writeDraft(
      target,
      existing.trim() && existing !== value ? `${value}\n\n${existing}` : value,
    );
    writeDraft(key, "");
  }
  return { read, write, moveTo };
}
