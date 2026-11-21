import { Key, storage } from "@/services/storage/local-storage";
import type { Tour } from "shepherd.js";
import { closeBlockMenu } from "./menu";
import { closeSaveControl, forceSaveOpen } from "./save";
import { removeAllHighlights, enableAllBlocks } from "./highlights";

const clearTutorialIntervals = () => {
  const intervalKeys = [
    "__tutorialCalcInterval",
    "__tutorialCheckInterval",
    "__tutorialSecondCalcInterval",
  ];

  intervalKeys.forEach((key) => {
    if ((window as any)[key]) {
      clearInterval((window as any)[key]);
      delete (window as any)[key];
    }
  });
};

const skippedTours = new WeakSet<Tour>();

export const handleTutorialCancel = (tour: Tour) => {
  clearTutorialIntervals();
  closeBlockMenu();
  closeSaveControl();
  forceSaveOpen(false);
  removeAllHighlights();
  enableAllBlocks();
  storage.set(
    Key.SHEPHERD_TOUR,
    skippedTours.delete(tour) ? "skipped" : "canceled",
  );
};

export const handleTutorialSkip = (tour: Tour) => {
  skippedTours.add(tour);
  return tour.cancel();
};

export const handleTutorialComplete = () => {
  clearTutorialIntervals();
  closeBlockMenu();
  closeSaveControl();
  forceSaveOpen(false);
  removeAllHighlights();
  enableAllBlocks();
  storage.set(Key.SHEPHERD_TOUR, "completed");
};
