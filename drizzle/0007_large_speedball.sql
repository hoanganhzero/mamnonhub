CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`class_id` integer,
	`date` text NOT NULL,
	`status` text DEFAULT 'Có mặt' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`check_in_at` text DEFAULT '' NOT NULL,
	`check_out_at` text DEFAULT '' NOT NULL,
	`recorded_by` integer,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_child_date_unique` ON `attendance` (`child_id`,`date`);--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`class_id` integer,
	`date` text NOT NULL,
	`breakfast` text DEFAULT '' NOT NULL,
	`lunch` text DEFAULT '' NOT NULL,
	`snack` text DEFAULT '' NOT NULL,
	`sleep` text DEFAULT '' NOT NULL,
	`sleep_minutes` integer,
	`mood` text DEFAULT '' NOT NULL,
	`health` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`recorded_by` integer,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_logs_child_date_unique` ON `daily_logs` (`child_id`,`date`);--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`class_id` integer,
	`from_date` text NOT NULL,
	`to_date` text NOT NULL,
	`reason` text DEFAULT 'Ốm' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Chờ duyệt' NOT NULL,
	`created_by` integer NOT NULL,
	`reviewed_by` integer,
	`reviewed_at` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
