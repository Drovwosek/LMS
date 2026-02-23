import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile, getDownloadUrl } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

// GET /api/files/[id]/download — получить signed URL
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const file = await db.file.findFirst({
    where: {
      id,
      course: { companyId: session.user.companyId },
    },
  });
  if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });

  const url = await getDownloadUrl(file.fileKey, file.fileName);

  return NextResponse.json({ url, fileName: file.fileName });
}

// DELETE /api/files/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const file = await db.file.findFirst({
    where: {
      id,
      course: { companyId: session.user.companyId },
    },
  });
  if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });

  await deleteFile(file.fileKey);
  await db.file.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
