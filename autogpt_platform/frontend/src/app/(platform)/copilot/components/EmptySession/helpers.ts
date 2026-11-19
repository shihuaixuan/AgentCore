import type { User } from "@/lib/auth/types";

export function getExpertInputPlaceholder(expertName: string) {
  return `What should ${expertName} work on?`;
}

export function getInputPlaceholder(width?: number) {
  if (!width) return "What's your role and what eats up most of your day?";

  if (width < 500) {
    return "I'm a chef and I hate...";
  }
  if (width <= 1080) {
    return "What's your role and what eats up most of your day?";
  }
  return "What's your role and what eats up most of your day? e.g. 'I'm a recruiter and I hate...'";
}

export function getGreetingName(user?: User | null): string | null {
  if (!user) return null;
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  // preferred_name is the name the user set with the hero's edit-name button —
  // it wins over provider-supplied names, and is used verbatim.
  const preferredName = metadata?.preferred_name;
  if (typeof preferredName === "string" && preferredName.trim()) {
    return preferredName.trim();
  }
  // Email sign-up stores the address's local part as the name; that one was never given.
  const emailName = user.email?.split("@")[0].toLowerCase();
  const givenName = [metadata?.full_name, metadata?.name]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((value) => value && value.toLowerCase() !== emailName);
  return givenName ? givenName.split(/\s+/)[0] : null;
}
