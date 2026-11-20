"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { AssistantPortrait } from "../../../components/AssistantPortrait";

const POINTS = [
  ["I help plan and coordinate your work.", "我帮你规划和协调工作。"],
  ["When an expert gets stuck, I step in.", "专家遇到困难时，我会出手相助。"],
  ["I delegate tasks across the team.", "我把任务分配给团队成员。"],
  ["I suggest Experts you can hire.", "我会推荐适合你聘用的专家。"],
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

function reveal(i: number) {
  return { delay: 0.25 + i * 0.15, duration: 0.5, ease: EASE };
}

export function AutopilotScene() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-start gap-4">
      <AssistantPortrait size={120} />

      <div className="flex flex-col items-center gap-3">
        <ul className="flex flex-col items-start gap-2">
          {POINTS.map(([english, chinese], index) => (
            <motion.li
              key={english}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reveal(index)}
              className="flex items-center gap-1.5 text-brand"
            >
              <Icon icon={ArrowRight01Icon} size={18} className="shrink-0" />
              <span className="font-sans text-body-lg font-normal text-foreground-base md:text-lead">
                {t(english, chinese)}
              </span>
            </motion.li>
          ))}
        </ul>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reveal(POINTS.length)}
        >
          <p className="font-sans text-body-lg font-normal text-foreground-tertiary md:text-lead">
            {t("and more…", "以及更多…")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
