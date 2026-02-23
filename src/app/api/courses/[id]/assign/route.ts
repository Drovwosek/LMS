import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// POST /api/courses/[id]/assign
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: courseId } = await params;
  const { userIds } = await req.json(); // string[]

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Укажите хотя бы одного сотрудника" }, { status: 400 });
  }

  const course = await db.course.findFirst({
    where: { id: courseId, companyId: session.user.companyId },
  });
  if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });

  // Проверяем, что все пользователи из той же компании
  const users = await db.user.findMany({
    where: { id: { in: userIds }, companyId: session.user.companyId, isActive: true },
  });

  if (users.length !== userIds.length) {
    return NextResponse.json({ error: "Некоторые пользователи не найдены" }, { status: 400 });
  }

  // Создаём назначения (игнорируем дубликаты)
  const created = await db.$transaction(
    userIds.map((userId: string) =>
      db.courseAssignment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId },
        update: {}, // не меняем статус если уже назначен
      })
    )
  );

  // Создаём уведомления для новых назначений
  await db.notification.createMany({
    data: userIds.map((userId: string) => ({
      userId,
      type: "COURSE_ASSIGNED",
      payload: { courseId, courseTitle: course.title },
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ assigned: created.length });
}
