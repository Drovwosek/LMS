"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  fullName: string;
  email: string | null;
  role: string;
  canCreateCourses: boolean;
  isActive: boolean;
  passwordHash?: string | null;
};

export function UserRow({ user, readonly }: { user: User; readonly?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const isRegistered = !!user.passwordHash;

  const handleFire = async () => {
    if (!confirm(`Уволить ${user.fullName}?`)) return;
    setLoading(true);
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  };

  const handleToggleCreator = async () => {
    setLoading(true);
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canCreateCourses: !user.canCreateCourses }),
    });
    router.refresh();
    setLoading(false);
  };

  const handleResendInvite = async () => {
    setLoading(true);
    const res = await fetch(`/api/users/${user.id}/invite`, { method: "POST" });
    const data = await res.json();
    if (data.inviteUrl) setInviteUrl(data.inviteUrl);
    setLoading(false);
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 font-medium text-gray-900">{user.fullName}</td>
        <td className="px-4 py-3 text-gray-500">{user.email || "—"}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            user.role === "ADMIN"
              ? "bg-purple-100 text-purple-700"
              : "bg-gray-100 text-gray-600"
          }`}>
            {user.role === "ADMIN" ? "Администратор" : "Сотрудник"}
          </span>
          {user.canCreateCourses && user.role !== "ADMIN" && (
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              Создатель курсов
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {isRegistered ? (
            <span className="text-xs text-green-600">Зарегистрирован</span>
          ) : (
            <span className="text-xs text-amber-600">Ожидает регистрации</span>
          )}
        </td>
        {!readonly && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2 justify-end">
              {!isRegistered && (
                <button
                  onClick={handleResendInvite}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  Инвайт
                </button>
              )}
              {user.role !== "ADMIN" && (
                <button
                  onClick={handleToggleCreator}
                  disabled={loading}
                  className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50"
                >
                  {user.canCreateCourses ? "Снять права создателя" : "Дать права создателя"}
                </button>
              )}
              {user.role !== "ADMIN" && (
                <button
                  onClick={handleFire}
                  disabled={loading}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  Уволить
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
      {inviteUrl && (
        <tr>
          <td colSpan={5} className="px-4 pb-3">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <span className="text-xs text-blue-700 font-medium">Ссылка для регистрации:</span>
              <code className="text-xs text-blue-900 break-all flex-1">{inviteUrl}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl);
                }}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Копировать
              </button>
              <button
                onClick={() => setInviteUrl(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
