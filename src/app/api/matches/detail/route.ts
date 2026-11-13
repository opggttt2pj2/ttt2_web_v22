import { NextResponse } from "next/server";
import {
  SupabaseConfigurationError,
  callSupabaseRpc,
} from "@/lib/server/supabase-rpc";
import { parseMatchDetail } from "@/lib/match-detail";

const POSTGRES_BIGINT_MAX = BigInt("9223372036854775807");

function parseMatchId(value: string | null) {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;

  try {
    const id = BigInt(value);
    return id <= POSTGRES_BIGINT_MAX ? value : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const matchId = parseMatchId(url.searchParams.get("id"));
  if (!matchId) {
    return NextResponse.json(
      { warning: "경기 ID는 양의 정수여야 합니다." },
      { status: 400 },
    );
  }

  try {
    const payload = await callSupabaseRpc("get_match_detail", {
      p_match_id: matchId,
    });
    if (payload === null) {
      return NextResponse.json(
        { warning: "해당 경기 기록을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json(parseMatchDetail(payload), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json({ warning: error.message }, { status: 503 });
    }
    console.error("Supabase match detail RPC failed:", error);
    return NextResponse.json(
      { warning: "경기 상세 정보를 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
