import { useListCopilotSkills } from "@/app/api/__generated__/endpoints/skills/skills";
import { okData } from "@/app/api/helpers";

export function useAutopilotSkills() {
  return useListCopilotSkills(undefined, {
    query: {
      select: (res) =>
        [...(okData(res) ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    },
  });
}
