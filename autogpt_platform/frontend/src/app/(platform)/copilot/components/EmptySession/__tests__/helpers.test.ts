import type { User } from "@/lib/auth/types";
import { usernameIdentity } from "@/lib/auth/local-username";
import { describe, expect, it } from "vitest";
import { getGreetingName } from "../helpers";

function makeUser(metadata: Record<string, unknown>, email?: string): User {
  return { user_metadata: metadata, email } as unknown as User;
}

describe("getGreetingName", () => {
  it("prefers the name chosen during onboarding (preferred_name)", () => {
    const user = makeUser(
      { preferred_name: "Reinier", full_name: "R. van der Leer" },
      "reinier@example.com",
    );
    expect(getGreetingName(user)).toBe("Reinier");
  });

  it("ignores a blank preferred_name", () => {
    const user = makeUser({ preferred_name: "  ", full_name: "Jane Doe" });
    expect(getGreetingName(user)).toBe("Jane Doe");
  });

  it("preserves the complete name when no preferred_name is set", () => {
    const user = makeUser({ full_name: "Jane Doe" });
    expect(getGreetingName(user)).toBe("Jane Doe");
  });

  it("falls back to the name metadata field", () => {
    const user = makeUser({ name: "John Smith" });
    expect(getGreetingName(user)).toBe("John Smith");
  });

  it("keeps a given name that the email address starts with", () => {
    const user = makeUser({ name: "Jane Doe" }, "jane@example.com");
    expect(getGreetingName(user)).toBe("Jane Doe");
  });

  it("uses the login username instead of a generic account name", () => {
    const email = usernameIdentity("小林");
    expect(getGreetingName(makeUser({ name: "AutoGPT" }, email))).toBe("小林");
    expect(getGreetingName(makeUser({ preferred_name: "林老师" }, email))).toBe(
      "林老师",
    );
  });

  // Email sign-up stores the address's local part as the name.
  it.each([
    ["the name an email sign-up stores", { name: "Jane.Doe" }],
    ["no name at all", {}],
  ])("has no name for %s", (_, metadata) => {
    expect(getGreetingName(makeUser(metadata, "jane.doe@example.com"))).toBe(
      null,
    );
  });

  it("has no name without a user", () => {
    expect(getGreetingName(null)).toBe(null);
    expect(getGreetingName(undefined)).toBe(null);
  });
});
