CREATE TABLE `schools` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`academic_year` text DEFAULT '2026–2027' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_code_unique` ON `schools` (`code`);--> statement-breakpoint
INSERT INTO `schools` (`code`,`name`,`academic_year`,`status`) VALUES ('HOANANG','Trường Mầm non Hoa Nắng','2026–2027','active');--> statement-breakpoint
ALTER TABLE `announcements` ADD `school_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `school_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `school_id` integer;--> statement-breakpoint
UPDATE `users` SET `school_id` = 1 WHERE `role` != 'superadmin';
