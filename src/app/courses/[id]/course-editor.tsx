"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Task = { id: string; title: string; content: string | null; order: number; files: FileRecord[] };
type FileRecord = { id: string; fileName: string; fileSize: number; mimeType: string };
type Assignment = { id: string; status: string; user: { id: string; fullName: string; email: string | null } };
type Course = {
  id: string; title: string; description: string | null; isPublished: boolean;
  tasks: Task[]; files: FileRecord[]; assignments: Assignment[];
};
type User = { id: string; fullName: string; email: string | null };

export function CourseEditor({
  course: initial,
  unassignedUsers,
  canEdit,
}: {
  course: Course;
  unassignedUsers: User[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [course, setCourse] = useState(initial);
  const [activeTab, setActiveTab] = useState<"tasks" | "assign">("tasks");

  // --- Задания ---
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({ title: "", content: "" });

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    const res = await fetch(`/api/courses/${course.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle.trim() }),
    });
    const task = await res.json();
    setCourse((c) => ({ ...c, tasks: [...c.tasks, { ...task, files: [] }] }));
    setNewTaskTitle("");
    setAddingTask(false);
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/courses/${course.id}/tasks/${taskId}`, { method: "DELETE" });
    setCourse((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }));
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskForm({ title: task.title, content: task.content || "" });
  };

  const saveEditTask = async (taskId: string) => {
    const res = await fetch(`/api/courses/${course.id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editTaskForm),
    });
    const updated = await res.json();
    setCourse((c) => ({ ...c, tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, ...updated } : t)) }));
    setEditingTaskId(null);
  };

  // --- Публикация ---
  const togglePublish = async () => {
    const res = await fetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    });
    const updated = await res.json();
    setCourse((c) => ({ ...c, isPublished: updated.isPublished }));
  };

  // --- Файлы ---
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, taskId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("courseId", course.id);
    if (taskId) fd.append("taskId", taskId);

    const res = await fetch("/api/files/upload", { method: "POST", body: fd });
    const record = await res.json();
    setUploading(false);

    if (taskId) {
      setCourse((c) => ({
        ...c,
        tasks: c.tasks.map((t) =>
          t.id === taskId ? { ...t, files: [...t.files, record] } : t
        ),
      }));
    } else {
      setCourse((c) => ({ ...c, files: [...c.files, record] }));
    }
    e.target.value = "";
  };

  const deleteFile = async (fileId: string, taskId?: string) => {
    await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    if (taskId) {
      setCourse((c) => ({
        ...c,
        tasks: c.tasks.map((t) =>
          t.id === taskId ? { ...t, files: t.files.filter((f) => f.id !== fileId) } : t
        ),
      }));
    } else {
      setCourse((c) => ({ ...c, files: c.files.filter((f) => f.id !== fileId) }));
    }
  };

  const downloadFile = async (fileId: string) => {
    const res = await fetch(`/api/files/${fileId}`);
    const { url } = await res.json();
    window.open(url, "_blank");
  };

  // --- Назначение ---
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const assignCourse = async () => {
    if (selectedUsers.length === 0) return;
    setAssigning(true);
    await fetch(`/api/courses/${course.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: selectedUsers }),
    });
    setAssigning(false);
    setSelectedUsers([]);
    router.refresh();
  };

  const statusLabel: Record<string, string> = {
    ASSIGNED: "Назначен",
    IN_PROGRESS: "В процессе",
    COMPLETED: "Завершён",
  };
  const statusColor: Record<string, string> = {
    ASSIGNED: "bg-gray-100 text-gray-600",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
  };

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
          {course.description && <p className="text-sm text-gray-400 mt-1">{course.description}</p>}
        </div>
        {canEdit && (
          <button
            onClick={togglePublish}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              course.isPublished
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {course.isPublished ? "Снять с публикации" : "Опубликовать"}
          </button>
        )}
      </div>

      {/* Табы */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(["tasks", "assign"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab === "tasks" ? `Задания (${course.tasks.length})` : `Назначения (${course.assignments.length})`}
          </button>
        ))}
      </div>

      {/* Задания */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {course.tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4">
              {editingTaskId === task.id ? (
                <div className="space-y-3">
                  <input
                    value={editTaskForm.title}
                    onChange={(e) => setEditTaskForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    rows={3}
                    placeholder="Описание задания (необязательно)"
                    value={editTaskForm.content}
                    onChange={(e) => setEditTaskForm((f) => ({ ...f, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEditTask(task.id)}
                      className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingTaskId(null)}
                      className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:text-gray-900"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                      {task.content && <p className="text-sm text-gray-500 mt-1">{task.content}</p>}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2 shrink-0 ml-4">
                        <button onClick={() => startEditTask(task)} className="text-xs text-gray-400 hover:text-gray-700">
                          Изменить
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="text-xs text-red-400 hover:text-red-600">
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Файлы задания */}
                  {task.files.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {task.files.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-gray-400">📎</span>
                          <button onClick={() => downloadFile(f.id)} className="hover:underline truncate">
                            {f.fileName}
                          </button>
                          {canEdit && (
                            <button onClick={() => deleteFile(f.id, task.id)} className="text-red-400 hover:text-red-600 text-xs">
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {canEdit && (
                    <label className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => uploadFile(e, task.id)}
                        disabled={uploading}
                      />
                      + Прикрепить файл
                    </label>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Добавить задание */}
          {canEdit && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Название нового задания"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addTask}
                  disabled={addingTask || !newTaskTitle.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Добавить
                </button>
              </div>
            </div>
          )}

          {/* Файлы курса */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Файлы курса (общие)</p>
            {course.files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="text-gray-400">📎</span>
                <button onClick={() => downloadFile(f.id)} className="hover:underline truncate">
                  {f.fileName}
                </button>
                {canEdit && (
                  <button onClick={() => deleteFile(f.id)} className="text-red-400 hover:text-red-600 text-xs">
                    ✕
                  </button>
                )}
              </div>
            ))}
            {canEdit && (
              <label className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline cursor-pointer mt-1">
                <input type="file" className="hidden" onChange={(e) => uploadFile(e)} disabled={uploading} />
                + Прикрепить файл к курсу
              </label>
            )}
          </div>
        </div>
      )}

      {/* Назначения */}
      {activeTab === "assign" && (
        <div className="space-y-6">
          {/* Уже назначены */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Назначены</h2>
            {course.assignments.length === 0 ? (
              <p className="text-sm text-gray-400">Никому не назначен</p>
            ) : (
              <div className="space-y-2">
                {course.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.user.fullName}</p>
                      {a.user.email && <p className="text-xs text-gray-400">{a.user.email}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Назначить новых */}
          {canEdit && unassignedUsers.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3">Назначить сотрудников</h2>
              <div className="space-y-2 mb-4">
                {unassignedUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={(e) =>
                        setSelectedUsers((s) =>
                          e.target.checked ? [...s, u.id] : s.filter((id) => id !== u.id)
                        )
                      }
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                      {u.email && <p className="text-xs text-gray-400">{u.email}</p>}
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={assignCourse}
                disabled={assigning || selectedUsers.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {assigning ? "Назначаем..." : `Назначить (${selectedUsers.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
