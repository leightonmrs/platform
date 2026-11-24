import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  data: text('data').notNull(), revision: integer('revision').notNull().default(1), updatedAt: text('updated_at').notNull(),
});
export const progress = sqliteTable('progress', {
  userId: text('user_id').notNull(), lessonId: text('lesson_id').notNull(), completedAt: text('completed_at').notNull(),
}, t => [primaryKey({ columns: [t.userId, t.lessonId] })]);
export const notes = sqliteTable('notes', {
  userId: text('user_id').notNull(), lessonId: text('lesson_id').notNull(), body: text('body').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [primaryKey({ columns: [t.userId, t.lessonId] })]);
export const attempts = sqliteTable('attempts', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), lessonId: text('lesson_id').notNull(),
  score: integer('score').notNull(), passed: integer('passed').notNull(), createdAt: text('created_at').notNull(),
});
export const learners = sqliteTable('learners', {
  userId: text('user_id').primaryKey(), name: text('name').notNull(), joinedAt: text('joined_at').notNull(),
});
export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(), courseId: text('course_id').notNull().default('main'), name: text('name').notNull(), contentType: text('content_type').notNull(),
  size: integer('size').notNull(), createdAt: text('created_at').notNull(),
});
export const enrollments = sqliteTable('enrollments', {
  courseId: text('course_id').notNull(), userId: text('user_id').notNull(),
  joinedAt: text('joined_at').notNull(), source: text('source').notNull(),
}, t => [primaryKey({ columns: [t.courseId, t.userId] })]);
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(), courseId: text('course_id').notNull(), userId: text('user_id').notNull(),
  name: text('name').notNull(), amountKzt: integer('amount_kzt').notNull(),
  status: text('status').notNull(), createdAt: text('created_at').notNull(), paidAt: text('paid_at'),
});
export const selfCheckAttempts = sqliteTable('self_check_attempts', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(),
  courseId: text('course_id').notNull(), lessonId: text('lesson_id').notNull(),
  exerciseId: text('exercise_id').notNull(), version: text('version').notNull(),
  answers: text('answers').notNull(), correctCount: integer('correct_count').notNull(),
  totalCount: integer('total_count').notNull(), createdAt: text('created_at').notNull(),
});
