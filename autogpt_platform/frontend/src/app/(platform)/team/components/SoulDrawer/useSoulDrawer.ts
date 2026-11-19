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
  expert: Expert | null;
  onClose: () => void;
}

const EMPTY_SOUL: ExpertSoulUpdate = {
  name: "",
  identity: "",
  voice_preferences: "",
  boundaries: "",
};

export function useSoulDrawer({ expert, onClose }: Args) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [soul, setSoul] = useState<ExpertSoulUpdate>(() =>
    expert ? soulFromExpert(expert) : EMPTY_SOUL,
  );
  const { mutateAsync: updateSoul, isPending } = useUpdateExpertSoul();

  function updateField(field: keyof ExpertSoulUpdate, value: string) {
    setSoul((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expert) return;

    try {
      await updateSoul({ expertId: expert.id, data: soul });
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
    canSave: Boolean(soul.name.trim() && soul.identity.trim()),
  };
}

function soulFromExpert(expert: Expert): ExpertSoulUpdate {
  return {
    name: expert.name,
    identity: expert.identity,
    voice_preferences: expert.voice_preferences,
    boundaries: expert.boundaries,
  };
}
