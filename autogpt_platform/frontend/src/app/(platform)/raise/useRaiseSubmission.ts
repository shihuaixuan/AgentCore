import { useCreateRaisedExpert } from "@/app/api/__generated__/endpoints/experts/experts";
import type { RaiseResult } from "@/app/api/__generated__/models/raiseResult";
import { toast } from "@/components/molecules/Toast/use-toast";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { invalidateExpertRosterQueries } from "@/services/experts/invalidate-experts";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  failedAttachmentMessage,
  toRaiseAttachments,
} from "./components/KitStep/helpers";
import {
  clearDraft,
  getExpertLimitCode,
  type RaiseDraft,
  type RaiseKit,
} from "./helpers";
import { getRaiseProfession } from "./profession";

export function useRaiseSubmission() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync: createRaisedExpert, isPending } =
    useCreateRaisedExpert();
  // The latch survives re-renders so a double click cannot fire two POSTs
  // before `isPending` has flipped; it is released again on failure so the
  // user can retry.
  const submitLatch = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  async function finish(draft: RaiseDraft, kit: RaiseKit) {
    if (submitLatch.current) return;
    submitLatch.current = true;
    setIsLocked(true);
    const { name, title, role, jobTitle } = getRaiseProfession(draft, locale);
    try {
      const response = await createRaisedExpert({
        data: {
          name,
          role,
          job_title: jobTitle,
          color: draft.color,
          avatar_url: draft.avatarUrl || null,
          about: draft.about || null,
          voice_preferences: draft.voicePreferences || null,
          weekly_budget: kit.weeklyBudget,
          attachments: toRaiseAttachments(kit.attachments),
        },
      });
      const result = response.data as RaiseResult;
      if (result.failed_attachments?.length) {
        toast({
          title: t(
            `Created ${title}, but some tools didn't attach`,
            `已创建 ${title}，但部分工具未能添加`,
          ),
          description: failedAttachmentMessage(
            result.failed_attachments,
            kit.attachments,
            locale,
          ),
        });
      }
      clearDraft();
      // The copilot page only fires the kickoff for an expert it finds in the
      // roster, and the sidebar keeps that roster cached, so refresh it before
      // handing over or the new expert is treated as unknown and the kickoff
      // param is dropped.
      await invalidateExpertRosterQueries(queryClient);
      // kickoff=1 has the expert open the thread itself: introduce who it is,
      // say what it can take on, and start or ask for its first job.
      router.push(
        `/copilot?expertId=${encodeURIComponent(result.expert.id)}&kickoff=1`,
      );
    } catch (error) {
      submitLatch.current = false;
      setIsLocked(false);
      reportFailure(error, title, locale, t);
    }
  }

  return { finish, isSubmitting: isPending || isLocked };
}

function reportFailure(
  error: unknown,
  title: string,
  locale: "zh-CN" | "en",
  translate: (english: string, chinese: string) => string,
) {
  if (error instanceof ApiError && error.status === 409) {
    if (getExpertLimitCode(error.response) === "raised_expert_lifetime_limit") {
      toast({
        title: translate("Expert creation limit reached", "已达到专家创建上限"),
        description: translate(
          "This account has reached its lifetime limit for created Experts. Contact support if you need more capacity.",
          "此账户已达到累计创建专家的上限。如需增加额度，请联系支持。",
        ),
        variant: "destructive",
      });
      return;
    }
    toast({
      title: translate("Your team is full", "你的团队已满"),
      description: translate(
        "You've reached the limit of active experts. Archive one from your team page to create another.",
        "已达到活跃专家数量上限。请在团队页面归档一位专家后再创建。",
      ),
      variant: "destructive",
    });
    return;
  }
  toast({
    title: translate(`Couldn't create ${title}`, `无法创建 ${title}`),
    description:
      error instanceof ApiError && [400, 422, 503].includes(error.status)
        ? localizedRaiseError(error.message, error.status, locale, translate)
        : translate(
            "Something went wrong. Please try again.",
            "出现错误，请重试。",
          ),
    variant: "destructive",
  });
}

function localizedRaiseError(
  message: string,
  status: number,
  locale: "zh-CN" | "en",
  translate: (english: string, chinese: string) => string,
) {
  if (locale === "en") return message;
  if (status === 503) {
    return translate(message, "服务暂时不可用，请稍后重试。");
  }
  return translate(message, "提交信息无效，请检查填写内容后重试。");
}
