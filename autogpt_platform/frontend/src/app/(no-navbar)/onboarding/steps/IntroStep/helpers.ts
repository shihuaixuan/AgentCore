export type IntroSlideId = "team" | "autopilot";

export interface IntroSlide {
  eyebrow?: string;
  title: string;
  body?: string;
  cta: string;
}
