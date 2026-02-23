"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  payload: { courseId: string; courseTitle: string };
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); });
  }, []);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Уведомления</h1>

      {loading ? (
        <p className="text-sm text-gray-400">Загружаем...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">Уведомлений нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Link
              key={n.id}
              href={`/my-courses/${n.payload.courseId}`}
              className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 px-5 py-4 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">
                Вам назначен курс: <span className="text-blue-600">{n.payload.courseTitle}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
