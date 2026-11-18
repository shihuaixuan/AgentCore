import { useLayoutEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getInputPlaceholder } from "./helpers";

interface Args {
  /** The onboarding greeting on screen: "A" answers the user's brain dump. */
  greetingPath?: string | null;
}

export function useHomeComposer({ greetingPath = null }: Args) {
  const { t } = useTranslation();
  const [discoveryPlaceholder, setDiscoveryPlaceholder] = useState(
    getInputPlaceholder(),
  );

  useLayoutEffect(() => {
    if (greetingPath !== "B") return;
    function handleResize() {
      setDiscoveryPlaceholder(getInputPlaceholder(window.innerWidth));
    }
    handleResize();
    const queries = [
      window.matchMedia("(max-width: 500px)"),
      window.matchMedia("(max-width: 1080px)"),
    ];
    queries.forEach((query) => query.addEventListener("change", handleResize));
    return () => {
      queries.forEach((query) =>
        query.removeEventListener("change", handleResize),
      );
    };
  }, [greetingPath]);

  if (greetingPath === "A") {
    return {
      inputPlaceholder: t("What should we tackle first?", "你想先处理什么？"),
    };
  }
  return {
    inputPlaceholder:
      greetingPath === "B"
        ? t(discoveryPlaceholder, "你的工作是什么？哪些事情最耗时间？")
        : t("What would you like to do today?", "今天想做什么？"),
  };
}
