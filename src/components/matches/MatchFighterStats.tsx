import { CharacterImage } from "@/components/matches/CharacterImage";
import { MatchStatGroup } from "@/components/matches/MatchStatGroup";
import { sumNullableCounts } from "@/lib/combat-statistics";
import type { MatchFighterDetail } from "@/lib/match-detail";

export function MatchFighterStats({
  fighter,
}: {
  fighter: MatchFighterDetail;
}) {
  return (
    <article className="rounded-xl border border-[var(--line)] bg-[rgba(12,21,32,0.55)] p-3">
      <header className="mb-3 flex items-center gap-3">
        {fighter.character_id !== null ? (
          <CharacterImage
            id={fighter.character_id}
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 [&>img]:h-16 [&>img]:w-16 [&>img]:object-cover"
          />
        ) : (
          <span className="theme-surface-muted grid h-16 w-16 shrink-0 place-items-center rounded-md text-[10px] text-[var(--muted)]">
            캐릭터 없음
          </span>
        )}
        <div className="min-w-0">
          <span className="theme-surface-muted inline-flex rounded px-2 py-1 text-[10px] font-bold tracking-wide">
            {fighter.main_sub === 1 ? "메인" : "서브"}
          </span>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">
            {fighter.player_name}
          </p>
          <p
            className={[
              "mt-0.5 text-xs font-bold",
              fighter.is_win === true
                ? "text-emerald-400"
                : fighter.is_win === false
                  ? "text-rose-400"
                  : "text-[var(--muted)]",
            ].join(" ")}
          >
            {fighter.is_win === true
              ? "승리"
              : fighter.is_win === false
                ? "패배"
                : "결과 미상"}
          </p>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        <MatchStatGroup
          title="잡기"
          metrics={[
            { label: "잡기 성공", count: fighter.throw_count },
            {
              label: "잡기 시도 · 성공률",
              count: sumNullableCounts(fighter.throw_count, fighter.throw_dodged_count),
              rate: fighter.throw_success_rate,
            },
            { label: "내가 푼 잡기", count: fighter.dodged_throw_count },
            { label: "내가 잡힘", count: fighter.thrown_count },
            {
              label: "잡기 방어 시도 · 성공률",
              count: sumNullableCounts(fighter.dodged_throw_count, fighter.thrown_count),
              rate: fighter.throw_defense_rate,
            },
          ]}
        />

        <MatchStatGroup
          title="하단"
          metrics={[
            { label: "하단 성공", count: fighter.low_blow_count },
            {
              label: "하단 시도 · 성공률",
              count: sumNullableCounts(fighter.low_blow_count, fighter.low_blow_dodged_count),
              rate: fighter.low_blow_success_rate,
            },
            { label: "내가 피한 하단", count: fighter.dodged_low_blow_count },
            { label: "내가 하단에 맞음", count: fighter.low_blowed_count },
            {
              label: "하단 방어 시도 · 성공률",
              count: sumNullableCounts(fighter.dodged_low_blow_count, fighter.low_blowed_count),
              rate: fighter.low_blow_defense_rate,
            },
          ]}
        />

        <MatchStatGroup
          title="카운터"
          metrics={[
            { label: "카운터 적중", count: fighter.counter_attack_count },
            { label: "카운터 피격", count: fighter.counter_attacked_count },
          ]}
        />

        <MatchStatGroup
          title="태그 · 콤보"
          metrics={[
            { label: "태그 어설트", count: fighter.tag_assault_count },
            { label: "태그 콤보", count: fighter.tag_combo_count },
            {
              label: "일반 콤보",
              count: fighter.combo_hit_plain,
              rate: fighter.combo_hit_plain_rate,
            },
            {
              label: "벽 콤보",
              count: fighter.combo_hit_wall,
              rate: fighter.combo_hit_wall_rate,
            },
            {
              label: "기믹 콤보",
              count: fighter.combo_hit_gimmick,
              rate: fighter.combo_hit_gimmick_rate,
            },
            { label: "콤보 합계", count: fighter.combo_hit_total },
          ]}
        />
      </div>
    </article>
  );
}
