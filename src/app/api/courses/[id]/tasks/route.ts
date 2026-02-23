import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// POST /api/courses/[id]/tasks
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: courseId } = await params;
  const { title, content } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Название задания обязательно" }, { status: 400 });
  }

  const course = await db.course.findFirst({
    where: { id: courseId, companyId: session.user.companyId },
  });
  if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });

  // Определяем следующий порядковый номер
  const lastTask = await db.task.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
  });
  const order = (lastTask?.order ?? 0) + 1;

  const task = await db.task.create({
    data: {
      courseId,
      title: title.trim(),
      content: content?.trim() || null,
      order,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
