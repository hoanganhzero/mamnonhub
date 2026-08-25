ALTER TABLE `fee_settings` ADD `items_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `items_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `menus` ADD `breakfast_photo_key` text;--> statement-breakpoint
ALTER TABLE `menus` ADD `lunch_photo_key` text;--> statement-breakpoint
ALTER TABLE `menus` ADD `snack_photo_key` text;