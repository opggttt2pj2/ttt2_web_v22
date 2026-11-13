"use client";

import { CombatMetricsGrid } from "@/components/profile/CombatMetricsGrid";
import { CharacterImage } from "@/components/matches/CharacterImage";
import { usePlayerCombatStatistics } from "@/hooks/usePlayerCombatStatistics";
import { characterLabel } from "@/lib/matches";

export function ProfileCombatStats({ playerName }: { playerName: string }) {
  const { data, loading, error } = usePlayerCombatStatistics(playerName);

  if (!data && loading) {
    return (
      <section
        className="mb-3 rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5 text-sm text-slate-300/80"
        role="status"
      >
        전투 스탯을 불러오는 중입니다.
      </section>
    );
  }

  if (!data && error) {
    return (
      <section
        className="mb-3 rounded-2xl border border-rose-500/30 bg-rose-950/25 p-4 text-rose-100"
        role="alert"
      >
        <strong className="block text-sm font-semibold">
          전투 스탯을 불러오지 못했습니다.
        </strong>
        <p className="mt-1 text-sm text-rose-100/80">{error}</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="mb-3 rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800/95 to-slate-900/95 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] sm:p-5">
      <header className="mb-4">
        <p className="text-[11px] font-bold tracking-[1.2px] text-slate-400 uppercase">
          COMBAT STATISTICS
        </p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-white">
          전투 스탯 요약
        </h3>
      </header>

      {data.summary.stats_matches === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-300/80">
          아직 전투 스탯이 저장된 경기가 없습니다.
        </p>
      ) : (
        <>
          {error ? (
            <p className="mb-3 text-xs text-amber-200" role="status">
              최신 스탯을 갱신하지 못해 저장된 내용을 표시하고 있습니다.
            </p>
          ) : null}

          <div className="mb-5">
            <h4 className="mb-2 text-sm font-bold text-white">전체 캐릭터 합계</h4>
            <CombatMetricsGrid stats={data.overall} />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-bold text-white">캐릭터별</h4>
            {data.characters.length ? (
              <div className="grid gap-2">
                {data.characters.map((character) => (
                  <article
                    className="rounded-xl border border-slate-700/80 bg-slate-900/45 p-3"
                    key={character.character_id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <CharacterImage
                          id={character.character_id}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 [&>img]:h-12 [&>img]:w-12 [&>img]:object-contain"
                        />
                        <div className="min-w-0">
                          <h5 className="truncate text-sm font-semibold text-white">
                            {characterLabel(character.character_id)}
                          </h5>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {character.matches}전 {character.wins}승 · 승률{" "}
                            {character.rate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        메인 {character.main_uses}회 · 서브 {character.sub_uses}회
                      </p>
                    </div>
                    <details className="group mt-3 border-t border-slate-700/70 pt-2">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-cyan-300 marker:hidden">
                        상세 스탯 보기
                      </summary>
                      <div className="pt-3">
                        <CombatMetricsGrid stats={character.stats} />
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-300/80">
                캐릭터별 스탯 데이터가 없습니다.
              </p>
            )}
            {data.characters_truncated ? (
              <p className="mt-2 text-xs text-slate-400">
                캐릭터가 {data.character_count}종이라 사용 횟수 상위 100종만 표시합니다.
              </p>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
