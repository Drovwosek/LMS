import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/courses/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const course = await db.course.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      tasks: { orderBy: { order: "asc" }, include: { files: true } },
      files: true,
      assignments: {
        include: {
          user: { select: { id: true, fullName: true, email: true, isActive: true } },
        },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });

  return NextResponse.json(course);
}

// PATCH /api/courses/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { title, description, isPublished } = await req.json();

  const course = await db.course.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });

  const updated = await db.course.update({
    where: { id },
    data: {
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/courses/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const course = await db.course.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });

  await db.course.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
