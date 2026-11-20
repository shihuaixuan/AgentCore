import type { ExpertAvatarRequest } from "@/app/api/__generated__/models/expertAvatarRequest";
import type { ExpertAvatarRequestCategory } from "@/app/api/__generated__/models/expertAvatarRequestCategory";
import { ExpertAvatarRequestExpression } from "@/app/api/__generated__/models/expertAvatarRequestExpression";
import {
  MANAGED_IDENTITIES,
  DEFAULT_EXPERT_AVATAR_URL,
} from "../ExpertAvatar/helpers";

export const ACCEPTED_AVATAR_TYPES = "image/png,image/jpeg,image/webp";

export function defaultAvatarUrl(
  category: ExpertAvatarRequestCategory,
  name: string,
) {
  const family = MANAGED_IDENTITIES.filter(
    (identity) => identity.visual_category === category,
  );
  const candidates = family.length
    ? family
    : MANAGED_IDENTITIES.filter((identity) =>
        identity.categories.includes(category),
      );
  let hash = 0;
  for (const character of name.trim().toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  const identity = candidates[hash % candidates.length];
  return identity
    ? `/experts/professional/${identity.id}.webp`
    : DEFAULT_EXPERT_AVATAR_URL;
}

export function randomAvatarRequest(
  category: ExpertAvatarRequestCategory,
): ExpertAvatarRequest {
  return {
    category,
    expression: pick(Object.values(ExpertAvatarRequestExpression)),
  };
}

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}
