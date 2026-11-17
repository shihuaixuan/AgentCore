"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
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
import { BaseInput } from "@/components/atoms/Input/BaseInput";
import { useRouter } from "next/navigation";
import { addDollars } from "@/app/(platform)/admin/spending/actions";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function AdminAddMoneyButton({
  userId,
  userEmail,
  currentBalance,
  defaultAmount,
  defaultComments,
}: {
  userId: string;
  userEmail: string;
  currentBalance: number;
  defaultAmount?: number;
  defaultComments?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddMoneyDialogOpen, setIsAddMoneyDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dollarAmount, setDollarAmount] = useState(
    defaultAmount ? Math.abs(defaultAmount / 100).toFixed(2) : "1.00",
  );

  const handleApproveSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await addDollars(formData);
      setIsAddMoneyDialogOpen(false);
      toast({
        title: t("Success", "成功"),
        description: `${t("Added", "已添加")} $${dollarAmount} ${t("to", "到")} ${userEmail} ${t("balance", "的余额")}`,
      });
      router.refresh(); // Refresh the current route
    } catch (error) {
      console.error("Error adding dollars:", error);
      toast({
        title: t("Error", "错误"),
        description: t("Failed to add dollars. Please try again.", "添加金额失败，请重试。"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="xs"
        variant="primary"
        onClick={(e) => {
          e.stopPropagation();
          setIsAddMoneyDialogOpen(true);
        }}
      >
        {t("Add Dollars", "添加金额")}
      </Button>

      {/* Add $$$ Dialog */}
      <Dialog
        open={isAddMoneyDialogOpen}
        onOpenChange={setIsAddMoneyDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Add Dollars", "添加金额")}</DialogTitle>
            <DialogDescription className="mt-2">
              <div className="mb-2">
                <span className="font-medium">{t("User", "用户")}：</span> {userEmail}
              </div>
              <div>
                <span className="font-medium">{t("Current balance", "当前余额")}：</span> $
                {(currentBalance / 100).toFixed(2)}
              </div>
            </DialogDescription>
          </DialogHeader>

          <form action={handleApproveSubmit}>
            <input type="hidden" name="id" value={userId} />
            <input
              type="hidden"
              name="amount"
              value={Math.round(parseFloat(dollarAmount) * 100)}
            />

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="dollarAmount">{t("Amount (in dollars)", "金额（美元）")}</Label>
                <div className="flex">
                  <div className="flex items-center justify-center rounded-l-md border border-r-0 bg-surface-muted px-3 text-foreground-tertiary">
                    $
                  </div>
                  <BaseInput
                    id="dollarAmount"
                    type="number"
                    step="0.01"
                    // oxlint-disable-next-line design-system/no-restyle -- BaseInput has no attached-addon variant (src/components is P9's)
                    className="rounded-l-none"
                    value={dollarAmount}
                    onChange={(e) => setDollarAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="comments">{t("Comments (Optional)", "备注（可选）")}</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder={t("Why are you adding dollars?", "为什么要添加金额？")}
                  defaultValue={defaultComments || "We love you!"}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="compact-outline"
                size="compact"
                onClick={() => setIsAddMoneyDialogOpen(false)}
                disabled={isSubmitting}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                variant="compact-primary"
                size="compact"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("Adding...", "正在添加...") : t("Add Dollars", "添加金额")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
