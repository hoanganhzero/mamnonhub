CREATE TABLE `assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`period` text NOT NULL,
	`physical` text DEFAULT '' NOT NULL,
	`cognitive` text DEFAULT '' NOT NULL,
	`language` text DEFAULT '' NOT NULL,
	`social` text DEFAULT '' NOT NULL,
	`aesthetic` text DEFAULT '' NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`teacher_id` integer,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_child_period_unique` ON `assessments` (`child_id`,`period`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer,
	`actor_id` integer NOT NULL,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` integer,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity`,`entity_id`);--> statement-breakpoint
CREATE TABLE `fee_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`tuition_monthly` integer DEFAULT 0 NOT NULL,
	`meal_per_day` integer DEFAULT 0 NOT NULL,
	`other_fee` integer DEFAULT 0 NOT NULL,
	`other_label` text DEFAULT 'Phí khác' NOT NULL,
	`bank_code` text DEFAULT '' NOT NULL,
	`bank_account` text DEFAULT '' NOT NULL,
	`bank_holder` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fee_settings_school_unique` ON `fee_settings` (`school_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`month` text NOT NULL,
	`tuition` integer DEFAULT 0 NOT NULL,
	`meal_days` integer DEFAULT 0 NOT NULL,
	`meal_per_day` integer DEFAULT 0 NOT NULL,
	`other_fee` integer DEFAULT 0 NOT NULL,
	`other_label` text DEFAULT '' NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Chưa đóng' NOT NULL,
	`paid_at` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_child_month_unique` ON `invoices` (`child_id`,`month`);--> statement-breakpoint
CREATE TABLE `pickup_notices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`date` text NOT NULL,
	`person_name` text NOT NULL,
	`relation` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`expected_time` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pickup_notices_date_idx` ON `pickup_notices` (`date`,`child_id`);--> statement-breakpoint
CREATE TABLE `pickup_persons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`name` text NOT NULL,
	`relation` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
