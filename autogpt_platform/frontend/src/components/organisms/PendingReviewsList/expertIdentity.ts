import type { ExpertIdentity } from "@/app/api/__generated__/models/expertIdentity";
import type { PendingHumanReviewModel } from "@/app/api/__generated__/models/pendingHumanReviewModel";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import type { Locale } from "@/lib/i18n/locale";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

export type ExpertRoster = ReadonlyMap<string, ExpertIdentity>;

export interface CardExpert {
  title: string | null;
  avatarURL: string | null;
}

interface ExpertSnapshot {
  expert_id?: string | null;
  expert_role?: string | null;
  expert_job_title?: string | null;
  expert_name?: string | null;
  expert_avatar_url?: string | null;
}

export function getCardExpert(
  snapshot: ExpertSnapshot,
  locale: Locale,
  roster?: ExpertRoster,
): CardExpert {
  const expert = snapshot.expert_id ? roster?.get(snapshot.expert_id) : null;
  const avatarURL = snapshot.expert_avatar_url || expert?.avatar_url || null;
  const profession = {
    job_title: expert?.job_title?.trim() || snapshot.expert_job_title,
    role: expert?.role?.trim() || snapshot.expert_role,
  };
  if (
    !snapshot.expert_id &&
    !profession.job_title &&
    !profession.role &&
    snapshot.expert_name === AUTOPILOT_NAME
  ) {
    return { title: AUTOPILOT_NAME, avatarURL };
  }
  const hasExpert =
    snapshot.expert_id ||
    snapshot.expert_name ||
    avatarURL ||
    profession.job_title ||
    profession.role;
  return {
    title: hasExpert ? getExpertDisplayTitle(profession, locale) : null,
    avatarURL,
  };
}

export function getReviewExpertID(review: PendingHumanReviewModel) {
  return getChargedExpertID(review) ?? review.expert_id;
}

export function getChargedExpertID(review: PendingHumanReviewModel) {
  return /^(?:copilot-node-)?expert-spend:([^:]+):/.exec(
    review.node_exec_id,
  )?.[1];
}

export function getReviewExpert(
  review: PendingHumanReviewModel,
  locale: Locale,
  roster?: ExpertRoster,
) {
  const expertID = getReviewExpertID(review);
  return getCardExpert(
    expertID === review.expert_id ? review : { expert_id: expertID },
    locale,
    roster,
  );
}
