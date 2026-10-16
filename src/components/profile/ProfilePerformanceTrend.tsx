"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { characterLabel, uniqueCharacterIds } from "@/lib/matches";
import type { ProfileStatistics } from "@/lib/profile-statistics";

type ProfileTrend = ProfileStatistics["trend"];
type Period = 1 | 7 | 30;

function displayDate(date: string, period: Period) {
  if (period === 1) return "오늘";
  return `${date.slice(5, 7)}/${date.slice(8, 10)}`;
}

export function ProfilePerformanceTrend({ trend }: { trend: ProfileTrend }) {
  const [period, setPeriod] = useState<Period>(7);
  const [filter, setFilter] = useState("all");

  const filters = useMemo(
    () =>
      trend.teams.map((team) => ({
        key: `team:${team.ids[0]}:${team.ids[1]}`,
        label: uniqueCharacterIds(team.ids).map(characterLabel).join(" + "),
        daily: team.daily,
      })),
    [trend.teams],
  );
  const selectedFilter = filters.find((entry) => entry.key === filter);
  const selectedDaily = selectedFilter?.daily ?? trend.daily;
  const startIndex = trend.dates.length - period;
  const chartData = trend.dates.slice(startIndex).map((date, index) => {
    const [games, wins] = selectedDaily[startIndex + index];
    return {
      date,
      label: displayDate(date, period),
      games,
      wins,
      losses: games - wins,
      rate: games === 0 ? null : (wins / games) * 100,
    };
  });
  const totals = chartData.reduce(
    (result, day) => ({
      games: result.games + day.games,
      wins: result.wins + day.wins,
    }),
    { games: 0, wins: 0 },
  );
  const losses = totals.games - totals.wins;
  const rate = totals.games ? (totals.wins / totals.games) * 100 : null;

  return (
    <article className="mb-3 rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800/95 to-slate-900/95 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[1.2px] text-slate-400 uppercase">RECENT PERFORMANCE</p>
          <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-white">최근 경기력 추세</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="profile-trend-period">추세 기간</label>
          <select
            id="profile-trend-period"
            className="rounded-md border border-slate-600 bg-slate-900/80 px-2.5 py-2 text-sm text-slate-100"
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value) as Period)}
          >
            <option value={1}>오늘</option>
            <option value={7}>최근 7일</option>
            <option value={30}>최근 30일</option>
          </select>
          <label className="sr-only" htmlFor="profile-trend-filter">추세 필터</label>
          <select
            id="profile-trend-filter"
            className="max-w-[min(70vw,22rem)] rounded-md border border-slate-600 bg-slate-900/80 px-2.5 py-2 text-sm text-slate-100"
            value={selectedFilter ? filter : "all"}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">전체 전적</option>
            {filters.length ? (
              <optgroup label="태그 조합">
                {filters.map((entry) => (
                  <option key={entry.key} value={entry.key}>{entry.label}</option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["경기", `${totals.games}전`],
          ["승리", `${totals.wins}승`],
          ["패배", `${losses}패`],
          ["승률", rate === null ? "기록 없음" : `${rate.toFixed(1)}%`],
        ].map(([label, value]) => (
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/35 px-3 py-2.5" key={label}>
            <span className="block text-xs text-slate-400">{label}</span>
            <strong className="mt-1 block text-base font-bold text-white">{value}</strong>
          </div>
        ))}
      </div>

      {totals.games > 0 ? (
        <div className="h-56 w-full min-w-0" role="img" aria-label={`${period === 1 ? "오늘" : `최근 ${period}일`} 일별 승률 추세`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 2, left: -16 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="#34465e" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#8193ad"
                axisLine={false}
                tickLine={false}
                minTickGap={period === 30 ? 24 : 8}
                tick={{ fontSize: 11, fill: "#93a6c0" }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#8193ad"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fontSize: 11, fill: "#93a6c0" }}
              />
              <Tooltip
                wrapperClassName="chart-tooltip"
                formatter={(value) => [
                  value === null || value === undefined ? "기록 없음" : `${Number(value).toFixed(1)}%`,
                  "승률",
                ]}
                labelFormatter={(_, payload) => {
                  const date = payload[0]?.payload?.date;
                  return typeof date === "string" ? date : "";
                }}
                contentStyle={{
                  padding: "10px 12px",
                  backgroundColor: "rgba(9, 17, 30, 0.97)",
                  border: "1px solid rgba(99, 220, 255, 0.42)",
                  borderRadius: 12,
                  color: "#eef6ff",
                  boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                name="승률"
                stroke="#46d9ff"
                strokeWidth={3}
                connectNulls={false}
                dot={{ r: 3, fill: "#46d9ff", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#fff", stroke: "#46d9ff", strokeWidth: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-700/70 bg-slate-950/30 py-8 text-center text-sm text-slate-400">
          선택한 기간에 대전 기록이 없습니다.
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500">날짜와 기간은 한국 시간 기준입니다.</p>
    </article>
  );
}
