import type { Locale } from "@/lib/i18n/locale";
import {
  getCardExpert,
  type ExpertRoster,
} from "@/components/organisms/PendingReviewsList/expertIdentity";
import type { Reference } from "./helpers";

export interface ReferenceIdentity {
  title: string | null;
  avatarURL: Reference["avatarURL"];
  facts: Reference["meta"];
}

export function getReferenceIdentity(
  reference: Reference,
  locale: Locale,
  roster?: ExpertRoster,
): ReferenceIdentity {
  const { name, kind, entity, meta, avatarURL } = reference;
  const isExpert =
    entity === "expert" ||
    entity === "expert_or_name" ||
    entity === "soul_change" ||
    entity === "team_change";
  if (!isExpert || kind?.endsWith(" with a first task")) {
    return { title: name, avatarURL, facts: meta };
  }

  const expertID = getReferenceExpertID(reference);
  if (!name && (!expertID || !roster?.has(expertID))) {
    return { title: name, avatarURL, facts: meta };
  }

  const [firstFact, ...otherFacts] = meta;
  const profession =
    firstFact &&
    !firstFact.cron &&
    !firstFact.at &&
    firstFact.text !== "Archived"
      ? firstFact.text
      : null;
  return {
    ...getCardExpert(
      {
        expert_id: expertID,
        expert_name: name,
        expert_role: profession,
        expert_avatar_url: avatarURL,
      },
      locale,
      roster,
    ),
    facts: profession ? otherFacts : meta,
  };
}

function getReferenceExpertID({ entity, id, href }: Reference) {
  if (entity === "expert") return id;
  const encodedID = /^\/team\/([^/\\?#]+)$/.exec(href ?? "")?.[1];
  if (!encodedID) return entity === "expert_or_name" ? id : null;
  try {
    return decodeURIComponent(encodedID);
  } catch {
    return null;
  }
}
