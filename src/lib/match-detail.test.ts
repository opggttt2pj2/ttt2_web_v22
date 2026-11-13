import { describe, expect, it } from "vitest";
import { parseMatchDetail } from "@/lib/match-detail";

function fighter(p1p2: 1 | 2, mainSub: 1 | 2) {
  return {
    p1_p2: p1p2,
    main_sub: mainSub,
    character_id: 4,
    player_name: p1p2 === 1 ? "Player 1" : "Player 2",
    opponent_name: p1p2 === 1 ? "Player 2" : "Player 1",
    is_win: p1p2 === 1,
    throw_count: 0,
    thrown_count: 0,
    dodged_throw_count: 0,
    throw_dodged_count: 0,
    low_blow_count: 0,
    low_blowed_count: 0,
    dodged_low_blow_count: 0,
    low_blow_dodged_count: 0,
    counter_attack_count: 0,
    counter_attacked_count: 0,
    tag_assault_count: 0,
    tag_combo_count: 0,
    combo_hit_plain: 0,
    combo_hit_wall: 0,
    combo_hit_gimmick: 0,
    combo_hit_total: 0,
    throw_success_rate: null,
    throw_defense_rate: null,
    low_blow_success_rate: null,
    low_blow_defense_rate: null,
    combo_hit_plain_rate: null,
    combo_hit_wall_rate: null,
    combo_hit_gimmick_rate: null,
  };
}

describe("parseMatchDetail", () => {
  it("preserves match and fighter details, including undefined rates", () => {
    const result = parseMatchDetail({
      id: "560",
      p1_name: "Player 1",
      p2_name: "Player 2",
      p1_score: 3,
      p2_score: 0,
      winner: "Player 1",
      map_id: 10,
      start_time: "2026-11-12T21:23:44+00:00",
      end_time: "2026-11-12T21:24:11+00:00",
      fighters: [
        fighter(1, 1),
        fighter(1, 2),
        fighter(2, 1),
        fighter(2, 2),
      ],
    });

    expect(result.id).toBe("560");
    expect(result.fighters).toHaveLength(4);
    expect(result.fighters[0]).toMatchObject({
      p1_p2: 1,
      main_sub: 1,
      is_win: true,
      throw_count: 0,
      throw_success_rate: null,
    });
  });

  it("rejects malformed fighter slots", () => {
    expect(() =>
      parseMatchDetail({
        id: "560",
        p1_name: "Player 1",
        p2_name: "Player 2",
        fighters: [{ ...fighter(1, 1), main_sub: 3 }],
      }),
    ).toThrow("main_sub");
  });

  it("keeps solo matches to their main fighters without inventing subs", () => {
    const result = parseMatchDetail({
      id: "561",
      p1_name: "Solo 1",
      p2_name: "Solo 2",
      p1_score: 3,
      p2_score: 0,
      winner: "Solo 1",
      map_id: 10,
      start_time: null,
      end_time: null,
      fighters: [fighter(1, 1), fighter(2, 1)],
    });

    expect(result.fighters.map(({ p1_p2, main_sub }) => [p1_p2, main_sub])).toEqual([
      [1, 1],
      [2, 1],
    ]);
  });
});
