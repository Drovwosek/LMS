import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  const assignment = await db.courseAssignment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!assignment) return NextResponse.json({ error: "Курс не назначен" }, { status: 404 });
  if (assignment.status === "COMPLETED") return NextResponse.json({ ok: true });

  await db.courseAssignment.update({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      ...(assignment.status === "ASSIGNED" && { startedAt: new Date() }),
    },
  });

  return NextResponse.json({ ok: true });
}
