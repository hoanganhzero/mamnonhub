ALTER TABLE `classes` ADD `mascot` text DEFAULT '🌻' NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `motto` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `intro` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `cover_key` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `theme` text DEFAULT 'mint' NOT NULL;