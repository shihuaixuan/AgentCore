import { ExpertAvatarRequestExpression } from "@/app/api/__generated__/models/expertAvatarRequestExpression";
import { existsSync } from "node:fs";
import { MANAGED_IDENTITIES } from "../ExpertAvatar/helpers";
import { expect, test } from "vitest";
import { randomAvatarRequest } from "./helpers";

test("every selectable identity has a bundled professional portrait", () => {
  for (const { url } of MANAGED_IDENTITIES) {
    expect(existsSync(`public${url}`)).toBe(true);
  }
});

test("the portrait request keeps the category and uses an accepted expression", () => {
  const request = randomAvatarRequest("sales");
  expect(request.category).toBe("sales");
  expect(Object.values(ExpertAvatarRequestExpression)).toContain(
    request.expression,
  );
});
