CREATE TABLE IF NOT EXISTS `class_teachers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `class_id` integer NOT NULL,
  `teacher_id` integer NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `class_teachers_unique` ON `class_teachers` (`class_id`,`teacher_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `class_teachers_teacher_idx` ON `class_teachers` (`teacher_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `class_teachers` (`class_id`,`teacher_id`)
SELECT `id`,`teacher_id` FROM `classes` WHERE `teacher_id` IS NOT NULL;
