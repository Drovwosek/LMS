import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const courseId = formData.get("courseId") as string | null;
  const taskId = formData.get("taskId") as string | null;

  if (!file) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (!courseId) return NextResponse.json({ error: "courseId обязателен" }, { status: 400 });

  // Проверяем принадлежность курса компании
  const course = await db.course.findFirst({
    where: { id: courseId, companyId: session.user.companyId },
  });
  if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() || "bin";
  const fileKey = `${session.user.companyId}/${courseId}/${randomUUID()}.${ext}`;

  await uploadFile(fileKey, buffer, file.type || "application/octet-stream");

  const record = await db.file.create({
    data: {
      courseId,
      taskId: taskId || null,
      uploadedById: session.user.id,
      fileName: file.name,
      fileKey,
      fileSize: buffer.length,
      mimeType: file.type || "application/octet-stream",
    },
  });

  return NextResponse.json(record, { status: 201 });
}
