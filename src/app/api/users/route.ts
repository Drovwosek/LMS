import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/users — список пользователей компании
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.user.findMany({
    where: { companyId: session.user.companyId },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      canCreateCourses: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

// POST /api/users — создать пользователя + сгенерировать инвайт-ссылку
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { fullName, email } = await req.json();

  if (!fullName?.trim()) {
    return NextResponse.json({ error: "ФИО обязательно" }, { status: 400 });
  }

  // Проверяем уникальность email внутри компании
  if (email) {
    const existing = await db.user.findFirst({
      where: { companyId: session.user.companyId, email },
    });
    if (existing) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
    }
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 часа

  const user = await db.user.create({
    data: {
      companyId: session.user.companyId,
      fullName: fullName.trim(),
      email: email?.trim() || null,
      inviteTokens: {
        create: { expiresAt },
      },
    },
    include: { inviteTokens: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const token = user.inviteTokens[0].token;
  const inviteUrl = `${process.env.NEXTAUTH_URL || ""}/invite/${token}`;

  return NextResponse.json({ user, inviteUrl }, { status: 201 });
}
