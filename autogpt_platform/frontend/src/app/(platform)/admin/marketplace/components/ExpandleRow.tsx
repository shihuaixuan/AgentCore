"use client";

import { useState } from "react";
import {
  TableRow,
  TableCell,
  Table,
  TableHeader,
  TableHead,
  TableBody,
} from "@/components/molecules/Table/components/TablePrimitives";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  EyeIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { StoreListingWithVersionsAdminView } from "@/app/api/__generated__/models/storeListingWithVersionsAdminView";
import type { StoreSubmissionAdminView } from "@/app/api/__generated__/models/storeSubmissionAdminView";
import { SubmissionStatus } from "@/app/api/__generated__/models/submissionStatus";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";
import { ApproveRejectButtons } from "./ApproveRejectButton";
import { DownloadAgentAdminButton } from "./DownloadAgentButton";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const STATUS_CHIP =
  "inline-flex cursor-default items-center rounded-md border border-transparent px-2.5 py-0.5 text-caption font-semibold leading-4 text-action-foreground shadow";

function getStatusBadge(
  status: SubmissionStatus,
  t: ReturnType<typeof useTranslation>["t"],
) {
  switch (status) {
    case SubmissionStatus.PENDING:
      return (
        <span className={cn(STATUS_CHIP, "bg-warning")}>
          {t("Pending", "待处理")}
        </span>
      );
    case SubmissionStatus.APPROVED:
      return (
        <span className={cn(STATUS_CHIP, "bg-success")}>
          {t("Approved", "已通过")}
        </span>
      );
    case SubmissionStatus.REJECTED:
      return (
        <span className={cn(STATUS_CHIP, "bg-error")}>
          {t("Rejected", "已拒绝")}
        </span>
      );
    default:
      return (
        <span className={cn(STATUS_CHIP, "bg-foreground-tertiary")}>
          {t("Draft", "草稿")}
        </span>
      );
  }
}

export function ExpandableRow({
  listing,
  latestVersion,
}: {
  listing: StoreListingWithVersionsAdminView;
  latestVersion: StoreSubmissionAdminView | null;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer">
        <TableCell onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <Icon aria-hidden icon={ArrowDown01Icon} className="h-4 w-4" />
          ) : (
            <Icon aria-hidden icon={ArrowRight01Icon} className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          <span className="font-medium">
            {latestVersion?.name || t("Unnamed Agent", "未命名工作流")}
          </span>
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          {listing.creator_email || t("Unknown", "未知")}
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          {latestVersion?.sub_heading || t("No description", "暂无描述")}
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          {latestVersion?.status && getStatusBadge(latestVersion.status, t)}
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          {latestVersion?.submitted_at
            ? formatDistanceToNow(new Date(latestVersion.submitted_at), {
                addSuffix: true,
              })
            : t("Unknown", "未知")}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            {latestVersion?.listing_version_id && (
              <>
                <Link
                  href={`/admin/marketplace/preview/${latestVersion.listing_version_id}`}
                >
                  <Button size="xs" variant="secondary">
                    <Icon aria-hidden icon={EyeIcon} className="h-4 w-4" />
                    {t("Preview", "预览")}
                  </Button>
                </Link>
                <DownloadAgentAdminButton
                  storeListingVersionId={latestVersion.listing_version_id}
                />
              </>
            )}

            {(latestVersion?.status === SubmissionStatus.PENDING ||
              latestVersion?.status === SubmissionStatus.APPROVED) && (
              <ApproveRejectButtons version={latestVersion} />
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded version history */}
      {expanded && (
        <TableRow>
          <td colSpan={7} className="p-0">
            <div className="bg-surface-hover/30 px-4 py-3">
              <Text
                variant="body-semibold-tight"
                as="h4"
                tone="inherit"
                className="mb-2"
              >
                {t("Version History", "版本历史")}
              </Text>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Version", "版本")}</TableHead>
                    <TableHead>{t("Status", "状态")}</TableHead>
                    <TableHead>{t("Changes", "变更")}</TableHead>
                    <TableHead>{t("Submitted", "提交时间")}</TableHead>
                    <TableHead>{t("Reviewed", "审核时间")}</TableHead>
                    <TableHead>{t("External Comments", "外部评论")}</TableHead>
                    <TableHead>{t("Internal Comments", "内部评论")}</TableHead>
                    <TableHead>{t("Name", "名称")}</TableHead>
                    <TableHead>{t("Sub Heading", "副标题")}</TableHead>
                    <TableHead>{t("Description", "描述")}</TableHead>
                    <TableHead>{t("Categories", "分类")}</TableHead>
                    <TableHead className="text-right">
                      {t("Actions", "操作")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listing.versions ?? [])
                    .sort(
                      (a, b) =>
                        (b.listing_version ?? 1) - (a.listing_version ?? 0),
                    )
                    .map((version) => (
                      <TableRow key={version.listing_version_id}>
                        <TableCell>
                          v{version.listing_version || "?"}
                          {version.listing_version_id ===
                            listing.active_listing_version_id && (
                            <span className={cn(STATUS_CHIP, "ml-2 bg-info")}>
                              {t("Active", "生效中")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(version.status, t)}
                        </TableCell>
                        <TableCell>
                          {version.changes_summary ||
                            t("No summary", "暂无摘要")}
                        </TableCell>
                        <TableCell>
                          {version.submitted_at
                            ? formatDistanceToNow(
                                new Date(version.submitted_at),
                                { addSuffix: true },
                              )
                            : t("Unknown", "未知")}
                        </TableCell>
                        <TableCell>
                          {version.reviewed_at
                            ? formatDistanceToNow(
                                new Date(version.reviewed_at),
                                {
                                  addSuffix: true,
                                },
                              )
                            : t("Not reviewed", "未审核")}
                        </TableCell>
                        <TableCell className="max-w-xs overflow-hidden">
                          {version.review_comments ? (
                            <div
                              className="truncate"
                              title={version.review_comments}
                            >
                              {version.review_comments}
                            </div>
                          ) : (
                            <span className="block truncate text-foreground-subtle">
                              {t("No external comments", "暂无外部评论")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs overflow-hidden">
                          {version.internal_comments ? (
                            <div
                              className="truncate text-pink-foreground"
                              title={version.internal_comments}
                            >
                              {version.internal_comments}
                            </div>
                          ) : (
                            <span className="block truncate text-foreground-subtle">
                              {t("No internal comments", "暂无内部评论")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{version.name}</TableCell>
                        <TableCell>{version.sub_heading}</TableCell>
                        <TableCell>{version.description}</TableCell>
                        <TableCell>
                          {version.categories.length > 0
                            ? version.categories.join(", ")
                            : t("None", "无")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {version.listing_version_id && (
                              <>
                                <Link
                                  href={`/admin/marketplace/preview/${version.listing_version_id}`}
                                >
                                  <Button size="xs" variant="secondary">
                                    <Icon
                                      aria-hidden
                                      icon={EyeIcon}
                                      className="h-4 w-4"
                                    />
                                    {t("Preview", "预览")}
                                  </Button>
                                </Link>
                                <DownloadAgentAdminButton
                                  storeListingVersionId={
                                    version.listing_version_id
                                  }
                                />
                              </>
                            )}
                            {(version.status === SubmissionStatus.PENDING ||
                              version.status === SubmissionStatus.APPROVED) && (
                              <ApproveRejectButtons version={version} />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </td>
        </TableRow>
      )}
    </>
  );
}
