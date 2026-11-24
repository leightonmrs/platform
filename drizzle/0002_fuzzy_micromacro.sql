CREATE TABLE `self_check_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`version` text NOT NULL,
	`answers` text NOT NULL,
	`correct_count` integer NOT NULL,
	`total_count` integer NOT NULL,
	`created_at` text NOT NULL
);
