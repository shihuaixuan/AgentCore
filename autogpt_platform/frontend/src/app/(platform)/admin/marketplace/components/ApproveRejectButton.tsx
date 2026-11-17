"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/molecules/Dialog/components/DialogPrimitives";
import { Label } from "@/components/atoms/Label/Label";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import type { StoreSubmissionAdminView } from "@/app/api/__generated__/models/storeSubmissionAdminView";
import { useRouter } from "next/navigation";
import {
  approveAgent,
  rejectAgent,
} from "@/app/(platform)/admin/marketplace/actions";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function ApproveRejectButtons({
  version,
}: {
  version: StoreSubmissionAdminView;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const isApproved = version.status === "APPROVED";

  const handleApproveSubmit = async (formData: FormData) => {
    setIsApproveDialogOpen(false);
    try {
      await approveAgent(formData);
      router.refresh(); // Refresh the current route
    } catch (error) {
      console.error("Error approving agent:", error);
    }
  };

  const handleRejectSubmit = async (formData: FormData) => {
    setIsRejectDialogOpen(false);
    try {
      await rejectAgent(formData);
      router.refresh(); // Refresh the current route
    } catch (error) {
      console.error("Error rejecting agent:", error);
    }
  };

  return (
    <>
      {!isApproved && (
        <Button
          size="xs"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            setIsApproveDialogOpen(true);
          }}
        >
          <span className="flex items-center gap-1.5 text-success">
            <Icon
              aria-hidden
              icon={CheckmarkCircle02Icon}
              className="h-4 w-4"
            />
            {t("Approve", "通过")}
          </span>
        </Button>
      )}
      <Button
        size="xs"
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation();
          setIsRejectDialogOpen(true);
        }}
      >
        <span className="flex items-center gap-1.5 text-error-hover">
          <Icon aria-hidden icon={CancelCircleIcon} className="h-4 w-4" />
          {isApproved ? t("Revoke", "撤销通过") : t("Reject", "拒绝")}
        </span>
      </Button>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Approve Agent", "通过工作流")}</DialogTitle>
            <DialogDescription>
              {t("Are you sure you want to approve this agent? This will make it available in the marketplace.", "确定要通过此工作流吗？通过后它将出现在市场中。")}
            </DialogDescription>
          </DialogHeader>

          <form action={handleApproveSubmit}>
            <input
              type="hidden"
              name="id"
              value={version.listing_version_id || ""}
            />

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="comments">{t("Comments (Optional)", "评论（可选）")}</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder={t("Add any comments for the agent creator", "添加给工作流创建者的评论")}
                  defaultValue="Meets all requirements"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="compact-outline"
                size="compact"
                onClick={() => setIsApproveDialogOpen(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button variant="compact-primary" size="compact" type="submit">
                {t("Approve", "通过")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isApproved ? t("Revoke Approved Agent", "撤销已通过的工作流") : t("Reject Agent", "拒绝工作流")}
            </DialogTitle>
            <DialogDescription>
              {isApproved
                ? t("Are you sure you want to revoke approval for this agent? This will remove it from the marketplace.", "确定要撤销此工作流的通过状态吗？它将从市场中移除。")
                : t("Please provide feedback on why this agent is being rejected.", "请说明拒绝此工作流的原因。")}
            </DialogDescription>
          </DialogHeader>

          <form action={handleRejectSubmit}>
            <input
              type="hidden"
              name="id"
              value={version.listing_version_id || ""}
            />

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="comments">{t("Comments for Creator", "给创建者的评论")}</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder={t("Provide feedback for the agent creator", "向工作流创建者提供反馈")}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="internal_comments">{t("Internal Comments", "内部评论")}</Label>
                <Textarea
                  id="internal_comments"
                  name="internal_comments"
                  placeholder={t("Add any internal notes (not visible to creator)", "添加内部备注（创建者不可见）")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="compact-outline"
                size="compact"
                onClick={() => setIsRejectDialogOpen(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                type="submit"
                variant="compact-destructive"
                size="compact"
              >
                {isApproved ? t("Revoke", "撤销通过") : t("Reject", "拒绝")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
