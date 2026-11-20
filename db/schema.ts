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
  id: text('id').primaryKey(), name: text('name').notNull(), contentType: text('content_type').notNull(),
  size: integer('size').notNull(), createdAt: text('created_at').notNull(),
});
