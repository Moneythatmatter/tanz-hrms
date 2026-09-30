import { redirect } from "next/navigation";

export default function LegacyPropertyUsersPage() {
  redirect("/settings/users");
}
