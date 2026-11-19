import { useGetV2AdminReadSkillSubmissionFile } from "@/app/api/__generated__/endpoints/admin/admin";
import { useGetV2ReadMarketplaceSkillFile } from "@/app/api/__generated__/endpoints/store/store";
import { okData } from "@/app/api/helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export type SkillPackageSource =
  | { kind: "listing"; slug: string }
  | { kind: "submission"; versionId: string };

interface Args {
  source: SkillPackageSource;
  path: string | null;
}

export function useSkillFileViewer({ source, path }: Args) {
  const { t } = useTranslation();
  const isListing = source.kind === "listing";
  // Both are declared and one is enabled: a listing reads the approved
  // version, a submission goes through the admin route that can see a
  // version nobody has approved.
  const listing = useGetV2ReadMarketplaceSkillFile(
    isListing ? source.slug : "",
    path ?? "",
    undefined,
    { query: { enabled: isListing && path !== null, retry: false } },
  );
  const submission = useGetV2AdminReadSkillSubmissionFile(
    isListing ? "" : source.versionId,
    path ?? "",
    { query: { enabled: !isListing && path !== null, retry: false } },
  );

  const query = isListing ? listing : submission;
  return {
    content: okData(query.data) ?? null,
    isLoading: query.isPending && path !== null,
    // A refusal is a state to render, not a failure to hide: only the
    // endpoint knows whether a file is one this viewer can serve.
    unavailable: query.isError
      ? describeRefusal((query.error as { status?: number } | null)?.status, t)
      : null,
  };
}

function describeRefusal(
  status: number | undefined,
  t: (english: string, chinese: string) => string,
): string {
  if (status === 413)
    return t(
      "This file is too large to preview here.",
      "文件过大，无法在此预览。",
    );
  if (status === 415)
    return t(
      "This file isn't text, so it can't be previewed.",
      "此文件不是文本文件，无法预览。",
    );
  return t("Couldn't load this file.", "无法加载此文件。");
}
