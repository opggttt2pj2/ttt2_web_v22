export type ProfileStatistics = {
  name: string;
  summary: {
    games: number;
    wins: number;
    losses: number;
    rate: number;
    playSeconds: number;
    lastAccess: string | null;
  };
  teams: Array<{
    ids: [number, number];
    games: number;
    wins: number;
    rate: number;
  }>;
  maps: Array<{ id: number; games: number; wins: number; rate: number }>;
  rivals: Array<{
    name: string;
    games: number;
    wins: number;
    lastPlayed: string | null;
  }>;
  selectedRival: {
    name: string;
    games: number;
    wins: number;
    rate: number;
  } | null;
  trend: {
    timezone: "Asia/Seoul";
    dates: string[];
    daily: Array<[number, number]>;
    teams: Array<{ ids: [number, number]; daily: Array<[number, number]> }>;
  };
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
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${context} 값이 올바르지 않습니다.`);
  }
  return value;
}

function timestamp(value: unknown, context: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${context} 값이 올바르지 않습니다.`);
  }
  return value;
}

function parseMatchCounts(value: Record<string, unknown>, context: string) {
  const games = integer(value.games, `${context} 경기 수`);
  const wins = integer(value.wins, `${context} 승리 수`);
  if (wins > games) throw new Error(`${context} 승리 수가 경기 수보다 큽니다.`);
  return { games, wins };
}

function parseDailyCounts(value: unknown, context: string): [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`${context} 값이 올바르지 않습니다.`);
  }
  const games = integer(value[0], `${context} 경기 수`);
  const wins = integer(value[1], `${context} 승리 수`);
  if (wins > games) throw new Error(`${context} 승리 수가 경기 수보다 큽니다.`);
  return [games, wins];
}

function parseProfileTrend(value: unknown): ProfileStatistics["trend"] {
  const trend = record(value, "경기력 추세");
  if (trend.timezone !== "Asia/Seoul") {
    throw new Error("경기력 추세 시간대가 올바르지 않습니다.");
  }
  if (!Array.isArray(trend.dates) || trend.dates.length !== 30) {
    throw new Error("경기력 추세 날짜는 30일이어야 합니다.");
  }
  let previousDate = "";
  const dates = trend.dates.map((date) => {
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
      (previousDate !== "" && date <= previousDate)
    ) {
      throw new Error("경기력 추세 날짜 값이 올바르지 않습니다.");
    }
    previousDate = date;
    return date;
  });
  if (!Array.isArray(trend.daily) || trend.daily.length !== dates.length) {
    throw new Error("전체 경기력 추세 데이터가 올바르지 않습니다.");
  }
  const daily = trend.daily.map((entry, index) =>
    parseDailyCounts(entry, `전체 경기력 추세 ${dates[index]}`),
  );

  if (!Array.isArray(trend.teams)) {
    throw new Error("팀 조합 경기력 추세 응답이 올바르지 않습니다.");
  }
  const teamIds = new Set<string>();
  const teams = trend.teams.map((entry) => {
    const item = record(entry, "팀 조합 경기력 추세");
    if (!Array.isArray(item.ids) || item.ids.length !== 2) {
      throw new Error("팀 조합 경기력 추세 캐릭터 값이 올바르지 않습니다.");
    }
    const ids: [number, number] = [
      integer(item.ids[0], "팀 조합 경기력 추세 캐릭터 ID"),
      integer(item.ids[1], "팀 조합 경기력 추세 캐릭터 ID"),
    ];
    if (ids[0] > ids[1]) {
      throw new Error("팀 조합 경기력 추세 캐릭터 순서가 올바르지 않습니다.");
    }
    const key = `${ids[0]}:${ids[1]}`;
    if (teamIds.has(key)) {
      throw new Error("팀 조합 경기력 추세에 중복 조합이 있습니다.");
    }
    teamIds.add(key);
    if (!Array.isArray(item.daily) || item.daily.length !== dates.length) {
      throw new Error("팀 조합 경기력 추세 데이터가 올바르지 않습니다.");
    }
    const teamDaily = item.daily.map((point, index) =>
      parseDailyCounts(point, `팀 조합 경기력 추세 ${dates[index]}`),
    );
    if (!teamDaily.some(([games]) => games > 0)) {
      throw new Error("팀 조합 경기력 추세에 경기 기록이 없습니다.");
    }
    return { ids, daily: teamDaily };
  });

  return { timezone: "Asia/Seoul", dates, daily, teams };
}

export function parseProfileStatistics(value: unknown): ProfileStatistics {
  const payload = record(value, "프로필 통계");
  if (typeof payload.name !== "string" || !payload.name.trim()) {
    throw new Error("프로필 이름 값이 올바르지 않습니다.");
  }
  const summaryValue = record(payload.summary, "프로필 요약");
  const { games, wins } = parseMatchCounts(summaryValue, "프로필 요약");
  const losses = integer(summaryValue.losses, "프로필 패배 수");
  const playSeconds = summaryValue.playSeconds;
  if (
    losses !== games - wins ||
    typeof playSeconds !== "number" ||
    !Number.isFinite(playSeconds) ||
    playSeconds < 0
  ) {
    throw new Error("프로필 요약 값이 올바르지 않습니다.");
  }
  const summary = {
    games,
    wins,
    losses,
    rate: percentage(summaryValue.rate, "프로필 승률"),
    playSeconds,
    lastAccess: timestamp(summaryValue.lastAccess, "마지막 접속 시각"),
  };

  if (!Array.isArray(payload.teams) || payload.teams.length > 5) {
    throw new Error("주력 조합 응답은 최대 5개여야 합니다.");
  }
  const teams = payload.teams.map((entry) => {
    const item = record(entry, "주력 조합");
    if (!Array.isArray(item.ids) || item.ids.length !== 2) {
      throw new Error("주력 조합 캐릭터 값이 올바르지 않습니다.");
    }
    const ids: [number, number] = [
      integer(item.ids[0], "캐릭터 ID"),
      integer(item.ids[1], "캐릭터 ID"),
    ];
    const counts = parseMatchCounts(item, "주력 조합");
    if (counts.games === 0) throw new Error("주력 조합은 경기 수가 1 이상이어야 합니다.");
    return { ids, ...counts, rate: percentage(item.rate, "주력 조합 승률") };
  });

  if (!Array.isArray(payload.maps) || payload.maps.length > 50) {
    throw new Error("맵 전적 응답은 최대 50개여야 합니다.");
  }
  const maps = payload.maps.map((entry) => {
    const item = record(entry, "맵 전적");
    const id = integer(item.id, "맵 ID");
    const counts = parseMatchCounts(item, "맵 전적");
    if (counts.games === 0) throw new Error("맵 전적은 경기 수가 1 이상이어야 합니다.");
    return { id, ...counts, rate: percentage(item.rate, "맵 승률") };
  });

  if (!Array.isArray(payload.rivals) || payload.rivals.length > 5) {
    throw new Error("최근 상대 응답은 최대 5명이어야 합니다.");
  }
  const rivals = payload.rivals.map((entry) => {
    const item = record(entry, "최근 상대");
    if (typeof item.name !== "string" || !item.name.trim()) {
      throw new Error("최근 상대 이름이 올바르지 않습니다.");
    }
    const counts = parseMatchCounts(item, "최근 상대");
    if (counts.games === 0) throw new Error("최근 상대 경기 수가 올바르지 않습니다.");
    return {
      name: item.name,
      ...counts,
      lastPlayed: timestamp(item.lastPlayed, "최근 상대 경기 시각"),
    };
  });

  let selectedRival: ProfileStatistics["selectedRival"] = null;
  if (payload.selectedRival !== null) {
    const item = record(payload.selectedRival, "선택 상대 전적");
    if (typeof item.name !== "string" || !item.name.trim()) {
      throw new Error("선택 상대 이름이 올바르지 않습니다.");
    }
    const counts = parseMatchCounts(item, "선택 상대 전적");
    selectedRival = {
      name: item.name,
      ...counts,
      rate: percentage(item.rate, "선택 상대 승률"),
    };
  }

  const trend = parseProfileTrend(payload.trend);

  return { name: payload.name, summary, teams, maps, rivals, selectedRival, trend };
}

export function parsePlayerNameSuggestions(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 10) {
    throw new Error("플레이어 이름 제안은 최대 10개여야 합니다.");
  }
  return value.map((name) => {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("플레이어 이름 제안 응답이 올바르지 않습니다.");
    }
    return name;
  });
}
