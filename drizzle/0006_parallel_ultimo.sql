CREATE TABLE `campuses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`name` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`campus_id` integer NOT NULL,
	`name` text NOT NULL,
	`age_group` text DEFAULT '' NOT NULL,
	`academic_year` text NOT NULL,
	`teacher_id` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `children` ADD `class_id` integer;--> statement-breakpoint
ALTER TABLE `children` ADD `father_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `father_birth_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `father_job` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `father_phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `mother_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `mother_birth_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `mother_job` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `mother_phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `zalo_phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `schools` ADD `address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `schools` ADD `logo_key` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `banner_key` text;