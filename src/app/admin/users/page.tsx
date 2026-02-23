import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { UserRow } from "./user-row";

export default async function UsersPage() {
  const session = await auth();
  if (!session) return null;

  const users = await db.user.findMany({
    where: { companyId: session.user.companyId },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  const active = users.filter((u) => u.isActive);
  const fired = users.filter((u) => !u.isActive);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Сотрудники</h1>
        <Link
          href="/admin/users/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Добавить сотрудника
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {active.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Нет сотрудников. Добавьте первого.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Роль</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {fired.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-600">
            Уволенные ({fired.length})
          </summary>
          <div className="mt-3 bg-white rounded-xl border border-gray-200 overflow-hidden opacity-60">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {fired.map((user) => (
                  <UserRow key={user.id} user={user} readonly />
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
