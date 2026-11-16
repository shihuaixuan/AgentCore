import { englishTutorialText, type TutorialTranslate } from "../translation";
import { StepOptions } from "shepherd.js";
import { createWelcomeSteps } from "./welcome";
import { createBlockMenuSteps } from "./block-menu";
import { createBlockBasicsSteps } from "./block-basics";
import { createConfigureCalculatorSteps } from "./configure-calculator";
import { createSecondCalculatorSteps } from "./second-calculator";
import { createConnectionSteps } from "./connections";
import { createSaveSteps } from "./save";
import { createRunSteps } from "./run";
import { createCompletionSteps } from "./completion";

export const createTutorialSteps = (
  tour: any,
  t: TutorialTranslate = englishTutorialText,
): StepOptions[] => [
  ...createWelcomeSteps(tour, t),
  ...createBlockMenuSteps(tour, t),
  ...createBlockBasicsSteps(tour, t),
  ...createConfigureCalculatorSteps(tour, t),
  ...createSecondCalculatorSteps(tour, t),
  ...createConnectionSteps(tour, t),
  ...createSaveSteps(t),
  ...createRunSteps(tour, t),
  ...createCompletionSteps(tour, t),
];
