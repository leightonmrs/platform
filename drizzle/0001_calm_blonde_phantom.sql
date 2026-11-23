CREATE TABLE `enrollments` (
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` text NOT NULL,
	`source` text NOT NULL,
	PRIMARY KEY(`course_id`, `user_id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`amount_kzt` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
ALTER TABLE `assets` ADD `course_id` text DEFAULT 'main' NOT NULL;