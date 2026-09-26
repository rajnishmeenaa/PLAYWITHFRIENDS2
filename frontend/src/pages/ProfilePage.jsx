import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/NotificationBell";
import { toast } from "sonner";
import {
  Baseball as CricketBall,
  ArrowLeft,
  Trophy,
  Ticket,
  Copy,
  Check,
  WhatsappLogo,
  ShareNetwork,
  UsersThree,
  Coins,
  ShieldCheck,
  TrendUp,
  Percent,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalContests: 0,
    totalWon: 0,
    winRate: 0,
    totalEarnings: 0,
  });
  const [refStats, setRefStats] = useState({
    referral_code: user?.referral_code || "...",
    total_referrals: 0,
    total_earnings: 0,
    referred_friends: [],
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [entriesRes, refRes] = await Promise.all([
          api.get("/entries/mine"),
          api.get("/referral/stats"),
        ]);
        const entries = entriesRes.data || [];
        const wonEntries = entries.filter((e) => e.status === "won");
        const totalPrize = wonEntries.reduce((sum, e) => sum + (e.winner_prize || 0), 0);
        const winPct = entries.length > 0 ? Math.round((wonEntries.length / entries.length) * 100) : 0;

        setStats({
          totalContests: entries.length,
          totalWon: wonEntries.length,
          winRate: winPct,
          totalEarnings: totalPrize,
        });

        if (refRes.data) {
          setRefStats(refRes.data);
        }
      } catch (err) {
        // ignore
      }
    }
    loadData();
  }, []);

  const referralLink = `${window.location.origin}/?ref=${refStats.referral_code}`;

  const copyCode = () => {
    navigator.clipboard?.writeText(refStats.referral_code);
    setCopiedCode(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `🏏 Join PitchPlay with my referral code "${refStats.referral_code}" and get ₹20 welcome credit! Play private contests and withdraw to UPI:\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  // Mask mobile (e.g. 98****3210)
  const maskMobile = (mob) => {
    if (!mob || mob.length < 8) return mob;
    return mob.slice(0, 2) + "****" + mob.slice(-4);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between pb-12 transition-colors">
      {/* Header */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate("/app")}
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft size={18} weight="bold" /> Back to Lobby
          </button>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-heading font-black text-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              {user?.name?.[0]?.toUpperCase() || "P"}
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="font-heading font-black text-2xl text-zinc-950 dark:text-white">
                    {user?.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                    Mobile: {maskMobile(user?.mobile)} · Role: <span className="capitalize">{user?.role}</span>
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-2 mt-2 sm:mt-0">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-heading font-black text-sm border border-emerald-500/30">
                    Wallet: {money(user?.wallet_balance)}
                  </span>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-zinc-100/70 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Ticket size={14} className="text-emerald-500" /> Contests
                  </span>
                  <div className="font-heading font-black text-xl text-zinc-950 dark:text-white mt-1">
                    {stats.totalContests}
                  </div>
                </div>

                <div className="bg-zinc-100/70 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Trophy size={14} className="text-amber-500" /> Wins
                  </span>
                  <div className="font-heading font-black text-xl text-zinc-950 dark:text-white mt-1">
                    {stats.totalWon}
                  </div>
                </div>

                <div className="bg-zinc-100/70 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Percent size={14} className="text-teal-500" /> Win Rate
                  </span>
                  <div className="font-heading font-black text-xl text-zinc-950 dark:text-white mt-1">
                    {stats.winRate}%
                  </div>
                </div>

                <div className="bg-zinc-100/70 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Coins size={14} className="text-amber-500" /> Winnings
                  </span>
                  <div className="font-heading font-black text-xl text-amber-500 dark:text-amber-400 mt-1 tabular">
                    {money(stats.totalEarnings)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Referral Program Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-600 via-teal-700 to-zinc-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-white/20 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                🎯 Refer & Earn ₹50
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-3xl mt-2">
                Invite Friends, Earn Wallet Bonus
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-lg leading-relaxed">
                Give your friends ₹20 welcome cash. You get ₹50 straight into your wallet when they sign up with your code!
              </p>
            </div>

            <div className="bg-black/30 border border-white/20 p-4 rounded-2xl text-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-emerald-300">Your Referral Code</span>
              <div className="font-mono font-black text-2xl sm:text-3xl tracking-wider text-amber-300 my-1">
                {refStats.referral_code}
              </div>
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-zinc-900 px-3 py-1.5 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all mt-1"
              >
                {copiedCode ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                {copiedCode ? "Copied" : "Copy Code"}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/10">
            <Button
              onClick={shareWhatsApp}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-heading font-black text-xs sm:text-sm rounded-xl px-5 py-2.5 shadow-md flex items-center gap-2"
            >
              <WhatsappLogo size={18} weight="fill" /> Share on WhatsApp
            </Button>
            <Button
              onClick={copyLink}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 font-heading font-bold text-xs sm:text-sm rounded-xl px-5 py-2.5"
            >
              {copiedLink ? <Check size={18} weight="bold" /> : <ShareNetwork size={18} weight="bold" />}
              {copiedLink ? "Link Copied" : "Copy Invite Link"}
            </Button>
          </div>

          {/* Referral Stats Summary */}
          <div className="grid grid-cols-2 gap-4 mt-6 bg-black/20 p-4 rounded-2xl border border-white/10">
            <div>
              <span className="text-xs text-emerald-200">Friends Joined</span>
              <div className="font-heading font-black text-xl text-white mt-0.5">
                {refStats.total_referrals}
              </div>
            </div>
            <div>
              <span className="text-xs text-emerald-200">Total Referral Earnings</span>
              <div className="font-heading font-black text-xl text-amber-300 mt-0.5 tabular">
                {money(refStats.total_earnings)}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
