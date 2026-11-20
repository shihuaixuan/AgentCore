import catalog from "./catalog.json";

export const MANAGED_IDENTITIES = catalog.identities;
export const EXPERT_PALETTE = catalog.palette;
/** The warm-stone General fallback: where a custom Expert starts and where
 *  an unknown legacy default lands. Never Otto, never someone else's face. */
export const DEFAULT_EXPERT_AVATAR_URL = catalog.default_url;
type ManagedIdentity = (typeof catalog.identities)[number];
export type VisualCategory = keyof typeof catalog.palette;

const legacy = new Map(Object.entries(catalog.legacy));
const identities = new Map(
  MANAGED_IDENTITIES.map((entry) => [entry.url, entry]),
);

/** Stored defaults that no longer ship (Notion SVGs, the retired clay sheets)
 *  resolve to the identity they stood for; uploads, generated images and
 *  current managed URLs pass through unchanged. */
export function resolveExpertAvatarUrl(url: string | null | undefined): string {
  if (!url) return DEFAULT_EXPERT_AVATAR_URL;
  const path = url.split(/[?#]/, 1)[0];
  const key = path.replace(
    /^(\/autogpt-characters\/v[\d.]+\/[a-z0-9-]+\/neutral)\/\d+\.(?:webp|png)$/,
    "$1/128.webp",
  );
  const portrait = legacy.get(key);
  if (portrait) return portrait;
  if (path.startsWith("/avatars/notion/") && path.endsWith(".svg")) {
    return DEFAULT_EXPERT_AVATAR_URL;
  }
  return url;
}

export function getManagedIdentity(
  url: string | null | undefined,
): ManagedIdentity | null {
  return identities.get(resolveExpertAvatarUrl(url)) ?? null;
}

export function isVisualCategory(value: string): value is VisualCategory {
  return value in EXPERT_PALETTE;
}

/** The palette family that colors the surfaces around an Expert. A managed
 *  identity carries its own family, so a filter or a category edit never
 *  changes it; a custom appearance takes the first stored category, and no
 *  category at all means the General warm stone. */
export function getExpertVisualCategory(
  avatarUrl: string | null | undefined,
  categories?: readonly string[] | null,
): VisualCategory {
  const identity = getManagedIdentity(avatarUrl);
  if (identity && identity.visual_category !== "general") {
    return identity.visual_category as VisualCategory;
  }
  const stored = categories
    ?.map((category) => category.toLowerCase())
    .find((category) => isVisualCategory(category) && category !== "otto");
  return (stored as VisualCategory | undefined) ?? "general";
}
