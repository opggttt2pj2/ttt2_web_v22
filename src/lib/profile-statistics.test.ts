import { describe, expect, it } from "vitest";
import {
  parsePlayerNameSuggestions,
  parseProfileStatistics,
} from "@/lib/profile-statistics";

function rivalStats() {
  return {
    throw_attempts: 12,
    throw_success_rate: 58.3,
    throw_defense_attempts: 9,
    throw_defense_rate: 66.7,
    low_blow_attempts: 7,
    low_blow_success_rate: 42.9,
    low_blow_defense_attempts: 5,
    low_blow_defense_rate: 80,
  };
}

function payload(): {
  name: string;
  summary: {
    games: number;
    wins: number;
    losses: number;
    rate: number;
    playSeconds: number;
    lastAccess: string | null;
  };
  teams: Array<{ ids: [number, number]; games: number; wins: number; rate: number }>;
  maps: Array<{ id: number; games: number; wins: number; rate: number }>;
  rivals: Array<{
    name: string;
    games: number;
    wins: number;
    lastPlayed: string | null;
    stats: {
      throw_attempts: number | null;
      throw_success_rate: number | null;
      throw_defense_attempts: number | null;
      throw_defense_rate: number | null;
      low_blow_attempts: number | null;
      low_blow_success_rate: number | null;
      low_blow_defense_attempts: number | null;
      low_blow_defense_rate: number | null;
    } | null;
  }>;
  selectedRival: {
    name: string;
    games: number;
    wins: number;
    rate: number;
    stats: {
      throw_attempts: number | null;
      throw_success_rate: number | null;
      throw_defense_attempts: number | null;
      throw_defense_rate: number | null;
      low_blow_attempts: number | null;
      low_blow_success_rate: number | null;
      low_blow_defense_attempts: number | null;
      low_blow_defense_rate: number | null;
    } | null;
  } | null;
  trend: {
    timezone: "Asia/Seoul";
    dates: string[];
    daily: Array<[number, number]>;
    throw_defense_rates: Array<number | null>;
    throw_defense_period_rates: {
      today: number | null;
      last_7_days: number | null;
      last_30_days: number | null;
    };
    teams: Array<{
      ids: [number, number];
      daily: Array<[number, number]>;
      throw_defense_rates: Array<number | null>;
      throw_defense_period_rates: {
        today: number | null;
        last_7_days: number | null;
        last_30_days: number | null;
      };
    }>;
  };
} {
  const dates = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 8, 1 + index));
    return date.toISOString().slice(0, 10);
  });
  const daily = dates.map((_, index): [number, number] =>
    index === 29 ? [2, 1] : [0, 0],
  );
  const throwDefenseRates = dates.map((_, index) => (index === 29 ? 75 : null));
  return {
    name: "Alice",
    summary: {
      games: 25,
      wins: 15,
      losses: 10,
      rate: 60,
      playSeconds: 3600,
      lastAccess: "2026-09-30T10:00:00.000Z",
    },
    teams: [{ ids: [0, 64], games: 12, wins: 8, rate: 66.6666666667 }],
    maps: [{ id: 0, games: 10, wins: 6, rate: 60 }],
    rivals: [
      {
        name: "Bob",
        games: 8,
        wins: 5,
        lastPlayed: "2026-09-29T10:00:00.000Z",
        stats: rivalStats(),
      },
    ],
    selectedRival: { name: "Bob", games: 8, wins: 5, rate: 62.5, stats: rivalStats() },
    trend: {
      timezone: "Asia/Seoul",
      dates,
      daily,
      throw_defense_rates: [...throwDefenseRates],
      throw_defense_period_rates: {
        today: 50,
        last_7_days: 75,
        last_30_days: 66.7,
      },
      teams: [
        {
          ids: [0, 64],
          daily,
          throw_defense_rates: [...throwDefenseRates],
          throw_defense_period_rates: {
            today: 50,
            last_7_days: 75,
            last_30_days: 66.7,
          },
        },
      ],
    },
  };
}

describe("parseProfileStatistics", () => {
  it("accepts a valid bounded profile response", () => {
    expect(parseProfileStatistics(payload())).toMatchObject({
      name: "Alice",
      summary: { games: 25, wins: 15, losses: 10, rate: 60 },
      teams: [{ ids: [0, 64], games: 12 }],
      maps: [{ id: 0, games: 10 }],
      rivals: [
        {
          name: "Bob",
          games: 8,
          wins: 5,
          stats: { throw_attempts: 12, throw_success_rate: 58.3, low_blow_defense_rate: 80 },
        },
      ],
      trend: {
        timezone: "Asia/Seoul",
        dates: expect.arrayContaining(["2026-09-30"]),
        throw_defense_rates: expect.arrayContaining([75, null]),
        throw_defense_period_rates: {
          today: 50,
          last_7_days: 75,
          last_30_days: 66.7,
        },
        teams: [
          {
            ids: [0, 64],
            throw_defense_rates: expect.arrayContaining([75, null]),
            throw_defense_period_rates: {
              today: 50,
              last_7_days: 75,
              last_30_days: 66.7,
            },
          },
        ],
      },
    });
  });

  it("rejects a summary whose wins and losses do not add up", () => {
    const value = payload();
    value.summary.losses = 9;
    expect(() => parseProfileStatistics(value)).toThrow(/프로필 요약 값/);
  });

  it("rejects too many team, map, or rival results", () => {
    const value = payload();
    value.teams = Array.from({ length: 6 }, () => payload().teams[0]);
    expect(() => parseProfileStatistics(value)).toThrow(/주력 조합/);

    const mapValue = payload();
    mapValue.maps = Array.from({ length: 51 }, (_, id) => ({
      id,
      games: 1,
      wins: 1,
      rate: 100,
    }));
    expect(() => parseProfileStatistics(mapValue)).toThrow(/맵 전적 응답/);

    const rivalValue = payload();
    rivalValue.rivals = Array.from({ length: 6 }, () => payload().rivals[0]);
    expect(() => parseProfileStatistics(rivalValue)).toThrow(/최근 상대/);
  });

  it("accepts empty profiles and null selected opponents", () => {
    const value = payload();
    value.summary = {
      games: 0,
      wins: 0,
      losses: 0,
      rate: 0,
      playSeconds: 0,
      lastAccess: null,
    };
    value.teams = [];
    value.maps = [];
    value.rivals = [];
    value.selectedRival = null;
    value.trend.daily = value.trend.daily.map(() => [0, 0]);
    value.trend.throw_defense_rates = value.trend.throw_defense_rates.map(() => null);
    value.trend.throw_defense_period_rates = {
      today: null,
      last_7_days: null,
      last_30_days: null,
    };
    value.trend.teams = [];
    expect(parseProfileStatistics(value)).toMatchObject({
      summary: { games: 0 },
      trend: { teams: [] },
    });
  });

  it("accepts null rival combat stats and rejects out-of-range rates", () => {
    const withoutStats = payload();
    withoutStats.rivals[0].stats = null;
    withoutStats.selectedRival!.stats = null;
    expect(parseProfileStatistics(withoutStats)).toMatchObject({
      rivals: [{ name: "Bob", stats: null }],
      selectedRival: { name: "Bob", stats: null },
    });

    const badRate = payload();
    badRate.rivals[0].stats!.throw_success_rate = 120;
    expect(() => parseProfileStatistics(badRate)).toThrow(/최근 상대 전투 스탯 잡기 성공률/);
  });

  it("rejects incomplete or inconsistent trend data", () => {
    const noTrend = payload();
    delete (noTrend as Partial<typeof noTrend>).trend;
    expect(() => parseProfileStatistics(noTrend)).toThrow(/경기력 추세 응답/);

    const badDaily = payload();
    badDaily.trend.daily[0] = [1, 2];
    expect(() => parseProfileStatistics(badDaily)).toThrow(/승리 수가 경기 수보다 큽니다/);

    const wrongWindow = payload();
    wrongWindow.trend.dates.pop();
    expect(() => parseProfileStatistics(wrongWindow)).toThrow(/날짜는 30일/);

    const wrongRateWindow = payload();
    wrongRateWindow.trend.throw_defense_rates.pop();
    expect(() => parseProfileStatistics(wrongRateWindow)).toThrow(/전체 잡기 풀기 성공률 추세/);

    const invalidTeamRate = payload();
    invalidTeamRate.trend.teams[0].throw_defense_rates[0] = 101;
    expect(() => parseProfileStatistics(invalidTeamRate)).toThrow(/팀 조합 잡기 풀기 성공률 추세/);

    const invalidPeriodRate = payload();
    invalidPeriodRate.trend.throw_defense_period_rates.last_7_days = 101;
    expect(() => parseProfileStatistics(invalidPeriodRate)).toThrow(/전체 기간별 잡기 풀기 성공률/);
  });
});

describe("parsePlayerNameSuggestions", () => {
  it("accepts up to ten names and rejects oversized results", () => {
    expect(parsePlayerNameSuggestions(["Alice"])).toEqual(["Alice"]);
    expect(() => parsePlayerNameSuggestions(Array.from({ length: 11 }, (_, i) => `P${i}`))).toThrow(
      /최대 10개/,
    );
  });
});
