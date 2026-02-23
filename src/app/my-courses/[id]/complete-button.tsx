"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CompleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!confirm("Отметить курс как пройденный?")) return;
    setLoading(true);
    await fetch(`/api/my-courses/${courseId}/complete`, { method: "POST" });
    router.refresh();
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
    >
      {loading ? "Сохраняем..." : "Завершить курс"}
    </button>
  );
}
