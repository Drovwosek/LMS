import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { companyName, email, password } = await req.json();

    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: "Заполните все поля" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 6 символов" },
        { status: 400 }
      );
    }

    // Проверяем, нет ли уже такого email (глобально, т.к. email уникален в рамках компании,
    // но admin-email должен быть уникален глобально для входа)
    const existingUser = await db.user.findFirst({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Создаём компанию и Admin-пользователя в одной транзакции
    const result = await db.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName },
      });

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          fullName: "Администратор",
          email,
          passwordHash,
          role: "ADMIN",
          canCreateCourses: true,
        },
      });

      return { company, user };
    });

    return NextResponse.json(
      { companyId: result.company.id, userId: result.user.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
