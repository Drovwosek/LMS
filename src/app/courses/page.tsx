import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function CoursesPage() {
  const session = await auth();
  if (!session) return null;

  const courses = await db.course.findMany({
    where: { companyId: session.user.companyId },
    include: { _count: { select: { tasks: true, assignments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Курсы</h1>
        <Link
          href="/courses/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Создать курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-400 text-sm">Курсов пока нет. Создайте первый.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 px-5 py-4 flex items-center justify-between transition-colors group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </span>
                  {course.isPublished ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Опубликован
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      Черновик
                    </span>
                  )}
                </div>
                {course.description && (
                  <p className="text-sm text-gray-400 truncate max-w-md">{course.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400 shrink-0">
                <span>{course._count.tasks} заданий</span>
                <span>{course._count.assignments} назначений</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
