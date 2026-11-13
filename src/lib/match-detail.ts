export const MATCH_FIGHTER_COUNT_FIELDS = [
  "throw_count",
  "thrown_count",
  "dodged_throw_count",
  "throw_dodged_count",
  "low_blow_count",
  "low_blowed_count",
  "dodged_low_blow_count",
  "low_blow_dodged_count",
  "counter_attack_count",
  "counter_attacked_count",
  "tag_assault_count",
  "tag_combo_count",
  "combo_hit_plain",
  "combo_hit_wall",
  "combo_hit_gimmick",
  "combo_hit_total",
] as const;

export const MATCH_FIGHTER_RATE_FIELDS = [
  "throw_success_rate",
  "throw_defense_rate",
  "low_blow_success_rate",
  "low_blow_defense_rate",
  "combo_hit_plain_rate",
  "combo_hit_wall_rate",
  "combo_hit_gimmick_rate",
] as const;

export type MatchFighterCountField = (typeof MATCH_FIGHTER_COUNT_FIELDS)[number];
export type MatchFighterRateField = (typeof MATCH_FIGHTER_RATE_FIELDS)[number];

export type MatchFighterDetail = {
  p1_p2: 1 | 2;
  main_sub: 1 | 2;
  character_id: number | null;
  player_name: string;
  opponent_name: string;
  is_win: boolean | null;
} & Record<MatchFighterCountField | MatchFighterRateField, number | null>;

export type MatchDetail = {
  id: string;
  p1_name: string;
  p2_name: string;
  p1_score: number | null;
  p2_score: number | null;
  winner: string | null;
  map_id: number | null;
  start_time: string | null;
  end_time: string | null;
  fighters: MatchFighterDetail[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new Error(`상세 데이터의 ${field} 값이 올바르지 않습니다.`);
  }
  return value;
}

function nullableString(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  return requiredString(value, field);
}

function nullableNumber(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`상세 데이터의 ${field} 값이 올바르지 않습니다.`);
  }
  return value;
}

function parseFighter(value: unknown, index: number): MatchFighterDetail {
  if (!isRecord(value)) {
    throw new Error(`상세 데이터의 ${index + 1}번째 파이터 형식이 올바르지 않습니다.`);
  }

  const p1p2 = value.p1_p2;
  const mainSub = value.main_sub;
  if (p1p2 !== 1 && p1p2 !== 2) {
    throw new Error(`상세 데이터의 ${index + 1}번째 p1_p2 값이 올바르지 않습니다.`);
  }
  if (mainSub !== 1 && mainSub !== 2) {
    throw new Error(`상세 데이터의 ${index + 1}번째 main_sub 값이 올바르지 않습니다.`);
  }

  const isWin = value.is_win;
  if (isWin !== null && isWin !== undefined && typeof isWin !== "boolean") {
    throw new Error(`상세 데이터의 ${index + 1}번째 승패 값이 올바르지 않습니다.`);
  }

  const counts = Object.fromEntries(
    MATCH_FIGHTER_COUNT_FIELDS.map((field) => [
      field,
      nullableNumber(value[field], field),
    ]),
  ) as Record<MatchFighterCountField, number | null>;
  const rates = Object.fromEntries(
    MATCH_FIGHTER_RATE_FIELDS.map((field) => [
      field,
      nullableNumber(value[field], field),
    ]),
  ) as Record<MatchFighterRateField, number | null>;

  return {
    p1_p2: p1p2,
    main_sub: mainSub,
    character_id: nullableNumber(value.character_id, "character_id"),
    player_name: requiredString(value.player_name, "player_name"),
    opponent_name: requiredString(value.opponent_name, "opponent_name"),
    is_win: isWin ?? null,
    ...counts,
    ...rates,
  };
}

export function parseMatchDetail(value: unknown): MatchDetail {
  if (!isRecord(value)) {
    throw new Error("경기 상세 데이터 형식이 올바르지 않습니다.");
  }
  if (!Array.isArray(value.fighters)) {
    throw new Error("경기 상세 데이터의 fighters 값이 올바르지 않습니다.");
  }

  const idValue = value.id;
  if (typeof idValue !== "string" && typeof idValue !== "number") {
    throw new Error("경기 상세 데이터의 id 값이 올바르지 않습니다.");
  }

  return {
    id: String(idValue),
    p1_name: requiredString(value.p1_name, "p1_name"),
    p2_name: requiredString(value.p2_name, "p2_name"),
    p1_score: nullableNumber(value.p1_score, "p1_score"),
    p2_score: nullableNumber(value.p2_score, "p2_score"),
    winner: nullableString(value.winner, "winner"),
    map_id: nullableNumber(value.map_id, "map_id"),
    start_time: nullableString(value.start_time, "start_time"),
    end_time: nullableString(value.end_time, "end_time"),
    fighters: value.fighters.map(parseFighter),
  };
}
