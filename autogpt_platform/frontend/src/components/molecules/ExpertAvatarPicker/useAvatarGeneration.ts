import {
  useGenerateExpertAvatar,
  useGetExpertAvatarGeneration,
} from "@/app/api/__generated__/endpoints/experts/experts";
import type { ExpertAvatarRequest } from "@/app/api/__generated__/models/expertAvatarRequest";
import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ApiError } from "@/lib/autogpt-server-api/helpers";

export function useAvatarGeneration() {
  const { t } = useTranslation();
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
          (response.status === 200 && response.data?.status === "pending")
          ? 2000
          : false;
      },
    },
  });
  const job = query.data?.status === 200 ? query.data.data : undefined;
  const generatedUrl =
    job?.status === "complete" && typeof job.avatar_url === "string"
      ? job.avatar_url.trim() || null
      : null;
  const isGenerating =
    mutation.isPending ||
    Boolean(
      jobID && !query.isError && (query.isPending || job?.status === "pending"),
    );
  const error = generationError();

  function generationError() {
    const failure = mutation.error;
    if (failure instanceof ApiError) {
      if (failure.response?.detail?.code === "avatar_provider_not_configured")
        return t(
          "Avatar generation is not configured. Keep this avatar or upload a picture.",
          "尚未配置头像生成服务。你可以保留当前头像或上传图片。",
        );
      if (failure.status === 429)
        return t(
          "Avatar generation limit reached. Wait before trying again.",
          "已达到头像生成频率或数量限制，请稍后重试。",
        );
      if (failure.status === 402)
        return t(
          "A subscription is required to generate an avatar.",
          "生成头像需要订阅。",
        );
    }
    if (query.isError && jobID)
      return t(
        "Could not check generation. Try again or regenerate.",
        "无法获取生成进度，请重试或重新生成。",
      );
    if (job?.status === "failed") {
      if (
        job.error ===
        "The image provider rejected the request. Contact your administrator."
      )
        return t(job.error, "图像服务拒绝了生成请求，请联系管理员。");
      if (job.error === "The image provider is unavailable. Try again later.")
        return t(job.error, "图像服务暂不可用，请稍后重试。");
      if (job.error === "Avatar generation timed out. Try again later.")
        return t(job.error, "头像生成超时，请稍后重试。");
    }
    if (
      failure ||
      (mutation.isSuccess && !jobID) ||
      (jobID && !isGenerating && !generatedUrl)
    )
      return t(
        "Could not generate avatar. Keep this avatar or try again.",
        "未能生成头像。你可以保留当前头像或重试。",
      );
    return null;
  }

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
            typeof response.data?.id === "string" &&
            response.data.id.trim()
          )
            setJobID(response.data.id.trim());
        },
      },
    );
  }

  function reset() {
    requestVersion.current += 1;
    setJobID("");
    mutation.reset();
  }

  return { generate, reset, isGenerating, error, generatedUrl };
}
