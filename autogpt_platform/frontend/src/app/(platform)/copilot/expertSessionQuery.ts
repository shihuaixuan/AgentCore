import type { GetV2ListSessionsParams } from "@/app/api/__generated__/models/getV2ListSessionsParams";

const LATEST_EXPERT_SESSION_LIMIT = 1;

export function newRecipientChatHref(expertId: string | null) {
  return expertId === null
    ? "/home"
    : `/home?expertId=${encodeURIComponent(expertId)}&new=1`;
}

export function latestExpertSessionParams(
  expertId: string | null,
): GetV2ListSessionsParams {
  return {
    expert_id: expertId ?? undefined,
    limit: LATEST_EXPERT_SESSION_LIMIT,
    pinned_first: false,
  };
}

export function expertKickoffHistoryParams(expertId: string | null) {
  return { ...latestExpertSessionParams(expertId), include_sub_sessions: true };
}
