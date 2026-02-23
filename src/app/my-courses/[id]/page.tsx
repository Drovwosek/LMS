import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CompleteCourseButton } from "./complete-button";

export default async function MyCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id: courseId } = await params;

  const assignment = await db.courseAssignment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    include: {
      course: {
        include: {
          tasks: { orderBy: { order: "asc" }, include: { files: true } },
          files: { where: { taskId: null } },
        },
      },
    },
  });

  if (!assignment || !assignment.course.isPublished) redirect("/my-courses");

  // Ставим статус IN_PROGRESS при первом открытии (через server action)
  if (assignment.status === "ASSIGNED") {
    await db.courseAssignment.update({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
  }

  const course = assignment.course;
  const isCompleted = assignment.status === "COMPLETED";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/my-courses" className="text-sm text-gray-500 hover:text-gray-900">
          ← Мои курсы
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h1>
      {course.description && <p className="text-sm text-gray-500 mb-6">{course.description}</p>}

      {/* Общие файлы курса */}
      {course.files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Материалы курса</p>
          {course.files.map((f) => (
            <FileDownload key={f.id} file={f} />
          ))}
        </div>
      )}

      {/* Задания */}
      {course.tasks.length > 0 && (
        <div className="space-y-3 mb-6">
          {course.tasks.map((task, i) => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="font-medium text-gray-900 text-sm mb-1">
                {i + 1}. {task.title}
              </p>
              {task.content && <p className="text-sm text-gray-500 mb-3">{task.content}</p>}
              {task.files.map((f) => (
                <FileDownload key={f.id} file={f} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Кнопка завершения */}
      {isCompleted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700 font-medium">
          ✓ Курс завершён
        </div>
      ) : (
        <CompleteCourseButton courseId={courseId} />
      )}
    </div>
  );
}

function FileDownload({ file }: { file: { id: string; fileName: string; fileSize: number } }) {
  const sizeKb = Math.round(file.fileSize / 1024);
  return (
    <DownloadLink fileId={file.id} fileName={file.fileName} sizeKb={sizeKb} />
  );
}

function DownloadLink({ fileId, fileName, sizeKb }: { fileId: string; fileName: string; sizeKb: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
      <span className="text-gray-400">📎</span>
      <ClientDownload fileId={fileId} fileName={fileName} sizeKb={sizeKb} />
    </div>
  );
}

// Client component для скачивания
import { ClientDownload } from "./client-download";
