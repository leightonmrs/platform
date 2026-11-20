CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`score` integer NOT NULL,
	`passed` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learners` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`joined_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`body` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`completed_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
