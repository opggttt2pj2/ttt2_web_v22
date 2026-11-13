export const PLAYER_COMBAT_COUNT_FIELDS = [
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

export const PLAYER_COMBAT_RATE_FIELDS = [
  "throw_success_rate",
  "throw_defense_rate",
  "low_blow_success_rate",
  "low_blow_defense_rate",
  "combo_hit_plain_rate",
  "combo_hit_wall_rate",
  "combo_hit_gimmick_rate",
] as const;

export type PlayerCombatCountField =
  (typeof PLAYER_COMBAT_COUNT_FIELDS)[number];
export type PlayerCombatRateField =
  (typeof PLAYER_COMBAT_RATE_FIELDS)[number];

export type CombatMetrics = Record<
  PlayerCombatCountField | PlayerCombatRateField,
  number | null
>;

export type PlayerCombatStatistics = {
  name: string;
  summary: {
    matches: number;
    wins: number;
    rate: number;
    stats_matches: number;
  };
  overall: CombatMetrics;
  character_count: number;
  characters_truncated: boolean;
  characters: Array<{
    character_id: number;
    matches: number;
    wins: number;
    rate: number;
    main_uses: number;
    sub_uses: number;
    stats: CombatMetrics;
  }>;
};

function record(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${context} 응답 형식이 올바르지 않습니다.`);
  }
  return value as Record<string, unknown>;
}

function integer(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${context} 값이 올바르지 않습니다.`);
  }
  return value;
}

function percentage(value: unknown, context: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(`${context} 값이 올바르지 않습니다.`);
  }
  return value;
}

function nullableCount(value: unknown, context: string): number | null {
  if (value === null) return null;
  return integer(value, context);
}

function nullablePercentage(value: unknown, context: string) {
  if (value === null) return null;
  return percentage(value, context);
}

function parseCombatMetrics(value: unknown, context: string): CombatMetrics {
  const payload = record(value, context);
  const counts = Object.fromEntries(
    PLAYER_COMBAT_COUNT_FIELDS.map((field) => [
      field,
      nullableCount(payload[field], `${context} ${field}`),
    ]),
  ) as Record<PlayerCombatCountField, number | null>;
  const rates = Object.fromEntries(
    PLAYER_COMBAT_RATE_FIELDS.map((field) => [
      field,
      nullablePercentage(payload[field], `${context} ${field}`),
    ]),
  ) as Record<PlayerCombatRateField, number | null>;

  return { ...counts, ...rates };
}

export function parsePlayerCombatStatistics(
  value: unknown,
): PlayerCombatStatistics {
  const payload = record(value, "플레이어 전투 통계");
  if (typeof payload.name !== "string" || !payload.name.trim()) {
    throw new Error("플레이어 전투 통계의 이름이 올바르지 않습니다.");
  }

  const summaryPayload = record(payload.summary, "전투 통계 요약");
  const matches = integer(summaryPayload.matches, "전체 경기 수");
  const wins = integer(summaryPayload.wins, "전체 승리 수");
  const statsMatches = integer(summaryPayload.stats_matches, "스탯 기록 경기 수");
  if (wins > matches || statsMatches > matches) {
    throw new Error("전투 통계 요약의 경기 수가 올바르지 않습니다.");
  }
  const summary = {
    matches,
    wins,
    rate: percentage(summaryPayload.rate, "전체 승률"),
    stats_matches: statsMatches,
  };

  if (!Array.isArray(payload.characters) || payload.characters.length > 100) {
    throw new Error("캐릭터별 전투 통계는 최대 100개여야 합니다.");
  }
  const characterCount = integer(payload.character_count, "캐릭터 통계 수");
  if (characterCount < payload.characters.length) {
    throw new Error("캐릭터 통계 개수가 응답보다 작습니다.");
  }
  if (typeof payload.characters_truncated !== "boolean") {
    throw new Error("캐릭터 통계 상한 정보가 올바르지 않습니다.");
  }
  if (
    payload.characters_truncated !==
    (characterCount > payload.characters.length)
  ) {
    throw new Error("캐릭터 통계 상한 정보가 응답과 일치하지 않습니다.");
  }

  const seenCharacterIds = new Set<number>();
  const characters = payload.characters.map((entry) => {
    const item = record(entry, "캐릭터별 전투 통계");
    const characterId = integer(item.character_id, "캐릭터 ID");
    if (seenCharacterIds.has(characterId)) {
      throw new Error("캐릭터별 전투 통계에 중복 캐릭터가 있습니다.");
    }
    seenCharacterIds.add(characterId);

    const characterMatches = integer(item.matches, "캐릭터 사용 경기 수");
    const characterWins = integer(item.wins, "캐릭터 승리 수");
    const mainUses = integer(item.main_uses, "메인 사용 횟수");
    const subUses = integer(item.sub_uses, "서브 사용 횟수");
    if (
      characterMatches === 0 ||
      characterWins > characterMatches ||
      mainUses + subUses < characterMatches
    ) {
      throw new Error("캐릭터 사용 경기 정보가 올바르지 않습니다.");
    }

    return {
      character_id: characterId,
      matches: characterMatches,
      wins: characterWins,
      rate: percentage(item.rate, "캐릭터 승률"),
      main_uses: mainUses,
      sub_uses: subUses,
      stats: parseCombatMetrics(item.stats, "캐릭터 스탯"),
    };
  });

  return {
    name: payload.name,
    summary,
    overall: parseCombatMetrics(payload.overall, "전체 스탯"),
    character_count: characterCount,
    characters_truncated: payload.characters_truncated,
    characters,
  };
}
