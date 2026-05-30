"use server";

import { getSession } from "@/lib/session";
import * as service from "./service";
import type { OptimizeRouteInput, OptimizeRouteResult } from "./types";

export async function optimizeRouteAction(
  input: OptimizeRouteInput
): Promise<OptimizeRouteResult> {
  const session = await getSession();
  return service.optimizeRoute(session, input);
}
