import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPERT_AVATAR_URL,
  getExpertVisualCategory,
  getManagedIdentity,
  MANAGED_IDENTITIES,
  resolveExpertAvatarUrl,
} from "./helpers";

const MARIA = "/experts/professional/expert-maria.webp";
const JULES = "/experts/professional/expert-jules.webp";

describe("managed expert identities", () => {
  it("maps stored roster and retired clay defaults to the identity they stood for", () => {
    expect(resolveExpertAvatarUrl("/experts/maria.svg")).toBe(MARIA);
    expect(resolveExpertAvatarUrl("/experts/clay/v5/jules-marketing.png")).toBe(
      JULES,
    );
    expect(resolveExpertAvatarUrl("/experts/clay/v4/jules-content.png")).toBe(
      JULES,
    );
    expect(
      resolveExpertAvatarUrl(
        "/avatars/notion/12-5-13-13-3-9-2-11-0-0.fuchsia.svg",
      ),
    ).toBe(JULES);
  });

  it("preserves uploads, generated images and managed URLs", () => {
    for (const url of [
      "https://cdn.example/upload.png",
      "/api/store/media/user/images/custom.png",
      "/avatars/mine.svg",
      "https://uploads.example/autogpt-characters/v2.1/expert-jules/neutral/40.png?token=mine",
      "/autogpt-characters/v9.9/expert-jules/neutral/128.webp",
      MARIA,
      JULES,
      DEFAULT_EXPERT_AVATAR_URL,
    ]) {
      expect(resolveExpertAvatarUrl(url)).toBe(url);
    }
  });

  it("uses the General fallback for missing avatars, custom Notion picks and the retired category sheets", () => {
    expect(DEFAULT_EXPERT_AVATAR_URL).toBe(
      "/experts/professional/expert-general-01.webp",
    );
    expect(resolveExpertAvatarUrl(null)).toBe(DEFAULT_EXPERT_AVATAR_URL);
    expect(resolveExpertAvatarUrl("/avatars/notion/1-2-3.violet.svg")).toBe(
      DEFAULT_EXPERT_AVATAR_URL,
    );
    expect(resolveExpertAvatarUrl("/experts/clay/v1/finance.png")).toBe(
      DEFAULT_EXPERT_AVATAR_URL,
    );
  });

  it("recognizes canonical portraits and legacy size variants", () => {
    expect(MANAGED_IDENTITIES).toHaveLength(35);
    for (const identity of MANAGED_IDENTITIES) {
      expect(getManagedIdentity(identity.url)?.id).toBe(identity.id);
    }
    expect(
      resolveExpertAvatarUrl(
        "/autogpt-characters/v1.1/expert-maria/neutral/512.png",
      ),
    ).toBe(MARIA);
    expect(resolveExpertAvatarUrl("/experts/transparent/maria.webp")).toBe(
      MARIA,
    );
  });

  it("keeps the visual family with the identity, not the filter", () => {
    expect(getExpertVisualCategory(MARIA, ["content"])).toBe("marketing");
    expect(getExpertVisualCategory("https://cdn.test/x.png", ["Sales"])).toBe(
      "sales",
    );
    expect(
      getExpertVisualCategory(DEFAULT_EXPERT_AVATAR_URL, ["research"]),
    ).toBe("research");
    expect(getExpertVisualCategory(null, ["otto"])).toBe("general");
    expect(getExpertVisualCategory(null, null)).toBe("general");
  });
});
