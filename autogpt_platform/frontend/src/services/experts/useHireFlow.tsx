import {
  getGetExpertQueryKey,
  useHireExpert,
  useUpdateExpertSoul,
} from "@/app/api/__generated__/endpoints/experts/experts";
import { Expert } from "@/app/api/__generated__/models/expert";
import { HireResult } from "@/app/api/__generated__/models/hireResult";
import { Button } from "@/components/atoms/Button/Button";
import { toast } from "@/components/molecules/Toast/use-toast";
import {
  buildVoicePreferences,
  type VoicePickResult,
} from "@/components/organisms/VoicePicker/helpers";
import { trackExperts } from "@/services/experts/experts-analytics";
import { invalidateExpertRosterQueries } from "@/services/experts/invalidate-experts";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "./expert-role-label";

function celebrate(
  result: HireResult,
  { t, locale }: Pick<ReturnType<typeof useTranslation>, "t" | "locale">,
) {
  const title = getExpertDisplayTitle(result.expert, locale);
  toast({
    title: t(`${title} joined your team`, `${title} 已加入你的团队`),
    description:
      result.expert.setup_status === "installing"
        ? t(
            "Their skills and workflows are installing.",
            "正在安装这位专家的技能和工作流。",
          )
        : undefined,
    variant: "success",
    action: (
      <Button
        as="NextLink"
        href="/team"
        variant="outline"
        size="small"
        className="border-surface text-action-foreground hover:border-surface hover:bg-surface/15 hover:text-action-foreground"
      >
        {t("View team", "查看团队")}
      </Button>
    ),
  });
}

/** Hiring from the expert page: hire the template, offer a voice pick when
 *  the persona ships writing samples, then celebrate and hand the user to
 *  the expert's first thread. */
export function useHireFlow(expert: Expert | null) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [hireResult, setHireResult] = useState<HireResult | null>(null);
  const [isVoicePickOpen, setIsVoicePickOpen] = useState(false);
  const pendingCelebrationRef = useRef<HireResult | null>(null);

  const { mutateAsync: hireExpert, isPending: isHiring } = useHireExpert();
  const { mutateAsync: updateSoul, isPending: isSavingVoice } =
    useUpdateExpertSoul();

  function finish() {
    const completedHire = pendingCelebrationRef.current;
    pendingCelebrationRef.current = null;
    setHireResult(null);
    setIsVoicePickOpen(false);
    if (completedHire) {
      celebrate(completedHire, { t, locale });
      // Hiring isn't installing: hand the user straight to the expert's
      // thread with kickoff=1 so it introduces itself and starts its job.
      router.push(`/copilot?expertId=${completedHire.expert.id}&kickoff=1`);
    }
  }

  async function hire() {
    if (!expert || !expert.is_template) return;
    try {
      const response = await hireExpert({
        data: { template_id: expert.id, surface: "expert_page" },
      });
      const result = response.data as HireResult;
      await invalidateExpertRosterQueries(queryClient);
      pendingCelebrationRef.current = result;
      setHireResult(result);
      if ((expert.voice_samples ?? []).length > 0) {
        setIsVoicePickOpen(true);
        return;
      }
      finish();
    } catch {
      toast({
        title: t(
          `Couldn't hire ${getExpertDisplayTitle(expert, locale)}`,
          `无法聘用 ${getExpertDisplayTitle(expert, locale)}`,
        ),
        description: t(
          "Something went wrong. Please try again.",
          "出现了问题，请重试。",
        ),
        variant: "destructive",
      });
    }
  }

  async function pickVoice(result: VoicePickResult) {
    if (!hireResult || !expert) return;
    const hired = hireResult.expert;
    const voicePreferences = buildVoicePreferences(
      result,
      expert.voice_samples ?? [],
    );
    // Nothing storable (missing sample, blank custom text): keep the hired
    // expert's existing voice instead of blanking it with an empty PATCH.
    if (voicePreferences === null) {
      finish();
      return;
    }
    try {
      await updateSoul({
        expertId: hired.id,
        data: {
          name: hired.name,
          identity: hired.identity,
          voice_preferences: voicePreferences,
          boundaries: hired.boundaries,
        },
      });
      // The hire-time refetch cached the pre-voice expert as fresh; without
      // this, a Soul edit within the stale window would silently write that
      // old description back over the chosen voice.
      await Promise.all([
        invalidateExpertRosterQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: getGetExpertQueryKey(hired.id),
        }),
      ]);
    } catch {
      // The hire itself succeeded; keep the picker open so the choice can be
      // retried, and point at the Soul editor as the fallback.
      toast({
        title: t("Couldn't save the voice", "无法保存表达风格"),
        description: t(
          "You can set it later in the Soul editor.",
          "你可以稍后在个性编辑器中设置。",
        ),
        variant: "destructive",
      });
      return;
    }
    finish();
  }

  function dismiss() {
    if (isVoicePickOpen) {
      trackExperts("hire_flow_abandoned", {
        template_id: expert?.id ?? null,
        stage: "voice",
      });
    }
    finish();
  }

  return {
    hire,
    isHiring,
    isVoicePickOpen,
    hireResult,
    pickVoice,
    skipVoice: finish,
    dismissVoicePick: dismiss,
    isSavingVoice,
  };
}
