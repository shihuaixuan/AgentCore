import { describe, expect, it } from "vitest";

import { newRecipientChatHref } from "../expertSessionQuery";

describe("newRecipientChatHref", () => {
  it("opens a fresh Otto chat at home", () => {
    expect(newRecipientChatHref(null)).toBe("/home");
  });

  it("addresses an active expert and asks for a fresh thread", () => {
    expect(newRecipientChatHref("expert-maria")).toBe(
      "/home?expertId=expert-maria&new=1",
    );
  });

  it("encodes the expert id", () => {
    expect(newRecipientChatHref("expert/slash")).toBe(
      "/home?expertId=expert%2Fslash&new=1",
    );
  });
});
