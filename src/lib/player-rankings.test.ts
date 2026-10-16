import { describe, expect, it } from "vitest";
import { parsePlayerRankings } from "@/lib/player-rankings";

function ranking(games = 20) {
  const wins = Math.min(14, games);
  return {
    name: "Alice",
    games,
    wins,
    rate: games ? (wins / games) * 100 : 0,
    rank: { code: 38, character_id: 0 },
    team: {
      ids: [0, 64],
      ranks: [38, 21],
      games: Math.min(12, games),
    },
  };
}

describe("parsePlayerRankings", () => {
  it("accepts a valid bounded ranking list", () => {
    expect(parsePlayerRankings([ranking()])).toEqual([
      {
        name: "Alice",
        games: 20,
        wins: 14,
        rate: 70,
        rank: { code: 38, characterId: 0 },
        team: { ids: [0, 64], ranks: [38, 21], games: 12 },
      },
    ]);
  });

  it("accepts players with fewer than 20 matches when they have a rank observation", () => {
    expect(parsePlayerRankings([ranking(3)])[0].games).toBe(3);
  });

  it("accepts its normalized response shape", () => {
    const parsed = parsePlayerRankings([ranking()]);
    expect(parsePlayerRankings(parsed)).toEqual(parsed);
  });

  it("rejects responses over the ten-player cap", () => {
    expect(() => parsePlayerRankings(Array.from({ length: 11 }, () => ranking()))).toThrow(
      /최대 10명/,
    );
  });

  it("rejects invalid win counts and malformed teams", () => {
    expect(() => parsePlayerRankings([{ ...ranking(), wins: 21 }])).toThrow(/경기·승리·승률/);
    expect(() =>
      parsePlayerRankings([{ ...ranking(), team: { ids: [1], games: 3 } }]),
    ).toThrow(/대표 조합/);
    expect(() =>
      parsePlayerRankings([
        { ...ranking(), team: { ...ranking().team, ranks: [43, null] } },
      ]),
    ).toThrow(/팀 캐릭터 계급/);
  });

  it("rejects a missing or out-of-range representative rank", () => {
    expect(() => parsePlayerRankings([{ ...ranking(), rank: undefined }])).toThrow();
    expect(() =>
      parsePlayerRankings([{ ...ranking(), rank: { code: 43, character_id: 0 } }]),
    ).toThrow(/대표 계급 코드/);
  });
});
