# Схема базы данных — LMS

> Источник правды для Prisma schema. Все модели, поля и связи.

---

## Модели

### Company
Tenant. Каждая компания полностью изолирована.

| Поле | Тип | Описание |
|------|-----|----------|
| id | String (cuid) | PK |
| name | String | Название компании |
| subscriptionStatus | Enum | TRIAL / ACTIVE / EXPIRED |
| subscriptionExpiresAt | DateTime? | Дата окончания подписки |
| createdAt | DateTime | |

**Связи:** users, courses

---

### User
Пользователь внутри компании.

| Поле | Тип | Описание |
|------|-----|----------|
| id | String (cuid) | PK |
| companyId | String | FK → Company |
| fullName | String | ФИО |
| email | String? | Опционально (может быть без почты) |
| passwordHash | String? | null пока не прошёл регистрацию по инвайту |
| role | Enum | ADMIN / WORKER |
| canCreateCourses | Boolean | Надстройка над ролью (default: false, у ADMIN — true) |
| isActive | Boolean | false = уволен (скрыт, доступ закрыт) |
| createdAt | DateTime | |

**Связи:** company, inviteTokens, courseAssignments, notifications

> Примечание: ADMIN всегда имеет canCreateCourses = true. WORKER может получить canCreateCourses = true от Admin.

---

### InviteToken
Одноразовые ссылки для саморегистрации работника.

| Поле | Тип | Описание |
|------|-----|----------|
| id | String (cuid) | PK |
| token | String (unique) | Случайный UUID |
| userId | String | FK → User (для кого создан) |
| expiresAt | DateTime | createdAt + 24 часа |
| usedAt | DateTime? | null = не использован |
| createdAt | DateTime | |

**Связи:** user

---

### Course
Курс внутри компании.

| Поле | Тип | Описание |
|------|-----|----------|
| id | String (cuid) | PK |
| companyId | String | FK → Company |
| createdById | String | FK → User (кто создал) |
| title | String | Название курса |
| description | String? | Описание |
| isPublished | Boolean | false = черновик (не виден работникам) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Связи:** company, createdBy, tasks, files, assignments

---

### Task
Задание внутри курса. Плоский список.

| Поле | Тип | Описание |
|------|-----|----------|
| id | String (cuid) | PK |
| courseId | String | FK → Course |
| title | String | Название задания |
| content | String? | Текстовое описание (markdown) |
| order | Int | Порядок отображения |
| createdAt | DateTime | |

**Связи:** course, files

---

### File
Прикреплённый файл. Может принадлежать заданию или курсу.

| Поле | Тип | Описание |
|------|-----|----------|
| id | String (cuid) | PK |
| courseId | String? | FK → Course (если прикреплён к курсу) |
| taskId | String? | FK → Task (если прикреплён к заданию) |
| uploadedById | String | FK → User |
| fileName | String | Оригинальное имя файла |
| fileKey | String | Ключ в S3 (путь к объекту) |
| fileSize | Int | Размер в байтах |
| mimeType | String | MIME-тип |
| createdAt | DateTime | |

**Связи:** course, task, uploadedBy

---

### CourseAssignment
Связь пользователь ↔ курс. Отслеживает прогресс.

| Поле | Тип | Описание |
|------|-----|----------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| courseId | String | FK → Course |
| status | Enum | ASSIGNED / IN_PROGRESS / COMPLETED |
| assignedAt | DateTime | Дата назначения |
| startedAt | DateTime? | Когда работник впервые открыл курс |
| completedAt | DateTime? | Когда нажал "Завершить курс" |

**Связи:** user, course

> Уникальный составной индекс: (userId, courseId)

---

### Notification
In-app уведомления для работника.

| Поле | Тип | Описание |
|------|-----|----------|
| id | String (cuid) | PK |
| userId | String | FK → User (кому) |
| type | Enum | COURSE_ASSIGNED |
| payload | Json | { courseId, courseTitle } |
| isRead | Boolean | false = непрочитано |
| createdAt | DateTime | |

**Связи:** user

---

## Enum-ы

```
SubscriptionStatus: TRIAL | ACTIVE | EXPIRED
Role:               ADMIN | WORKER
CourseAssignmentStatus: ASSIGNED | IN_PROGRESS | COMPLETED
NotificationType:   COURSE_ASSIGNED
```

---

## Ключевые индексы

- `User`: (companyId, email) — unique (если email не null)
- `User`: (companyId, isActive) — фильтрация уволенных
- `CourseAssignment`: (userId, courseId) — unique
- `InviteToken`: (token) — unique
- `Course`: (companyId) — все курсы компании
- `Task`: (courseId, order) — сортировка заданий
