import {
  getGetExpertQueryKey,
  useUpdateExpertSoul,
} from "@/app/api/__generated__/endpoints/experts/experts";
import { Expert } from "@/app/api/__generated__/models/expert";
import { ExpertSoulUpdate } from "@/app/api/__generated__/models/expertSoulUpdate";
import { toast } from "@/components/molecules/Toast/use-toast";
import { invalidateExpertRosterQueries } from "@/services/experts/invalidate-experts";
import { useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Args {
  expert: Expert;
  onClose: () => void;
}

export type EditableSoul = Omit<ExpertSoulUpdate, "name">;

export function useSoulDrawer({ expert, onClose }: Args) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [soul, setSoul] = useState<EditableSoul>(() => ({
    identity: expert.identity,
    voice_preferences: expert.voice_preferences,
    boundaries: expert.boundaries,
  }));
  const { mutateAsync: updateSoul, isPending } = useUpdateExpertSoul();

  function updateField(field: keyof EditableSoul, value: string) {
    setSoul((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await updateSoul({
        expertId: expert.id,
        data: { ...soul, name: expert.name },
      });
      await Promise.all([
        invalidateExpertRosterQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: getGetExpertQueryKey(expert.id),
        }),
      ]);
      toast({ title: t("Soul saved", "灵魂设定已保存"), variant: "success" });
      onClose();
    } catch {
      toast({
        title: t("Couldn't save Soul", "无法保存灵魂设定"),
        description: t(
          "Your edits are still here. Please try again.",
          "你的修改仍保留在此，请重试。",
        ),
        variant: "destructive",
      });
    }
  }

  return {
    soul,
    updateField,
    save,
    isPending,
    canSave: Boolean(expert.name.trim() && soul.identity.trim()),
  };
}
