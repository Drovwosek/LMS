import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/users/[id] — редактировать пользователя
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { fullName, email, canCreateCourses } = await req.json();

  const user = await db.user.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  // Нельзя редактировать самого себя через этот эндпоинт (роли)
  const updated = await db.user.update({
    where: { id },
    data: {
      ...(fullName && { fullName: fullName.trim() }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(canCreateCourses !== undefined && { canCreateCourses }),
    },
    select: { id: true, fullName: true, email: true, role: true, canCreateCourses: true, isActive: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/users/[id] — уволить (soft delete)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Нельзя уволить самого себя
  if (id === session.user.id) {
    return NextResponse.json({ error: "Нельзя уволить самого себя" }, { status: 400 });
  }

  const user = await db.user.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  await db.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
