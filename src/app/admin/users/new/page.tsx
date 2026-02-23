"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Ошибка");
      return;
    }

    setInviteUrl(data.inviteUrl);
  };

  if (inviteUrl) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Сотрудник создан
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Передайте эту ссылку сотруднику для регистрации. Ссылка действует 24
          часа.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-xs text-blue-700 font-medium mb-1">
            Ссылка для регистрации
          </p>
          <code className="text-sm text-blue-900 break-all">{inviteUrl}</code>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Копировать ссылку
          </button>
          <Link
            href="/admin/users"
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            К списку сотрудников
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Сотрудники
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Добавить сотрудника
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ФИО <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Иванов Иван Иванович"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email{" "}
            <span className="text-gray-400 font-normal">(необязательно)</span>
          </label>
          <input
            type="email"
            placeholder="ivan@company.ru"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Если указан, инвайт-ссылка будет показана для отправки на этот
            адрес
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {loading ? "Создаём..." : "Создать и получить ссылку"}
          </button>
          <Link
            href="/admin/users"
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
