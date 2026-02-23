"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [info, setInfo] = useState<{ fullName: string; email: string | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setErrorMsg(data.error);
          setStatus("invalid");
        } else {
          setInfo(data);
          setStatus("valid");
        }
      })
      .catch(() => {
        setErrorMsg("Ошибка сервера");
        setStatus("invalid");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 6) {
      setFormError("Пароль должен быть не менее 6 символов");
      return;
    }
    if (password !== password2) {
      setFormError("Пароли не совпадают");
      return;
    }

    setSubmitting(true);

    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error || "Ошибка");
      setSubmitting(false);
      return;
    }

    // Автоматически входим после регистрации (email может быть null — входим через email из ответа)
    const email = data.email || info?.email;
    if (email) {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.ok) {
        router.push("/dashboard");
        return;
      }
    }

    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Проверяем ссылку...</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">🔗</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Ссылка недействительна
          </h1>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Добро пожаловать
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Привет, <strong>{info?.fullName}</strong>! Придумайте пароль для входа
          в систему.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              required
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Повторите пароль
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {submitting ? "Сохраняем..." : "Создать пароль и войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
