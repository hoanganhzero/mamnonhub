CREATE TABLE `announcement_reads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`announcement_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`read_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `announcement_reads_unique` ON `announcement_reads` (`announcement_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `health_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`date` text NOT NULL,
	`height_cm` real,
	`weight_kg` real,
	`note` text DEFAULT '' NOT NULL,
	`recorded_by` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `health_records_child_date_unique` ON `health_records` (`child_id`,`date`);--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`class_id` integer,
	`date` text NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'Sốt' NOT NULL,
	`severity` text DEFAULT 'Nhẹ' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`handling` text DEFAULT '' NOT NULL,
	`media_key` text,
	`recorded_by` integer,
	`acknowledged_by` integer,
	`acknowledged_at` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `incidents_child_idx` ON `incidents` (`child_id`,`date`);--> statement-breakpoint
CREATE TABLE `menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`week_start` text NOT NULL,
	`weekday` integer NOT NULL,
	`breakfast` text DEFAULT '' NOT NULL,
	`lunch` text DEFAULT '' NOT NULL,
	`snack` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_by` integer,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `menus_week_unique` ON `menus` (`school_id`,`week_start`,`weekday`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`sender_id` integer NOT NULL,
	`sender_role` text NOT NULL,
	`body` text NOT NULL,
	`read_at` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_child_idx` ON `messages` (`child_id`,`id`);--> statement-breakpoint
CREATE TABLE `post_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`media_key` text NOT NULL,
	`content_type` text DEFAULT 'image/jpeg' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `post_media_post_idx` ON `post_media` (`post_id`);--> statement-breakpoint
CREATE TABLE `post_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`child_id` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_tags_unique` ON `post_tags` (`post_id`,`child_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`class_id` integer,
	`author_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Hoạt động học' NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `posts_school_date_idx` ON `posts` (`school_id`,`date`);--> statement-breakpoint
ALTER TABLE `announcements` ADD `class_id` integer;--> statement-breakpoint
ALTER TABLE `announcements` ADD `created_by` integer;--> statement-breakpoint
ALTER TABLE `announcements` ADD `requires_ack` integer DEFAULT false NOT NULL;