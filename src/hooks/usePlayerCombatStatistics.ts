"use client";

import { useCachedApi } from "@/hooks/useCachedApi";
import { playerCombatStatisticsRequest } from "@/lib/client-data-requests";

export function usePlayerCombatStatistics(name: string) {
  return useCachedApi(playerCombatStatisticsRequest(name));
}
