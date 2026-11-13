import { StatMetricGroup } from "@/components/statistics/StatMetricGroup";
import { sumNullableCounts } from "@/lib/combat-statistics";
import type { CombatMetrics } from "@/lib/player-combat-statistics";

export function CombatMetricsGrid({ stats }: { stats: CombatMetrics }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <StatMetricGroup
        title="잡기"
        metrics={[
          { label: "잡기 성공", count: stats.throw_count },
          {
            label: "잡기 시도 · 성공률",
            count: sumNullableCounts(stats.throw_count, stats.throw_dodged_count),
            rate: stats.throw_success_rate,
          },
          { label: "내가 푼 잡기", count: stats.dodged_throw_count },
          { label: "내가 잡힘", count: stats.thrown_count },
          {
            label: "잡기 방어 시도 · 성공률",
            count: sumNullableCounts(stats.dodged_throw_count, stats.thrown_count),
            rate: stats.throw_defense_rate,
          },
        ]}
      />

      <StatMetricGroup
        title="하단"
        metrics={[
          { label: "하단 성공", count: stats.low_blow_count },
          {
            label: "하단 시도 · 성공률",
            count: sumNullableCounts(stats.low_blow_count, stats.low_blow_dodged_count),
            rate: stats.low_blow_success_rate,
          },
          { label: "내가 피한 하단", count: stats.dodged_low_blow_count },
          { label: "내가 하단에 맞음", count: stats.low_blowed_count },
          {
            label: "하단 방어 시도 · 성공률",
            count: sumNullableCounts(stats.dodged_low_blow_count, stats.low_blowed_count),
            rate: stats.low_blow_defense_rate,
          },
        ]}
      />

      <StatMetricGroup
        title="카운터"
        metrics={[
          { label: "카운터 적중", count: stats.counter_attack_count },
          { label: "카운터 피격", count: stats.counter_attacked_count },
        ]}
      />

      <StatMetricGroup
        title="태그 · 콤보"
        metrics={[
          { label: "태그 어설트", count: stats.tag_assault_count },
          { label: "태그 콤보", count: stats.tag_combo_count },
          {
            label: "일반 콤보",
            count: stats.combo_hit_plain,
            rate: stats.combo_hit_plain_rate,
          },
          {
            label: "벽 콤보",
            count: stats.combo_hit_wall,
            rate: stats.combo_hit_wall_rate,
          },
          {
            label: "기믹 콤보",
            count: stats.combo_hit_gimmick,
            rate: stats.combo_hit_gimmick_rate,
          },
          { label: "콤보 합계", count: stats.combo_hit_total },
        ]}
      />
    </div>
  );
}
