import { parseAsString, useQueryStates } from "nuqs";
import { useEffect } from "react";
import { useAutopilotModeStore } from "../../autopilotModeStore";
import { useExpertMap } from "../../useExpertMap";
import { recipientOptions } from "../ChatInput/components/recipientOptions";

export function useRecipientPicker() {
  const {
    expertsById,
    activeExperts,
    activeExpertIds,
    hasExpertsSettled,
    hasExpertsLoaded,
    isExpertsError,
  } = useExpertMap();
  const [{ expertId: expertIdParam }, setRecipientParams] = useQueryStates({
    expertId: parseAsString,
    new: parseAsString,
  });

  // An ?expertId= pointing at an expert the user can no longer address
  // (archived, deleted, or simply wrong) must not reach `createSession`.
  // Clear it so the composer and session creation both use the ordinary task.
  useEffect(
    function clearUnknownExpertParam() {
      if (!hasExpertsSettled || !expertIdParam) return;
      if (activeExpertIds.has(expertIdParam)) return;
      void setRecipientParams({ expertId: null, new: null });
    },
    [activeExpertIds, hasExpertsSettled, expertIdParam, setRecipientParams],
  );

  const selectedExpert =
    activeExperts.find((expert) => expert.id === expertIdParam) ?? null;

  const options = recipientOptions(activeExperts);

  return {
    options,
    /** The experts the user can address; who can take a suggested task. */
    experts: activeExperts,
    /** Fired experts too: who a started task's chat is with. */
    expertsById,
    isRosterLoaded: hasExpertsLoaded,
    hasRosterFailed: isExpertsError,
    recipient: options.find((option) => option.id === expertIdParam) ?? null,
    selectedExpert,
    // Don't render a pending expert deep link as an ordinary task. Keyed on
    // "not settled yet" rather than "fetching": a paused query (offline)
    // reports `isFetching: false` while it still has no roster to resolve
    // against.
    isLoadingRecipient: !hasExpertsSettled && !!expertIdParam,
    selectRecipient(id: string | null) {
      // A mode picked for one recipient must not reach another's new chat.
      // Cleared now: a task sent on the switch reads it before
      // useChatSession's own clear runs.
      if (id !== expertIdParam) {
        useAutopilotModeStore.getState().clearNewChatChoice();
      }
      void setRecipientParams({ expertId: id, new: id ? "1" : null });
    },
  };
}
