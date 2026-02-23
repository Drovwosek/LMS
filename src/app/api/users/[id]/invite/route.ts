import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// POST /api/users/[id]/invite — перегенерировать инвайт-ссылку
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const user = await db.user.findFirst({
    where: { id, companyId: session.user.companyId, isActive: true },
  });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  // Пользователь уже зарегистрировался
  if (user.passwordHash) {
    return NextResponse.json({ error: "Пользователь уже зарегистрирован" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const invite = await db.inviteToken.create({
    data: { userId: id, expiresAt },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL || ""}/invite/${invite.token}`;

  return NextResponse.json({ inviteUrl });
}
