"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { useTutorialStore } from "@/app/(platform)/build/stores/tutorialStore";
import { TabIntroCard } from "@/app/(platform)/components/TabIntroCard/TabIntroCard";
import { useTabIntroCard } from "@/app/(platform)/components/TabIntroCard/useTabIntroCard";
import { FlowIcon } from "@hugeicons/core-free-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { startTutorial } from "../FlowEditor/tutorial";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// First visit to the Build tab. Otto is the primary route on purpose —
// most users should not start on an empty canvas — with the existing builder
// tutorial kept as the quiet alternative for people who want the canvas.
export function BuildTabIntro() {
  const { t } = useTranslation();
  // Deep link into an existing graph: the intro is about starting something,
  // and its tutorial clears the canvas — neither belongs over someone's saved
  // agent. Vetoing the visit leaves the step unrecorded, so a later blank
  // /build still gets the introduction.
  const isEditingSavedGraph = Boolean(useSearchParams().get("flowID"));
  const isTutorialRunning = useTutorialStore(
    (state) => state.isTutorialRunning,
  );
  const { isOpen, dismiss, takeAction } = useTabIntroCard(
    "build",
    !isEditingSavedGraph && !isTutorialRunning,
  );
  const setIsTutorialRunning = useTutorialStore(
    (state) => state.setIsTutorialRunning,
  );
  const router = useRouter();

  function askAutoPilot() {
    takeAction("ask_autopilot");
    router.push("/copilot?new=1");
  }

  function learnToBuild() {
    takeAction("builder_tutorial");
    startTutorial(t);
    setIsTutorialRunning(true);
  }

  return (
    <TabIntroCard
      isOpen={isOpen}
      icon={FlowIcon}
      title={t("Create your own workflows.", "创建你自己的工作流。")}
      body={t(
        `Wire blocks into a workflow that runs exactly how you want — or let ${AUTOPILOT_NAME} build it.`,
        `连接模块，构建按你所想运行的工作流，也可以让 ${AUTOPILOT_NAME} 帮你构建。`,
      )}
      cta={{
        label: t(
          `Ask ${AUTOPILOT_NAME} to build it`,
          `让 ${AUTOPILOT_NAME} 帮我构建`,
        ),
        onClick: askAutoPilot,
      }}
      altAction={{
        label: t("Learn to build it yourself", "学习自行构建"),
        onClick: learnToBuild,
      }}
      onDismiss={dismiss}
    />
  );
}
