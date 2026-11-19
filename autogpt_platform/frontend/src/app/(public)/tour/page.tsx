import type { Metadata } from "next";
import { TourHero } from "./components/TourHero/TourHero";
import { getTourMetadata } from "./metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getTourMetadata();
}

export default function Page() {
  return <TourHero />;
}
