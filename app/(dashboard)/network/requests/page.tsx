import { redirect } from "next/navigation";

export default function RequestsPage() {
  redirect("/network?tab=invitations");
}
