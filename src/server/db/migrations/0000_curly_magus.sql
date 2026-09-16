CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`name` text NOT NULL,
	`sector` text NOT NULL,
	`hq_location` text DEFAULT '—' NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `firms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`reporting_currency` text DEFAULT 'USD' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `funds` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`name` text NOT NULL,
	`vintage_year` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`commitment` text NOT NULL,
	`strategy` text DEFAULT 'Venture' NOT NULL,
	`inception_date` text NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `funds_firm_idx` ON `funds` (`firm_id`);--> statement-breakpoint
CREATE TABLE `investment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`investment_id` text NOT NULL,
	`kind` text NOT NULL,
	`amount` text NOT NULL,
	`event_date` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`investment_id`) REFERENCES `investments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `investment_events_investment_idx` ON `investment_events` (`investment_id`);--> statement-breakpoint
CREATE TABLE `investments` (
	`id` text PRIMARY KEY NOT NULL,
	`fund_id` text NOT NULL,
	`company_id` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`entry_stage` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`entry_date` text NOT NULL,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `investments_fund_idx` ON `investments` (`fund_id`);--> statement-breakpoint
CREATE INDEX `investments_company_idx` ON `investments` (`company_id`);