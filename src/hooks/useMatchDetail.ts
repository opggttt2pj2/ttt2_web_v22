"use client";

import { useEffect, useState } from "react";
import { parseMatchDetail, type MatchDetail } from "@/lib/match-detail";

export type MatchDetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; detail: MatchDetail };

export function useMatchDetail(matchId: string): MatchDetailState {
  const [state, setState] = useState<MatchDetailState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadDetail() {
      try {
        const response = await fetch(
          `/api/matches/detail?id=${encodeURIComponent(matchId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "warning" in payload &&
            typeof payload.warning === "string"
              ? payload.warning
              : "경기 상세 정보를 불러오지 못했습니다.";
          throw new Error(message);
        }
        const detail = parseMatchDetail(payload);
        if (active) setState({ status: "ready", detail });
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "경기 상세 정보를 불러오지 못했습니다.",
        });
      }
    }

    void loadDetail();
    return () => {
      active = false;
      controller.abort();
    };
  }, [matchId]);

  return state;
}
