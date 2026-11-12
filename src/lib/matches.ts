export type Match = {
  id: string;
  p1Name: string;
  p2Name: string;
  winner: string;
  p1Score: number;
  p2Score: number;
  // 솔로 플레이(서브 없음)는 길이 1, 태그 플레이는 길이 2 배열이다.
  p1Characters: number[];
  p2Characters: number[];
  p1CharacterRanks: (number | null)[];
  p2CharacterRanks: (number | null)[];
  mapId: number | null;
  playedAt: string;
  startAt: string | null;
  endAt: string | null;
  createdAt: string | null;
};

export function normalizeMatch(row: Record<string, unknown>, index: number): Match | null {
  const p1Name = String(row.p1_name ?? row.player1 ?? row.player_1 ?? "").trim();
  const p2Name = String(row.p2_name ?? row.player2 ?? row.player_2 ?? "").trim();
  if (!p1Name || !p2Name) return null;

  const winner = String(row.winner ?? row.winner_name ?? "").trim();
  const asNumber = (value: unknown, fallback: number) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;
  // 서브 캐릭터는 없는 경우(솔로 플레이)가 있으므로 null을 그대로 보존한다.
  const asCharacterId = (value: unknown): number | null =>
    value === null || value === undefined || value === "" ? null : asNumber(value, 0);
  const asRank = (value: unknown, field: string): number | null => {
    if (value === null || value === undefined) return null;
    const rank = Number(value);
    if (!Number.isInteger(rank) || rank < 0 || rank > 42) {
      throw new Error(`대전 데이터의 ${field} 계급 코드가 올바르지 않습니다.`);
    }
    return rank;
  };
  const asTimestamp = (value: unknown) =>
    typeof value === "string" && value.length ? value : null;

  const startAt = asTimestamp(row.start_time);
  const endAt = asTimestamp(row.end_time);
  const createdAt = asTimestamp(row.created_at);
  const playedAt = endAt ?? createdAt ?? asTimestamp(row.played_at) ?? "";
  const mapValue = row.map_id ?? row.stage_id;
  const mapId =
    mapValue === null || mapValue === undefined || mapValue === ""
      ? null
      : asNumber(mapValue, -1);

  const p1SubId = asCharacterId(row.p1_sub_character_id);
  const p2SubId = asCharacterId(row.p2_sub_character_id);

  return {
    id: String(row.id ?? row.match_id ?? `remote-${index}`),
    p1Name,
    p2Name,
    winner,
    p1Score: asNumber(row.p1_score ?? row.player1_score, 0),
    p2Score: asNumber(row.p2_score ?? row.player2_score, 0),
    p1Characters:
      p1SubId === null
        ? [asNumber(row.p1_main_character_id, 0)]
        : [asNumber(row.p1_main_character_id, 0), p1SubId],
    p2Characters:
      p2SubId === null
        ? [asNumber(row.p2_main_character_id, 0)]
        : [asNumber(row.p2_main_character_id, 0), p2SubId],
    p1CharacterRanks:
      p1SubId === null
        ? [asRank(row.p1_main_character_rank, "p1_main_character_rank")]
        : [
            asRank(row.p1_main_character_rank, "p1_main_character_rank"),
            asRank(row.p1_sub_character_rank, "p1_sub_character_rank"),
          ],
    p2CharacterRanks:
      p2SubId === null
        ? [asRank(row.p2_main_character_rank, "p2_main_character_rank")]
        : [
            asRank(row.p2_main_character_rank, "p2_main_character_rank"),
            asRank(row.p2_sub_character_rank, "p2_sub_character_rank"),
          ],
    mapId: mapId === -1 ? null : mapId,
    playedAt,
    startAt,
    endAt,
    createdAt,
  };
}

export function playerNames(matches: Match[]) {
  return [...new Set(matches.flatMap((match) => [match.p1Name, match.p2Name]))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function isWinner(match: Match, name: string) {
  return match.winner.toLowerCase() === name.toLowerCase();
}

// 솔로 플레이(길이 1)와 옛 방식의 "메인==서브" 중복을 하나의 초상화로 합친다.
export function uniqueCharacterIds(ids: number[]): number[] {
  return [...new Set(ids)];
}

export function normalizeTeamOrder(ids: number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

// 캐릭터 ID는 게임 native 로스터 id 기준이다(roster_native.json).
// 표시 이름은 기존 한글 표기를 유지하되 키만 native id로 맞췄다.
// 49(Combot)은 랭매 사용 금지라 제외(이미지도 없음).
export const characterNames: Record<number, string> = {
  0: "폴",
  1: "로우",
  2: "레이",
  3: "킹",
  4: "요시미츠",
  5: "니나",
  6: "화랑",
  7: "샤오유",
  8: "크리스티",
  9: "진",
  10: "제이씨",
  11: "쿠마",
  12: "브라이언",
  13: "헤이하치",
  14: "카즈야",
  15: "리",
  16: "스티브",
  17: "머덕",
  18: "모쿠진",
  19: "잭",
  20: "로저",
  21: "안나",
  22: "왕 진레이",
  23: "간류",
  24: "아스카",
  25: "브루스",
  26: "백두산",
  27: "데빌진",
  28: "레이븐",
  29: "펭",
  30: "아머킹",
  31: "리리",
  32: "드라구노프",
  33: "에디",
  34: "밥",
  35: "자피나",
  36: "미겔",
  37: "레오",
  38: "라스",
  39: "알리사",
  40: "진파치",
  41: "트루오거",
  42: "준",
  43: "팬더",
  44: "언노운",
  45: "쿠니미츠",
  46: "슬림 밥",
  47: "포레스트 로우",
  48: "미하루",
  50: "엔젤",
  51: "미셸",
  52: "피잭",
  53: "알렉스",
  54: "방패 오거",
  55: "바이올렛",
  56: "닥터",
  57: "세바스찬",
  58: "타이거",
};

export const mapNames: Record<number, string> = {
  0: "Arena",
  1: "Festive Parade",
  2: "Eternal Paradise",
  3: "Historic Town Square",
  4: "Condor Canyon",
  5: "Arctic Dream",
  6: "Dusk after the Rain",
  7: "Bountiful Sea",
  8: "Moonlit Wilderness",
  9: "Wayang Kulit",
  10: "Fontana di Trevi",
  11: "Sakura Schoolyard",
  12: "Tempest",
  13: "Winter Palace",
  14: "Hall of Judgement",
  15: "Naraku",
  16: "Heavenly Garden",
  17: "Fallen Garden",
  25: "Strategic Space",
  40: "Fireworks Over Barcelona",
  41: "Coastline Sunset",
  42: "Riverside Promenade",
  43: "Tropical Rainforest",
  44: "Moai Excavation",
  45: "Extravagant Underground",
  46: "Tulip Festival",
  47: "Modern Oasis",
  48: "Snoop Dogg",
  50: "Odeum of Illusions",
};

export function characterLabel(id: number) {
  return characterNames[id] ?? "알 수 없는 캐릭터";
}

export function mapLabel(id: number | null) {
  if (id === null) return "Map unavailable";
  return mapNames[id] ?? `Unknown Map (${id})`;
}
