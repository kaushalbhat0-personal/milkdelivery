DROP INDEX "stops_route_order_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "stops_route_sort_uniq" ON "route_stops" USING btree ("route_id","sort_order");