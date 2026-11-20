import {
  useGenerateExpertAvatar,
  useGetExpertAvatarGeneration,
} from "@/app/api/__generated__/endpoints/experts/experts";
import type { ExpertAvatarRequest } from "@/app/api/__generated__/models/expertAvatarRequest";
import type { Locale } from "@/lib/i18n/locale";
import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useAvatarGeneration() {
  const { locale, t } = useTranslation();
  const [jobID, setJobID] = useState("");
  const requestVersion = useRef(0);
  const mutation = useGenerateExpertAvatar<Error>({
    mutation: { retry: false },
  });
  const query = useGetExpertAvatarGeneration(jobID, {
    query: {
      enabled: Boolean(jobID),
      retry: false,
      refetchInterval: (query) => {
        if (query.state.error) return false;
        const response = query.state.data;
        return !response ||
          (response.status === 200 && response.data.status === "pending")
          ? 2000
          : false;
      },
    },
  });
  const job = query.data?.status === 200 ? query.data.data : undefined;
  const isGenerating =
    mutation.isPending ||
    Boolean(jobID && !query.isError && (!job || job.status === "pending"));
  const rawError =
    mutation.error?.message ??
    (query.isError
      ? "Could not check generation. Try again or regenerate."
      : (job?.error ?? undefined));
  const error = localizeAvatarError(rawError, locale, t);

  function generate(request: ExpertAvatarRequest) {
    const version = ++requestVersion.current;
    setJobID("");
    mutation.mutate(
      { data: request },
      {
        onSuccess: (response) => {
          if (
            version === requestVersion.current &&
            response.status === 202 &&
            response.data.id
          )
            setJobID(response.data.id);
        },
      },
    );
  }

  function reset() {
    requestVersion.current += 1;
    setJobID("");
    mutation.reset();
  }

  return { generate, reset, isGenerating, error, job };
}

function localizeAvatarError(
  error: string | undefined,
  locale: Locale,
  translate: (english: string, chinese: string) => string,
) {
  if (!error || locale === "en") return error;
  if (error === "Please wait before generating again.") {
    return translate(error, "请稍后再重新生成。");
  }
  if (error === "Avatar generation is temporarily unavailable") {
    return translate(error, "头像生成服务暂时不可用。");
  }
  if (error === "Avatar generation not found") {
    return translate(error, "找不到头像生成任务。");
  }
  if (error === "Generation timed out. Choose a catalog avatar or try again.") {
    return translate(error, "头像生成超时，请选择预设头像或重试。");
  }
  if (
    error ===
    "Could not generate this avatar. Choose a catalog avatar or try again."
  ) {
    return translate(error, "头像生成失败，请选择预设头像或重试。");
  }
  if (error === "Could not check generation. Try again or regenerate.") {
    return translate(error, "无法获取生成进度，请重试或重新生成。");
  }
  return translate(
    "Could not generate avatar. Try again or regenerate.",
    "头像生成失败，请重试或重新生成。",
  );
}
