import { describe, expect, test } from "vitest";
import * as landingPage from "../../page";
import * as chatPage from "../page";

describe("Chinese tour metadata", () => {
  test.each([
    { name: "landing", page: landingPage },
    { name: "chat", page: chatPage },
  ])(
    "localizes $name social previews without changing the image URL or brand",
    async ({ page }) => {
      const metadata = await page.generateMetadata();

      expect(metadata?.title).toBe("观看 AutoGPT 在 60 秒内构建可用的工作流");
      expect(metadata?.description).toMatch(/无需注册/);
      expect(metadata?.openGraph).toMatchObject({
        title: "观看 AutoGPT 在 60 秒内构建可用的工作流",
        siteName: "AutoGPT",
        images: [
          {
            url: "https://platform.agpt.co/images/tour-og.png",
            alt: "AutoGPT 演示 — 创建工作流、运行并交付首个结果",
          },
        ],
      });
      expect(metadata?.twitter).toMatchObject({
        title: "观看 AutoGPT 在 60 秒内构建可用的工作流",
        card: "summary_large_image",
      });
    },
  );
});
