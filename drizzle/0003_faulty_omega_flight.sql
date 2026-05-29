DROP INDEX "stops_route_customer_uniq";--> statement-breakpoint
CREATE INDEX "stops_tenant_route_idx" ON "route_stops" USING btree ("tenant_id","route_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stops_route_customer_uniq" ON "route_stops" USING btree ("route_id","customer_id");