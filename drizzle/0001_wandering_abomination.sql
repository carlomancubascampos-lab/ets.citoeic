CREATE INDEX `idx_payment_methods_active_sort` ON `payment_methods` (`active`,`sort_order`,`id`);--> statement-breakpoint
CREATE INDEX `idx_products_active_sort` ON `products` (`active`,`sort_order`,`id`);--> statement-breakpoint
CREATE INDEX `idx_recharges_client_id` ON `recharges` (`client_id`,`id`);