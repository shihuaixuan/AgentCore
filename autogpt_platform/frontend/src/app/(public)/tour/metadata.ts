import type { Metadata } from "next";
import { getServerTranslation } from "@/lib/i18n/server";

const OG_IMAGE = "https://platform.agpt.co/images/tour-og.png";

export async function getTourMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  const title = t(
    "Watch AutoGPT build a working agent in 60 seconds",
    "观看 AutoGPT 在 60 秒内构建可用的工作流",
  );
  const description = t(
    "See AutoGPT build and run a real AI agent from start to finish in about 60 seconds. No signup required. Watch how AI agents automate real work before you try it yourself.",
    "观看 AutoGPT 在约 60 秒内从零构建并运行可用的 AI 工作流，无需注册。先了解 AI 如何自动处理实际工作，再亲自体验。",
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "AutoGPT",
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: t(
            "AutoGPT tour — an agent built, run and delivering its first result",
            "AutoGPT 演示 — 创建工作流、运行并交付首个结果",
          ),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
