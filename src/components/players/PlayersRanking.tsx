"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePlayerRankings } from "@/hooks/usePlayerRankings";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBlock } from "@/components/ui/StatusBlock";
import { CharacterImage } from "@/components/matches/CharacterImage";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function PlayersRanking() {
  const { data: ranking, loading, error, refreshVersion } = usePlayerRankings();

  return (
    <AppShell title="TOP 10" description="서버 전체 플레이어 상위 목록입니다.">
      <StatusBlock
        loading={loading}
        error={error}
        keepChildrenOnError={ranking !== null}
        refreshKey={refreshVersion}
        empty={ranking !== null && ranking.length === 0}
        emptyText="계급 정보가 기록된 플레이어가 없습니다."
      >
        {ranking === null ? (
          <p className="py-5 text-sm text-slate-300/80">플레이어 순위를 불러오는 중입니다.</p>
        ) : (
          <motion.article
            className="theme-panel rounded-2xl p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 110, damping: 20 }}
          >
            <div className="mb-4 flex gap-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
              <span className="text-2xl text-amber-600" aria-hidden="true">
                ⚠
              </span>
              <div>
                <strong className="block text-sm font-bold text-amber-700">계급 기준 플레이어 랭킹</strong>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  각 캐릭터의 가장 최근 기록 계급 중 가장 높은 계급 순입니다. 같은 계급에서는
                  승률, 전체 경기 수, 이름 순으로 정렬합니다. 계급이 한 번 이상 기록된 플레이어가
                  대상이며, 계급은 마지막 관측 경기 시점의 기록입니다.
                </p>
              </div>
            </div>
            <div className="grid">
              {ranking.map((item, index) => {
                const teamCharacters = item.team.ids
                  .map((id, teamIndex) => ({
                    id,
                    rankCode: item.team.ranks[teamIndex],
                  }))
                  .filter(
                    (character, teamIndex, characters) =>
                      characters.findIndex(({ id }) => id === character.id) ===
                      teamIndex,
                  );
                return (
                  <Link
                    className="grid items-center gap-3 border-b border-[var(--line)] py-4 last:border-b-0 md:grid-cols-[42px_minmax(0,calc(48%-66px))_minmax(0,1fr)_72px]"
                    href={`/profile/${encodeURIComponent(item.name)}`}
                    key={item.name}
                  >
                    <b className="text-sm font-bold text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</b>
                    <div className="min-w-0">
                      <span className="mb-2 flex flex-wrap items-center gap-2">
                        <strong className="text-base font-semibold text-[var(--text)]">{item.name}</strong>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        {teamCharacters.map(({ id, rankCode }) => (
                          <span className="flex w-[72px] flex-col items-center gap-1" key={id}>
                            <CharacterImage
                              id={id}
                              width={72}
                              height={80}
                              sizes="(max-width: 500px) 56px, 72px"
                            />
                            {rankCode !== null ? (
                              <Image
                                src={`/ranks/${rankCode}.webp`}
                                alt={`계급 ${rankCode}`}
                                width={84}
                                height={44}
                                sizes="84px"
                                className="h-auto w-[84px] max-w-none"
                              />
                            ) : null}
                          </span>
                        ))}
                      </span>
                    </div>
                    <span className="text-base text-[var(--muted)] md:justify-self-start">
                      <AnimatedNumber value={item.games} refreshKey={refreshVersion} />전{" "}
                      <AnimatedNumber value={item.wins} refreshKey={refreshVersion} />승{" "}
                      <AnimatedNumber value={item.games - item.wins} refreshKey={refreshVersion} />패
                    </span>
                    <em className="text-right text-xl font-bold text-[var(--cyan)] md:text-left">
                      <AnimatedNumber
                        value={item.rate}
                        refreshKey={refreshVersion}
                        decimals={1}
                      />%
                    </em>
                  </Link>
                );
              })}
            </div>
          </motion.article>
        )}
      </StatusBlock>
    </AppShell>
  );
}
