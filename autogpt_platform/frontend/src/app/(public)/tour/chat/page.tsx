import type { Metadata } from "next";
import { TourCopilot } from "./TourCopilot";
import { getTourMetadata } from "../metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getTourMetadata();
}

export default function TourChatPage() {
  return <TourCopilot />;
}
