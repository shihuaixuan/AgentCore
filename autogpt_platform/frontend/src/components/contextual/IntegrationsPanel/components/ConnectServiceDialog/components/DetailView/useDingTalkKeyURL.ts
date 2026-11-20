import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { invalidateConnectionQueries } from "@/lib/react-query/invalidateConnections";
import { parseDingTalkKeyURL } from "../../../CustomMCPConnections/dingTalkKeyURL";
import { storeQueryKey } from "../../../CustomMCPConnections/queryKeyRequests";

export function useDingTalkKeyURL(
  onSuccess: (credential: CredentialsMetaResponse) => void,
) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const parsed = parseDingTalkKeyURL(value);

  function change(next: string) {
    setValue(next);
    setFailed(false);
  }

  async function save() {
    if (!parsed || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setSaving(true);
    setFailed(false);
    try {
      const stored = await storeQueryKey(
        parsed.serverURL,
        parsed.token,
        false,
        controller.signal,
      );
      controller.signal.throwIfAborted();
      if (stored.status !== 200) {
        setFailed(true);
        return;
      }
      setValue("");
      await invalidateConnectionQueries(queryClient);
      if (!controller.signal.aborted) onSuccess(stored.data);
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      active.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  return { value, change, canSave: !!parsed && !saving, save, saving, failed };
}
