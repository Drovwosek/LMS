import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CourseEditor } from "./course-editor";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const course = await db.course.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      tasks: { orderBy: { order: "asc" }, include: { files: true } },
      files: { where: { taskId: null } },
      assignments: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  if (!course) redirect("/courses");

  // Список активных сотрудников для назначения
  const allUsers = await db.user.findMany({
    where: { companyId: session.user.companyId, isActive: true },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });

  const assignedIds = new Set(course.assignments.map((a) => a.userId));
  const unassignedUsers = allUsers.filter((u) => !assignedIds.has(u.id));

  return (
    <div>
      <div className="mb-6">
        <Link href="/courses" className="text-sm text-gray-500 hover:text-gray-900">
          ← Курсы
        </Link>
      </div>
      <CourseEditor
        course={course as any}
        unassignedUsers={unassignedUsers}
        canEdit={session.user.canCreateCourses}
      />
    </div>
  );
}
