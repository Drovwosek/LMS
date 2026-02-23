import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

type Params = { params: Promise<{ token: string }> };

// GET /api/invite/[token] — проверить валидность токена
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const invite = await db.inviteToken.findUnique({
    where: { token },
    include: { user: { select: { fullName: true, email: true, passwordHash: true } } },
  });

  if (!invite) return NextResponse.json({ error: "Ссылка недействительна" }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: "Ссылка уже использована" }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Ссылка истекла" }, { status: 410 });
  if (invite.user.passwordHash) return NextResponse.json({ error: "Пользователь уже зарегистрирован" }, { status: 410 });

  return NextResponse.json({
    fullName: invite.user.fullName,
    email: invite.user.email,
  });
}

// POST /api/invite/[token] — завершить регистрацию
export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const { password } = await req.json();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Пароль должен быть не менее 6 символов" }, { status: 400 });
  }

  const invite = await db.inviteToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!invite) return NextResponse.json({ error: "Ссылка недействительна" }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: "Ссылка уже использована" }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Ссылка истекла" }, { status: 410 });
  if (invite.user.passwordHash) return NextResponse.json({ error: "Пользователь уже зарегистрирован" }, { status: 410 });

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: invite.userId },
      data: { passwordHash },
    }),
    db.inviteToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, email: invite.user.email });
}
