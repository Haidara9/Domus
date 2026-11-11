import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {
 id: text('id').primaryKey(), kind: text('kind').notNull(), data: text('data').notNull(), revision: integer('revision').notNull().default(1), updatedAt: text('updated_at').notNull()
});
export const renderJobs=sqliteTable('render_jobs',{
 id:text('id').primaryKey(),requestId:text('request_id').notNull().unique(),status:text('status').notNull(),data:text('data').notNull(),lease:text('lease'),workerId:text('worker_id'),updatedAt:text('updated_at').notNull(),createdAt:text('created_at').notNull()
});
export const renderWorkers=sqliteTable('render_workers',{id:text('id').primaryKey(),data:text('data').notNull(),updatedAt:text('updated_at').notNull()});
export const renderUploads=sqliteTable('render_uploads',{id:text('id').primaryKey(),key:text('key').notNull(),uploadId:text('upload_id').notNull(),name:text('name').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),createdAt:text('created_at').notNull()});
