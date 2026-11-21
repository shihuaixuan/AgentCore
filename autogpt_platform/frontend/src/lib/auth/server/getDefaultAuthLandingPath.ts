import { getOnboardingStatus } from "@/app/api/helpers";
import { environment } from "@/services/environment";

export async function getDefaultAuthLandingPath(
  cloudHome: "/home" | "/copilot" = "/home",
) {
  if (environment.isLocal()) return "/home";

  const { shouldShowOnboarding } = await getOnboardingStatus();
  return shouldShowOnboarding ? "/onboarding" : cloudHome;
}
