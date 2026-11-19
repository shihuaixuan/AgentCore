import type { UIMessage } from "ai";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  expertRecipient,
  recipientOptions,
} from "./components/ChatInput/components/recipientOptions";
import {
  getMessageReplyRecipient,
  type ReplyRecipient,
} from "./helpers/replyRecipient";
import type { ExpertIdentity } from "./useExpertMap";
import type { TurnRecipient } from "./turnRecipient";

const useThreadRecipientChoices = create<{
  choices: Record<string, string | null>;
  choose: (key: string, id: string | null) => void;
}>()(
  persist(
    (set) => ({
      choices: {},
      choose: (key, id) =>
        set((state) => ({ choices: { ...state.choices, [key]: id } })),
    }),
    {
      name: "copilot-thread-recipients",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

interface Args {
  userId: string | undefined;
  sessionId: string | null;
  messages: UIMessage[];
  pinnedExpertId: string | null;
  pinnedExpert: ExpertIdentity | null;
  roster: {
    byId: Map<string, ExpertIdentity>;
    active: ExpertIdentity[];
    pending: boolean;
    failed: boolean;
  };
}

export function useThreadRecipient({
  userId,
  sessionId,
  messages,
  pinnedExpertId,
  pinnedExpert,
  roster,
}: Args) {
  const key = userId && sessionId ? `${userId}:${sessionId}` : null;
  const choice = useThreadRecipientChoices((state) =>
    key ? state.choices[key] : undefined,
  );
  const choose = useThreadRecipientChoices((state) => state.choose);
  const latest =
    key && choice === undefined ? latestReplyRecipient(messages) : null;
  const expertId =
    choice !== undefined ? choice : latest ? latest.id : pinnedExpertId;
  const expert = expertId ? roster.byId.get(expertId) : null;
  const snapshot = choice === undefined ? latest : null;
  const recipient = expert
    ? expertRecipient(expert)
    : snapshot?.id && snapshot.id === expertId
      ? { id: snapshot.id, name: snapshot.name, avatarUrl: snapshot.avatar_url }
      : pinnedExpert && pinnedExpert.id === expertId
        ? expertRecipient(pinnedExpert)
        : null;
  const isSwitched = expertId !== pinnedExpertId;
  const isUnavailable = Boolean(
    expertId && (roster.failed || !expert || expert.isArchived),
  );

  function onSelect(id: string | null) {
    if (
      key &&
      (id === null || roster.active.some((expert) => expert.id === id))
    ) {
      choose(key, id);
    }
  }

  const target: TurnRecipient = expertId
    ? { type: "expert", expert_id: expertId }
    : { type: "otto" };
  return {
    picker: {
      recipient:
        recipient ??
        (expertId ? { id: expertId, name: "Expert", avatarUrl: null } : null),
      options: recipientOptions(roster.active),
      isRosterPending: roster.pending,
      hasRosterFailed: roster.failed,
      onSelect,
      isThreadPicker: true,
    },
    expertId,
    name: recipient?.name ?? (expertId ? "Expert" : "Otto"),
    target,
    isSwitched,
    isUnavailable,
  };
}

function latestReplyRecipient(messages: UIMessage[]): ReplyRecipient | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const recipient = getMessageReplyRecipient(messages[index]);
    if (recipient) return recipient;
  }
  return null;
}
