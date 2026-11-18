import { redirect } from "next/navigation";

export default function SettingsIntegrationsPage() {
  redirect("/marketplace/connectors?view=mine");
}
