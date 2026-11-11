CREATE TABLE `render_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`status` text NOT NULL,
	`data` text NOT NULL,
	`lease` text,
	`worker_id` text,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `render_jobs_request_id_unique` ON `render_jobs` (`request_id`);--> statement-breakpoint
CREATE TABLE `render_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`upload_id` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `render_workers` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
