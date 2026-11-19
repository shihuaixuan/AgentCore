import type { ProfileDetails } from "@/app/api/__generated__/models/profileDetails";
import type { Locale } from "@/lib/i18n/locale";

export const MAX_LINKS = 5;
export const INITIAL_LINK_SLOTS = 3;
export const MAX_BIO_LENGTH = 280;
export const HANDLE_REGEX = /^[a-zA-Z0-9_-]{2,30}$/;

export type LinkRow = {
  id: string;
  value: string;
};

let linkIdCounter = 0;
function nextLinkId(): string {
  linkIdCounter += 1;
  return `link-${linkIdCounter}`;
}

export function makeLinkRow(value = ""): LinkRow {
  return { id: nextLinkId(), value };
}

function padLinks(links: string[]): LinkRow[] {
  const capped = links.slice(0, MAX_LINKS).map((value) => makeLinkRow(value));
  if (capped.length >= INITIAL_LINK_SLOTS) return capped;
  return [
    ...capped,
    ...Array.from({ length: INITIAL_LINK_SLOTS - capped.length }, () =>
      makeLinkRow(""),
    ),
  ];
}

export type ProfileFormState = {
  name: string;
  username: string;
  description: string;
  avatar_url: string;
  links: LinkRow[];
};

export function profileToFormState(profile: ProfileDetails): ProfileFormState {
  return {
    name: profile.name ?? "",
    username: profile.username ?? "",
    description: profile.description ?? "",
    avatar_url: profile.avatar_url ?? "",
    links: padLinks(profile.links ?? []),
  };
}

export function isFormDirty(
  initial: ProfileFormState,
  current: ProfileFormState,
): boolean {
  if (
    initial.name !== current.name ||
    initial.username !== current.username ||
    initial.description !== current.description ||
    initial.avatar_url !== current.avatar_url
  ) {
    return true;
  }
  const a = initial.links.map((l) => l.value).filter(Boolean);
  const b = current.links.map((l) => l.value).filter(Boolean);
  if (a.length !== b.length) return true;
  return a.some((value, idx) => value !== b[idx]);
}

export function validateForm(
  state: ProfileFormState,
  locale: Locale = "en",
): {
  valid: boolean;
  errors: Partial<Record<"name" | "username" | "description", string>>;
} {
  const errors: Partial<Record<"name" | "username" | "description", string>> =
    {};

  if (!state.name.trim()) {
    errors.name =
      locale === "zh-CN" ? "请输入显示名称" : "Display name is required";
  } else if (state.name.length > 50) {
    errors.name =
      locale === "zh-CN"
        ? "显示名称不能超过 50 个字符"
        : "Display name must be under 50 characters";
  }

  if (!state.username.trim()) {
    errors.username =
      locale === "zh-CN" ? "请输入用户名" : "Handle is required";
  } else if (!HANDLE_REGEX.test(state.username)) {
    errors.username =
      locale === "zh-CN"
        ? "请使用 2–30 个字母、数字、下划线或连字符"
        : "Use 2–30 letters, numbers, underscores or dashes";
  }

  if (state.description.length > MAX_BIO_LENGTH) {
    errors.description =
      locale === "zh-CN"
        ? `简介不能超过 ${MAX_BIO_LENGTH} 个字符`
        : `Bio must be under ${MAX_BIO_LENGTH} characters`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = Array.from(parts[0]!);
  if (parts.length === 1) {
    return first.slice(0, 2).join("").toUpperCase();
  }
  const last = Array.from(parts[parts.length - 1]!);
  return (first[0]! + last[0]!).toUpperCase();
}
