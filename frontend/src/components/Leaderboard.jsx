import React, { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Users, Sparkle, Fire } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { motion } from "framer-motion";

export default function Leaderboard({ contestId = null, title = "Hall of Fame" }) {
  const [data, setData] = useState(null);
  const [globalWinners, setGlobalWinners] = useState([]);
  const [view, setView] = useState(contestId ? "contest" : "global");
  const [loading, setLoading] = useState(true);

  const fetchContestLeaderboard = async () => {
    if (!contestId) return;
    try {
      const res = await api.get(`/leaderboard/${contestId}`);
      setData(res.data);
    } catch (e) {
      // ignore
    }
  };

  const fetchGlobal = async () => {
    try {
      const res = await api.get("/leaderboard/global/top");
      setGlobalWinners(res.data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      contestId ? fetchContestLeaderboard() : Promise.resolve(),
      fetchGlobal(),
    ]).finally(() => setLoading(false));

    const t = setInterval(() => {
      if (contestId) fetchContestLeaderboard();
      fetchGlobal();
    }, 25000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId]);

  const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const renderRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-400 text-black font-heading font-black text-xs flex items-center justify-center shadow-lg shadow-amber-400/40">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-300 text-black font-heading font-black text-xs flex items-center justify-center">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-700/60 text-white font-heading font-black text-xs flex items-center justify-center">
          🥉
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-heading font-bold text-xs flex items-center justify-center">
        #{rank}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
            <Trophy size={22} weight="fill" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg text-zinc-950 dark:text-white flex items-center gap-2">
              {view === "contest" ? data?.contest_title || "Contest Standings" : "All-Time Top Winners"}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {view === "contest"
                ? `Prize Pool: ${money(data?.prize_pool)} · ${data?.participants_count || 0} participants`
                : "Top earning players ranked across all private contests"}
            </p>
          </div>
        </div>

        {contestId && (
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setView("contest")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                view === "contest"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Match
            </button>
            <button
              onClick={() => setView("global")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                view === "global"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Hall of Fame
            </button>
          </div>
        )}
      </div>

      {/* Contest Prize Slabs Strip */}
      {view === "contest" && data?.prize_distribution && data.prize_distribution.length > 0 && (
        <div className="mb-4 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-1.5">
            <span className="flex items-center gap-1 uppercase tracking-wider">
              <Trophy size={13} className="text-amber-500" weight="fill" /> Guaranteed Prize Slabs
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              {data.status === "completed" ? "Settled" : "Auto-Calculated"}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            {data.prize_distribution.map((slab, idx) => (
              <div
                key={idx}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 shadow-sm"
              >
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                  {slab.label || (slab.rank_from === slab.rank_to ? `Rank ${slab.rank_from}` : `Rank ${slab.rank_from}-${slab.rank_to}`)}:
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 tabular">
                  {money(slab.prize_per_winner || slab.prize)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Match Banner */}
      {view === "contest" && data?.status === "completed" && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <Trophy size={16} weight="fill" className="text-amber-500" />
            <span>Match Completed & Settled! All prizes credited to player wallets.</span>
          </div>
        </div>
      )}

      {/* Standings List */}
      <div className="space-y-2.5">
        {view === "contest" ? (
          !data || data.standings.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No entries yet. Be the first to join this pitch!
            </div>
          ) : (
            data.standings.map((p) => (
              <motion.div
                key={p.entry_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                  p.is_me
                    ? "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/15"
                    : p.status === "won"
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200/60 dark:border-zinc-800/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderRankBadge(p.rank)}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span className="truncate">{p.user_name}</span>
                      {p.is_me && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-[10px] font-black text-black">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                      <span>Status: <strong className="capitalize">{p.status}</strong></span>
                      {p.points !== undefined && (
                        <span className="text-zinc-600 dark:text-zinc-300 font-bold">• {p.points} pts</span>
                      )}
                    </div>
                  </div>
                </div>

                {p.prize > 0 ? (
                  <div className="text-right">
                    <div className="font-heading font-extrabold text-amber-500 dark:text-amber-400 tabular text-sm sm:text-base flex items-center gap-1 justify-end">
                      <Trophy size={14} weight="fill" />
                      +{money(p.prize)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Winner
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-zinc-400 tabular">
                    Joined
                  </span>
                )}
              </motion.div>
            ))
          )
        ) : (
          globalWinners.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No champions crowned yet. Win the next match to claim #1!
            </div>
          ) : (
            globalWinners.map((w) => (
              <motion.div
                key={w.user_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                  w.is_me
                    ? "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/15"
                    : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200/60 dark:border-zinc-800/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderRankBadge(w.rank)}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span className="truncate">{w.user_name}</span>
                      {w.is_me && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-[10px] font-black text-black">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {w.wins_count} Match{w.wins_count > 1 ? "es" : ""} Won
                    </span>
                  </div>
                </div>

                <div className="font-heading font-black text-emerald-600 dark:text-emerald-400 tabular text-sm sm:text-base">
                  {money(w.total_won)}
                </div>
              </motion.div>
            ))
          )
        )}
      </div>
    </div>
  );
}
