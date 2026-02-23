import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <span className="font-semibold text-gray-900 text-sm">LMS</span>
            <Link
              href="/admin/users"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Сотрудники
            </Link>
            <Link
              href="/courses"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Курсы
            </Link>
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
