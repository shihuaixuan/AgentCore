import {
  useGenerateExpertAvatar,
  useGetExpertAvatarGeneration,
} from "@/app/api/__generated__/endpoints/experts/experts";
import type { ExpertAvatarRequest } from "@/app/api/__generated__/models/expertAvatarRequest";
import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

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
  const error =
    mutation.error?.message ??
    (query.isError
      ? t(
          "Could not check generation. Try again or regenerate.",
          "无法获取生成进度，请重试或重新生成。",
        )
      : job?.error);

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
