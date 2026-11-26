CREATE TABLE `case_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`case_id` text NOT NULL,
	`version` text NOT NULL,
	`answers` text NOT NULL,
	`created_at` text NOT NULL
);
