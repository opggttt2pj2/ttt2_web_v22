"use client";

import { MatchFighterStats } from "@/components/matches/MatchFighterStats";
import { formatDate } from "@/lib/format";
import type { MatchDetail } from "@/lib/match-detail";
import { useMatchDetail } from "@/hooks/useMatchDetail";

function MatchupHeader({ detail }: { detail: MatchDetail }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[rgba(5,13,26,0.38)] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="truncate font-semibold text-[var(--text)]">{detail.p1_name}</span>
        <strong className="shrink-0 text-[var(--cyan)]">
          {detail.p1_score ?? "—"} : {detail.p2_score ?? "—"}
        </strong>
        <span className="truncate font-semibold text-[var(--text)]">{detail.p2_name}</span>
      </div>
      <span className="text-xs text-[var(--muted)]">
        {detail.start_time ? formatDate(detail.start_time) : "시간 정보 없음"}
      </span>
    </div>
  );
}

export function MatchDetailPanel({ matchId }: { matchId: string }) {
  const state = useMatchDetail(matchId);

  if (state.status === "loading") {
    return (
      <div
        className="mt-3 rounded-lg border border-[var(--line)] bg-[rgba(5,13,26,0.38)] p-4 text-sm text-[var(--muted)]"
        role="status"
      >
        상세 스탯을 불러오는 중입니다.
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div
        className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-200"
        role="alert"
      >
        {state.message}
      </div>
    );
  }

  const { detail } = state;
  return (
    <section className="mt-3 rounded-xl border border-[var(--line)] bg-[rgba(5,13,26,0.38)] p-3 sm:p-4">
      <MatchupHeader detail={detail} />
      {detail.fighters.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          이 경기에는 상세 스탯이 저장되어 있지 않습니다.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {([1, 2] as const).map((side) => {
            const fighters = detail.fighters.filter(
              (fighter) => fighter.p1_p2 === side,
            );
            const playerName = side === 1 ? detail.p1_name : detail.p2_name;
            return (
              <section
                className="min-w-0 rounded-xl border border-[var(--line)] p-3"
                key={side}
                aria-label={`${side === 1 ? "1P" : "2P"} ${playerName} 파이터 스탯`}
              >
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                  <span className="theme-surface-muted rounded px-2 py-1 text-[10px] tracking-wide">
                    {side === 1 ? "1P" : "2P"}
                  </span>
                  <span className="truncate">{playerName}</span>
                </h4>
                {fighters.length ? (
                  <div className="grid gap-2">
                    {fighters.map((fighter) => (
                      <MatchFighterStats
                        fighter={fighter}
                        key={`${fighter.p1_p2}-${fighter.main_sub}`}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)]">
                    파이터 스탯이 없습니다.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
