import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/courses
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const courses = await db.course.findMany({
    where: { companyId: session.user.companyId },
    include: {
      _count: { select: { tasks: true, assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}

// POST /api/courses
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.canCreateCourses) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  const course = await db.course.create({
    data: {
      companyId: session.user.companyId,
      createdById: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
