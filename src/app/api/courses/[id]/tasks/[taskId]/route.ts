import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; taskId: string }> };

// PATCH /api/courses/[id]/tasks/[taskId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: courseId, taskId } = await params;
  const { title, content, order } = await req.json();

  const task = await db.task.findFirst({
    where: { id: taskId, courseId, course: { companyId: session.user.companyId } },
  });
  if (!task) return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      ...(title && { title: title.trim() }),
      ...(content !== undefined && { content: content?.trim() || null }),
      ...(order !== undefined && { order }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/courses/[id]/tasks/[taskId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: courseId, taskId } = await params;

  const task = await db.task.findFirst({
    where: { id: taskId, courseId, course: { companyId: session.user.companyId } },
  });
  if (!task) return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });

  await db.task.delete({ where: { id: taskId } });

  return NextResponse.json({ ok: true });
}
