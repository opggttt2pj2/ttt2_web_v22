import { NextResponse } from "next/server";
import {
  callSupabaseRpc,
  SupabaseConfigurationError,
} from "@/lib/server/supabase-rpc";
import { parsePlayerCombatStatistics } from "@/lib/player-combat-statistics";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const playerName = url.searchParams.get("name")?.trim() ?? "";
  if (!playerName || playerName.length > 100) {
    return NextResponse.json(
      { warning: "플레이어 이름은 1~100자여야 합니다." },
      { status: 400 },
    );
  }

  try {
    const payload = await callSupabaseRpc("get_player_combat_statistics", {
      p_player_name: playerName,
    });
    const statistics = parsePlayerCombatStatistics(payload);
    return NextResponse.json(statistics, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json({ warning: error.message }, { status: 503 });
    }
    console.error("Supabase player combat statistics RPC failed:", error);
    return NextResponse.json(
      { warning: "플레이어 전투 스탯을 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
