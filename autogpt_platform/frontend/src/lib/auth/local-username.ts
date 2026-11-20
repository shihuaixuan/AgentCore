import { z } from "zod";

const suffix = "@username.invalid";
const encoder = new TextEncoder();
export const usernameHelp =
  "Use letters, numbers, underscores or hyphens (up to 32 UTF-8 bytes).";
export const usernameSchema = z
  .string()
  .trim()
  .max(64, usernameHelp)
  .transform((value) => value.normalize("NFKC").toLowerCase())
  .refine(
    (value) =>
      /^[\p{L}\p{N}_-]+$/u.test(value) && encoder.encode(value).length <= 32,
    usernameHelp,
  );

export function usernameSignupEnabled() {
  return (
    process.env.NEXT_PUBLIC_BEHAVE_AS !== "CLOUD" &&
    process.env.NEXT_PUBLIC_AUTH_USERNAME_SIGNUP === "true"
  );
}

export function usernameIdentity(username: string) {
  return (
    Array.from(encoder.encode(usernameSchema.parse(username)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("") + suffix
  );
}

export function isUsernameIdentity(email: string) {
  return email.trim().toLowerCase().endsWith(suffix);
}

export function identityUsername(email: string) {
  if (!isUsernameIdentity(email)) return null;
  const hex = email.toLowerCase().slice(0, -suffix.length);
  if (!/^(?:[a-f0-9]{2}){1,32}$/.test(hex)) return null;
  const name = new TextDecoder().decode(
    Uint8Array.from(hex.match(/../g)!, (pair) => parseInt(pair, 16)),
  );
  const parsed = usernameSchema.safeParse(name);
  return parsed.success && usernameIdentity(parsed.data) === email.toLowerCase()
    ? parsed.data
    : null;
}
