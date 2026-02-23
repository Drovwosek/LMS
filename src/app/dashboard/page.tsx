import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/my-courses");
}
