CREATE TABLE `child_guardians` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`child_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`relation` text DEFAULT '' NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `child_guardians_unique` ON `child_guardians` (`child_id`,`user_id`);--> statement-breakpoint
INSERT INTO `child_guardians` (`child_id`, `user_id`, `is_primary`)
SELECT `id`, `parent_user_id`, 1 FROM `children`
WHERE `parent_user_id` IS NOT NULL;
