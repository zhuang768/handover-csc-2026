CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`entity_id` text NOT NULL,
	`at` text NOT NULL,
	`detail` text NOT NULL,
	`is_demo` integer DEFAULT 1 NOT NULL
);

CREATE TABLE `auth_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bucket` text NOT NULL,
	`at` text NOT NULL
);

CREATE INDEX `auth_attempts_bucket` ON `auth_attempts` (`bucket`,`at`);
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_demo` integer DEFAULT 1 NOT NULL
);

CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`subject` text NOT NULL,
	`teacher_id` text NOT NULL,
	`date` text NOT NULL,
	`period` integer NOT NULL,
	`room` text NOT NULL,
	`base_teacher_id` text NOT NULL,
	`base_date` text NOT NULL,
	`base_period` integer NOT NULL,
	`base_room` text NOT NULL,
	`is_demo` integer DEFAULT 1 NOT NULL
);

CREATE INDEX `lessons_class_slot` ON `lessons` (`class_id`,`date`,`period`);
CREATE UNIQUE INDEX `lessons_one_teacher_slot` ON `lessons` (`teacher_id`,`date`,`period`);
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);

CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`event` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text NOT NULL,
	`read` integer DEFAULT 0 NOT NULL
);

CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`class_id` text NOT NULL,
	`subject` text NOT NULL,
	`original_teacher_id` text NOT NULL,
	`original_date` text NOT NULL,
	`original_period` integer NOT NULL,
	`original_room` text NOT NULL,
	`kind` text NOT NULL,
	`target_date` text NOT NULL,
	`target_period` integer NOT NULL,
	`target_room` text NOT NULL,
	`recipient_id` text NOT NULL,
	`reason_category` text NOT NULL,
	`reason` text NOT NULL,
	`handover_json` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_demo` integer DEFAULT 1 NOT NULL
);

CREATE UNIQUE INDEX `open_request_per_lesson` ON `requests` (`lesson_id`) WHERE status IN ('Draft', 'Pending', 'Confirmed', 'Declined');
CREATE INDEX `requests_status` ON `requests` (`status`,`updated_at`);
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);

CREATE INDEX `sessions_user` ON `sessions` (`user_id`);
CREATE TABLE `slot_locks` (
	`request_id` text NOT NULL,
	`scope` text NOT NULL,
	`scope_id` text NOT NULL,
	`date` text NOT NULL,
	`period` integer NOT NULL,
	PRIMARY KEY(`scope`, `scope_id`, `date`, `period`)
);

CREATE TABLE `supplements` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`text` text NOT NULL,
	`at` text NOT NULL
);

CREATE TABLE `timeline` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`at` text NOT NULL
);

CREATE TABLE `todos` (
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`key` text NOT NULL,
	`done` integer NOT NULL,
	PRIMARY KEY(`user_id`, `request_id`, `key`)
);

CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`class_id` text,
	`subjects` text DEFAULT '[]' NOT NULL,
	`password_hash` text NOT NULL,
	`recovery_hash` text,
	`is_demo` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE TABLE `views` (
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`at` text NOT NULL,
	PRIMARY KEY(`user_id`, `request_id`)
);
