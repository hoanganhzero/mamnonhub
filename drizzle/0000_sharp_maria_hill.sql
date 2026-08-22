CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`audience` text DEFAULT 'Phụ huynh lớp Lá 1' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `children` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`class_name` text DEFAULT 'Lá 1' NOT NULL,
	`birth_date` text DEFAULT '2021-01-01' NOT NULL,
	`guardian` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`allergy` text DEFAULT 'Không' NOT NULL,
	`status` text DEFAULT 'Đã đến' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
