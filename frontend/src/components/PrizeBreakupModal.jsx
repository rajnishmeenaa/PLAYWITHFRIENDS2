import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Trophy, Medal, Sparkle, ShieldCheck, CurrencyInr, Users, CheckCircle } from "@phosphor-icons/react";
import { Button } from "./ui/button";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const generateDefaultPrizeBreakup = (prizePool = 0, maxParticipants = 100) => {
  const pool = Number(prizePool || 0);
  if (pool <= 0) return [];

  if (maxParticipants <= 2) {
    return [
      { rank_from: 1, rank_to: 1, label: "Rank 1", percentage: 100, prize: pool, winners_count: 1, prize_per_winner: pool },
    ];
  } else if (maxParticipants <= 5) {
    const p1 = Math.round(pool * 0.7);
    const p2 = Math.round(pool * 0.3);
    return [
      { rank_from: 1, rank_to: 1, label: "Rank 1", percentage: 70, prize: p1, winners_count: 1, prize_per_winner: p1 },
      { rank_from: 2, rank_to: 2, label: "Rank 2", percentage: 30, prize: p2, winners_count: 1, prize_per_winner: p2 },
    ];
  } else if (maxParticipants <= 10) {
    const p1 = Math.round(pool * 0.5);
    const p2 = Math.round(pool * 0.3);
    const p3 = Math.round(pool * 0.2);
    return [
      { rank_from: 1, rank_to: 1, label: "Rank 1", percentage: 50, prize: p1, winners_count: 1, prize_per_winner: p1 },
      { rank_from: 2, rank_to: 2, label: "Rank 2", percentage: 30, prize: p2, winners_count: 1, prize_per_winner: p2 },
      { rank_from: 3, rank_to: 3, label: "Rank 3", percentage: 20, prize: p3, winners_count: 1, prize_per_winner: p3 },
    ];
  } else if (maxParticipants <= 50) {
    const p1 = Math.round(pool * 0.4);
    const p2 = Math.round(pool * 0.25);
    const p3 = Math.round(pool * 0.15);
    const p4 = Math.round(pool * 0.1);
    const p5 = Math.round(pool * 0.1);
    return [
      { rank_from: 1, rank_to: 1, label: "Rank 1", percentage: 40, prize: p1, winners_count: 1, prize_per_winner: p1 },
      { rank_from: 2, rank_to: 2, label: "Rank 2", percentage: 25, prize: p2, winners_count: 1, prize_per_winner: p2 },
      { rank_from: 3, rank_to: 3, label: "Rank 3", percentage: 15, prize: p3, winners_count: 1, prize_per_winner: p3 },
      { rank_from: 4, rank_to: 5, label: "Rank 4 - 5", percentage: 10, prize: p4, winners_count: 2, prize_per_winner: Math.round(p4 / 2) },
      { rank_from: 6, rank_to: 10, label: "Rank 6 - 10", percentage: 10, prize: p5, winners_count: 5, prize_per_winner: Math.round(p5 / 5) },
    ];
  } else {
    const p1 = Math.round(pool * 0.35);
    const p2 = Math.round(pool * 0.2);
    const p3 = Math.round(pool * 0.15);
    const p4 = Math.round(pool * 0.1);
    const p5 = Math.round(pool * 0.1);
    const p6 = Math.round(pool * 0.1);
    return [
      { rank_from: 1, rank_to: 1, label: "Rank 1", percentage: 35, prize: p1, winners_count: 1, prize_per_winner: p1 },
      { rank_from: 2, rank_to: 2, label: "Rank 2", percentage: 20, prize: p2, winners_count: 1, prize_per_winner: p2 },
      { rank_from: 3, rank_to: 3, label: "Rank 3", percentage: 15, prize: p3, winners_count: 1, prize_per_winner: p3 },
      { rank_from: 4, rank_to: 5, label: "Rank 4 - 5", percentage: 10, prize: p4, winners_count: 2, prize_per_winner: Math.round(p4 / 2) },
      { rank_from: 6, rank_to: 10, label: "Rank 6 - 10", percentage: 10, prize: p5, winners_count: 5, prize_per_winner: Math.round(p5 / 5) },
      { rank_from: 11, rank_to: 25, label: "Rank 11 - 25", percentage: 10, prize: p6, winners_count: 15, prize_per_winner: Math.round(p6 / 15) },
    ];
  }
};

export default function PrizeBreakupModal({ open, onClose, contest }) {
  if (!contest) return null;

  const distribution =
    contest.prize_distribution && contest.prize_distribution.length > 0
      ? contest.prize_distribution
      : generateDefaultPrizeBreakup(contest.prize_pool, contest.max_participants);

  const totalWinners = distribution.reduce(
    (acc, cur) => acc + (cur.winners_count || (cur.rank_to - cur.rank_from + 1)),
    0
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden" data-testid="prize-breakup-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Trophy size={13} weight="fill" /> Dream11 Tiered Payouts
            </span>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              Entry: <strong className="text-zinc-900 dark:text-zinc-100">{money(contest.entry_fee)}</strong>
            </span>
          </div>

          <DialogTitle className="font-heading font-black text-2xl text-zinc-950 dark:text-white mt-1">
            Prize Pool Breakup
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {contest.title} · Guaranteed payouts credited directly to wallet
          </DialogDescription>
        </DialogHeader>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Total Prize Pool
            </div>
            <div className="font-heading font-black text-2xl text-amber-600 dark:text-amber-300 tabular mt-0.5">
              {money(contest.prize_pool)}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Winning Spots
            </div>
            <div className="font-heading font-black text-2xl text-emerald-600 dark:text-emerald-300 tabular mt-0.5">
              {totalWinners} Players
            </div>
          </div>
        </div>

        {/* Rank Slabs Table */}
        <div className="mt-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-zinc-100/70 dark:bg-zinc-800/60 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
            <span>Rank</span>
            <div className="flex items-center gap-6">
              <span>% Pool</span>
              <span>Prize / Winner</span>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto">
            {distribution.map((slab, i) => {
              const count = slab.winners_count || (slab.rank_to - slab.rank_from + 1);
              const perWinner = slab.prize_per_winner || Math.round(slab.prize / count);
              const isFirst = slab.rank_from === 1;
              const isSecond = slab.rank_from === 2;
              const isThird = slab.rank_from === 3;

              return (
                <div
                  key={i}
                  className={`px-4 py-2.5 flex items-center justify-between text-xs transition-colors ${
                    isFirst
                      ? "bg-amber-500/10 dark:bg-amber-500/15 font-bold"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-heading font-black">
                      {isFirst ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : `#${slab.rank_from}`}
                    </span>
                    <div>
                      <div className="font-bold text-zinc-950 dark:text-white">
                        {slab.label || (slab.rank_from === slab.rank_to ? `Rank ${slab.rank_from}` : `Rank ${slab.rank_from} - ${slab.rank_to}`)}
                      </div>
                      {count > 1 && (
                        <div className="text-[10px] text-zinc-400">{count} winners</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <span className="font-mono text-zinc-500 text-[11px]">
                      {slab.percentage}%
                    </span>
                    <div className="font-heading font-black text-sm text-emerald-600 dark:text-emerald-400 tabular min-w-[70px]">
                      {money(perWinner)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Winnings credited instantly to user wallet upon match settlement</span>
        </div>

        <div className="mt-4 pt-2">
          <Button
            onClick={onClose}
            className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-heading font-bold text-xs rounded-xl"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
