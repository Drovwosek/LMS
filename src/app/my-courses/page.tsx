import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  ASSIGNED: "Назначен",
  IN_PROGRESS: "В процессе",
  COMPLETED: "Завершён",
};
const statusColor: Record<string, string> = {
  ASSIGNED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session) return null;

  const assignments = await db.courseAssignment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: { _count: { select: { tasks: true } } },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const active = assignments.filter((a) => a.status !== "COMPLETED");
  const completed = assignments.filter((a) => a.status === "COMPLETED");

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Мои курсы</h1>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-400 text-sm">Вам пока не назначено ни одного курса</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Активные</h2>
              <div className="grid gap-3">
                {active.map((a) => (
                  <Link
                    key={a.id}
                    href={`/my-courses/${a.course.id}`}
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 px-5 py-4 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {a.course.title}
                      </p>
                      {a.course.description && (
                        <p className="text-sm text-gray-400 mt-0.5 truncate max-w-sm">{a.course.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-gray-400">{a.course._count.tasks} заданий</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[a.status]}`}>
                        {statusLabel[a.status]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Завершённые</h2>
              <div className="grid gap-3">
                {completed.map((a) => (
                  <Link
                    key={a.id}
                    href={`/my-courses/${a.course.id}`}
                    className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-5 py-4 flex items-center justify-between transition-colors opacity-60"
                  >
                    <p className="font-medium text-gray-900">{a.course.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
