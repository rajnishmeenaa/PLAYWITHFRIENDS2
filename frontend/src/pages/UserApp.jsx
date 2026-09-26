import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import {
  Baseball as CricketBall,
  SignOut,
  Wallet,
  Trophy,
  Ticket,
  Clock,
  ArrowSquareOut,
  UploadSimple,
  CurrencyInr,
  Copy,
  Check,
  DeviceMobile,
  WhatsappLogo,
  Receipt,
  Sparkle,
  X,
  TrendUp,
  Coins,
  ShieldCheck,
  User,
  ChartBar,
  Plus,
  Lightning,
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { ScreenshotViewer } from "./AdminApp";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/NotificationBell";
import Leaderboard from "../components/Leaderboard";
import DepositGatewayModal from "../components/DepositGatewayModal";
import PrizeBreakupModal from "../components/PrizeBreakupModal";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const StatusBadge = ({ status }) => {
  const map = {
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    won: "bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/40 glow-orange",
    paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    open: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    upcoming: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    closed: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
    completed: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
        map[status] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }`}
      data-testid={`status-${status}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
};

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function UserApp() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("contests");
  const [contests, setContests] = useState([]);
  const [entries, setEntries] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [history, setHistory] = useState([]);
  const [winners, setWinners] = useState([]);
  const [config, setConfig] = useState({ admin_upi_id: "" });
  const [joinContest, setJoinContest] = useState(null);
  const [selectedContestLeaderboard, setSelectedContestLeaderboard] = useState(null);
  const [wdOpen, setWdOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositInitAmt, setDepositInitAmt] = useState(100);
  const [prizeBreakupContest, setPrizeBreakupContest] = useState(null);

  const openDeposit = (amt = 100) => {
    setDepositInitAmt(amt);
    setDepositOpen(true);
  };

  const loadAll = async () => {
    try {
      const [c, e, w, cfg, me, h, win] = await Promise.all([
        api.get("/contests"),
        api.get("/entries/mine"),
        api.get("/withdrawals/mine"),
        api.get("/wallet/config"),
        api.get("/auth/me"),
        api.get("/wallet/history"),
        api.get("/winners"),
      ]);
      setContests(c.data);
      setEntries(e.data);
      setWithdrawals(w.data);
      setConfig(cfg.data);
      setUser(me.data);
      setHistory(h.data);
      setWinners(win.data);
    } catch (err) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    loadAll();
    /* eslint-disable-next-line */
  }, []);

  const doLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between pb-24 md:pb-8 transition-colors" data-testid="user-app">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-heading font-extrabold text-xl tracking-tight text-zinc-950 dark:text-white">
            <CricketBall weight="fill" className="text-emerald-500" size={26} />
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              PitchPlay
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Wallet Pill */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("wallet")}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-full cursor-pointer hover:border-emerald-500/60 transition-all shadow-sm"
              data-testid="wallet-pill"
            >
              <Wallet size={18} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 hidden sm:inline">
                Wallet
              </span>
              <span className="font-heading font-extrabold text-emerald-900 dark:text-emerald-200 tabular text-sm sm:text-base">
                {money(user?.wallet_balance)}
              </span>
            </motion.div>

            {/* Instant Add Cash Button */}
            <button
              onClick={() => openDeposit(100)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-heading font-black text-xs rounded-full shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              title="Add Cash via UPI"
            >
              <Plus size={14} weight="bold" /> Add Cash
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Button */}
            <button
              onClick={() => navigate("/profile")}
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:text-emerald-500 transition-colors shadow-sm"
              title="Profile & Referrals"
              aria-label="Profile and referral stats"
            >
              <User size={18} weight="bold" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{user?.name}</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular">{user?.mobile}</div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={doLogout}
              className="text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-full p-2 sm:px-3"
              data-testid="logout-btn"
              title="Logout"
            >
              <SignOut size={18} />
              <span className="ml-1 hidden sm:inline text-xs font-bold">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
              Hey {user?.name?.split(" ")[0] || "Player"}, let's play! 🏏
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Browse live contests, pay via UPI, get approved, and play the pitch.
            </p>
          </div>

          {/* Quick Profile / Referral Banner */}
          <button
            onClick={() => navigate("/profile")}
            className="w-fit flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/15 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:border-emerald-500/60 active:scale-95 transition-all shadow-sm"
          >
            <span>🎯 Invite Friends & Earn ₹50</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200 bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-full font-black">
              {user?.referral_code || "GET CODE"}
            </span>
          </button>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="hidden md:inline-flex bg-zinc-200/70 dark:bg-zinc-900/80 border border-zinc-300/60 dark:border-zinc-800 p-1 rounded-2xl h-auto backdrop-blur-md"
            data-testid="tabs-list"
          >
            <TabsTrigger
              value="contests"
              className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2 font-heading font-bold text-xs sm:text-sm transition-all"
              data-testid="tab-contests"
            >
              <Ticket size={16} className="mr-1.5" /> Contests ({contests.length})
            </TabsTrigger>
            <TabsTrigger
              value="entries"
              className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2 font-heading font-bold text-xs sm:text-sm transition-all"
              data-testid="tab-entries"
            >
              <Receipt size={16} className="mr-1.5" /> My Entries ({entries.length})
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2 font-heading font-bold text-xs sm:text-sm transition-all"
              data-testid="tab-leaderboard"
            >
              <ChartBar size={16} className="mr-1.5" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2 font-heading font-bold text-xs sm:text-sm transition-all"
              data-testid="tab-wallet"
            >
              <Wallet size={16} className="mr-1.5" /> Wallet
            </TabsTrigger>
          </TabsList>

          {/* Contests Tab */}
          <TabsContent value="contests" className="mt-4 sm:mt-6 focus-visible:outline-none">
            <WinnersBoard winners={winners} />
            {contests.length === 0 ? (
              <EmptyState title="No contests right now" body="The admin hasn't opened any matches yet. Check back soon!" />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {contests.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <ContestCard
                      contest={c}
                      onJoin={() => setJoinContest(c)}
                      onViewLeaderboard={() => {
                        setSelectedContestLeaderboard(c.id);
                        setActiveTab("leaderboard");
                      }}
                      onViewPrizeBreakup={() => setPrizeBreakupContest(c)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Entries Tab */}
          <TabsContent value="entries" className="mt-4 sm:mt-6 focus-visible:outline-none">
            {entries.length === 0 ? (
              <EmptyState title="No entries yet" body="Join an open contest to see your tickets and live game links here." />
            ) : (
              <div className="space-y-3">
                {entries.map((e, i) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-emerald-500/40 transition-all"
                    data-testid={`entry-row-${e.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="font-heading font-bold text-base sm:text-lg text-zinc-950 dark:text-white">
                          {e.contest_title}
                        </div>
                        <StatusBadge status={e.status} />
                      </div>
                      <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 tabular flex items-center gap-3">
                        <span>Entry: <strong className="text-zinc-800 dark:text-zinc-200">{money(e.entry_fee)}</strong></span>
                        <span>•</span>
                        <span>UTR: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{e.utr || "—"}</strong></span>
                      </div>
                      {e.status === "won" && (
                        <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-2 bg-amber-500/10 px-3 py-1 rounded-full tabular border border-amber-500/30">
                          <Trophy size={16} weight="fill" /> {e.rank ? `Rank #${e.rank} · ` : ""}Won Prize: {money(e.winner_prize)}
                        </div>
                      )}
                    </div>
                    {(e.status === "approved" || e.status === "won") && e.external_link && (
                      <a
                        href={e.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-heading font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all text-sm"
                        data-testid={`play-link-${e.id}`}
                      >
                        <ArrowSquareOut size={18} weight="bold" /> Open Match Link
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4 sm:mt-6 focus-visible:outline-none">
            <Leaderboard contestId={selectedContestLeaderboard} />
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="mt-4 sm:mt-6 focus-visible:outline-none">
            <div className="grid md:grid-cols-3 gap-6">
              {/* 3-Card Wallet Breakdown Column */}
              <div className="md:col-span-1 space-y-4">
                {/* 1. Total Balance Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
                      Total Balance
                    </span>
                    <Coins size={22} weight="duotone" className="text-emerald-300" />
                  </div>
                  <div
                    className="font-heading text-4xl sm:text-5xl font-black tabular tracking-tight mt-2 text-white"
                    data-testid="wallet-balance"
                  >
                    {money(user?.wallet_balance)}
                  </div>
                  <p className="text-[11px] text-emerald-100/80 mt-1">
                    Deposited Cash + Withdrawable Winnings
                  </p>

                  <div className="flex gap-2 mt-5">
                    <Button
                      onClick={() => openDeposit(200)}
                      className="flex-1 bg-white text-emerald-950 hover:bg-emerald-50 font-heading font-black text-xs h-10 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      data-testid="add-cash-btn"
                    >
                      <Lightning size={15} weight="fill" className="text-emerald-600" /> Add Cash
                    </Button>
                    <Button
                      disabled={(user?.winnings_balance ?? user?.wallet_balance ?? 0) < 50}
                      onClick={() => setWdOpen(true)}
                      variant="outline"
                      className="flex-1 border-white/30 text-white hover:bg-white/10 font-heading font-extrabold text-xs h-10 rounded-xl transition-all"
                      data-testid="request-withdrawal-btn"
                    >
                      <CurrencyInr size={15} weight="bold" className="mr-0.5" /> Withdraw
                    </Button>
                  </div>
                </motion.div>

                {/* 2. Withdrawable Winnings Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white dark:bg-zinc-900 border-2 border-amber-500/40 dark:border-amber-500/30 rounded-3xl p-5 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <Trophy size={16} weight="fill" className="text-amber-500" />
                      Withdrawable Winnings
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      100% Cashable
                    </span>
                  </div>
                  <div className="font-heading text-3xl font-black text-zinc-950 dark:text-white tabular mt-2">
                    {money(user?.winnings_balance ?? user?.wallet_balance ?? 0)}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Prize money won in contests. Only this amount can be withdrawn to UPI.
                  </p>
                  <Button
                    disabled={(user?.winnings_balance ?? user?.wallet_balance ?? 0) < 50}
                    onClick={() => setWdOpen(true)}
                    className="w-full mt-3.5 h-9 bg-amber-500 hover:bg-amber-400 text-black font-heading font-extrabold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Withdraw Winnings (Min ₹50)
                  </Button>
                </motion.div>

                {/* 3. Unutilized Deposits Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      <Wallet size={16} weight="duotone" className="text-emerald-500" />
                      Unutilized Deposits
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">Contest Play</span>
                  </div>
                  <div className="font-heading text-2xl font-black text-zinc-800 dark:text-zinc-200 tabular mt-2">
                    {money(user?.deposit_balance ?? 0)}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Money added via UPI or Razorpay. Cannot be withdrawn directly; used automatically to join match contests.
                  </p>
                </motion.div>

                {/* Trust & Policy Guarantee */}
                <div className="p-3.5 bg-zinc-100/80 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200">
                    <ShieldCheck size={14} className="text-emerald-500" /> Payout Guarantee
                  </div>
                  <div>• Min withdrawal: ₹50 · Max: ₹50,000 / request</div>
                  <div>• Daily limit: Max 3 withdrawal requests per 24h</div>
                  <div>• 0% fee · Direct transfer to GPay, PhonePe, Paytm</div>
                </div>
              </div>

              {/* History Panels */}
              <div className="md:col-span-2 space-y-6">
                <WalletHistory items={history} />

                {/* Withdrawals List */}
                <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/90 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="font-heading font-extrabold text-base text-zinc-950 dark:text-white flex items-center gap-2">
                      <TrendUp size={18} className="text-emerald-500" /> Withdrawal Requests
                    </div>
                  </div>
                  {withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
                      No withdrawal requests placed yet
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                      {withdrawals.map((w) => (
                        <div
                          key={w.id}
                          className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                          data-testid={`withdrawal-row-${w.id}`}
                        >
                          <div>
                            <div className="font-heading font-bold text-base text-zinc-950 dark:text-white tabular">
                              {money(w.amount)}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              to <strong className="font-mono text-zinc-700 dark:text-zinc-300">{w.upi_id}</strong> · {new Date(w.created_at).toLocaleString()}
                            </div>
                          </div>
                          <StatusBadge status={w.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center px-1 py-2 shadow-lg">
        <button
          onClick={() => setActiveTab("contests")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold transition-colors ${
            activeTab === "contests"
              ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <Ticket size={20} weight={activeTab === "contests" ? "fill" : "regular"} />
          <span>Contests</span>
        </button>
        <button
          onClick={() => setActiveTab("entries")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold transition-colors ${
            activeTab === "entries"
              ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <Receipt size={20} weight={activeTab === "entries" ? "fill" : "regular"} />
          <span>Entries</span>
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold transition-colors ${
            activeTab === "leaderboard"
              ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <ChartBar size={20} weight={activeTab === "leaderboard" ? "fill" : "regular"} />
          <span>Ranks</span>
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold transition-colors ${
            activeTab === "wallet"
              ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <Wallet size={20} weight={activeTab === "wallet" ? "fill" : "regular"} />
          <span>Wallet</span>
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 transition-colors"
        >
          <User size={20} weight="regular" />
          <span>Profile</span>
        </button>
      </div>

      <JoinDialog
        contest={joinContest}
        onClose={() => setJoinContest(null)}
        config={config}
        onDone={loadAll}
        user={user}
        onOpenDeposit={openDeposit}
      />
      <DepositGatewayModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        initialAmount={depositInitAmt}
        currentBalance={user?.wallet_balance || 0}
        onSuccess={() => loadAll()}
      />
      <WithdrawDialog
        open={wdOpen}
        onClose={() => setWdOpen(false)}
        winningsBalance={user?.winnings_balance ?? user?.wallet_balance ?? 0}
        depositBalance={user?.deposit_balance ?? 0}
        onDone={loadAll}
      />
      <PrizeBreakupModal
        open={!!prizeBreakupContest}
        onClose={() => setPrizeBreakupContest(null)}
        contest={prizeBreakupContest}
      />
    </div>
  );
}

function useCountdown(iso) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!iso) return null;
  const diff = new Date(iso).getTime() - now;
  if (isNaN(diff)) return null;
  if (diff <= 0) return { over: true, text: "Match Started" };
  const d = Math.floor(diff / 86400000),
    h = Math.floor((diff % 86400000) / 3600000),
    m = Math.floor((diff % 3600000) / 60000),
    s = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    over: false,
    urgent: diff < 3600000,
    text: d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`,
  };
}

function ContestCard({ contest, onJoin, onViewLeaderboard, onViewPrizeBreakup }) {
  const cd = useCountdown(contest.match_time);
  const closed = contest.status !== "open" || (cd && cd.over);
  const share = () => {
    const text = `🏏 Join "${contest.title}" on PitchPlay!\nEntry ₹${contest.entry_fee} · Prize pool ₹${contest.prize_pool}\n${window.location.origin}/?contest=${contest.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  return (
    <div
      className="group bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/90 rounded-3xl p-5 sm:p-6 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-xl dark:hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col justify-between"
      data-testid={`contest-card-${contest.id}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <StatusBadge status={contest.status} />
            <h3 className="font-heading text-lg sm:text-xl font-black text-zinc-950 dark:text-white mt-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {contest.title}
            </h3>
            {contest.description && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {contest.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onViewLeaderboard}
              className="p-2.5 rounded-full text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              title="View Leaderboard"
              data-testid={`card-leaderboard-btn-${contest.id}`}
            >
              <Trophy size={18} weight="fill" />
            </button>
            <button
              type="button"
              onClick={share}
              className="p-2.5 rounded-full text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
              title="Share on WhatsApp"
              data-testid={`share-btn-${contest.id}`}
            >
              <WhatsappLogo size={18} weight="fill" />
            </button>
          </div>
        </div>

        {cd && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold tabular ${
              cd.over
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                : cd.urgent
                ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
            }`}
            data-testid={`countdown-${contest.id}`}
          >
            <Clock size={15} weight="bold" />
            {cd.over ? cd.text : `Entries close in ${cd.text}`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Entry Fee
            </div>
            <div className="font-heading text-lg sm:text-xl font-black text-zinc-950 dark:text-white tabular mt-0.5">
              {money(contest.entry_fee)}
            </div>
          </div>
          <button
            type="button"
            onClick={onViewPrizeBreakup}
            className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-3.5 text-left transition-all active:scale-95 group/prize"
            title="Click to view Prize Pool Breakup"
            data-testid={`prize-breakup-btn-${contest.id}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Prize Pool
              </span>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 group-hover/prize:underline">
                Breakup ↗
              </span>
            </div>
            <div className="font-heading text-lg sm:text-xl font-black text-amber-600 dark:text-amber-300 tabular mt-0.5">
              {money(contest.prize_pool)}
            </div>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular font-medium">
          <strong className="text-zinc-800 dark:text-zinc-200">{contest.participants_count}</strong>/{contest.max_participants} joined
        </div>

        {contest.external_link ? (
          <a
            href={contest.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-heading font-bold text-xs px-4 py-2 shadow-md shadow-orange-600/20 active:scale-95 transition-all"
            data-testid={`card-play-link-${contest.id}`}
          >
            <ArrowSquareOut size={16} weight="bold" /> Open Match
          </a>
        ) : contest.my_entry_status === "pending" ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold px-3 py-1.5 border border-amber-500/30"
            data-testid={`card-pending-${contest.id}`}
          >
            <Clock size={14} weight="bold" /> Pending Approval
          </span>
        ) : (
          <Button
            disabled={closed}
            onClick={onJoin}
            className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs px-5 py-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            data-testid={`join-btn-${contest.id}`}
          >
            Join Match
          </Button>
        )}
      </div>
    </div>
  );
}

function JoinDialog({ contest, onClose, config, onDone, user, onOpenDeposit }) {
  const [utr, setUtr] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [walletJoining, setWalletJoining] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    setUtr("");
    setFiles([]);
    setPreviews([]);
    setCopied(false);
    setShowManual(false);
  }, [contest]);

  const handleAddFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const combined = [...files, ...selected].slice(0, 3);
    setFiles(combined);
    const newPrev = combined.map((f) => URL.createObjectURL(f));
    setPreviews(newPrev);
  };

  const removeFileIndex = (index, e) => {
    e.stopPropagation();
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedFiles.map((f) => URL.createObjectURL(f)));
  };

  if (!contest) return null;

  const entryFee = Number(contest.entry_fee || 0);
  const walletBal = Number(user?.wallet_balance || 0);
  const hasEnough = walletBal >= entryFee;
  const needed = Math.max(0, entryFee - walletBal);

  const handleWalletJoin = async () => {
    setWalletJoining(true);
    try {
      await api.post("/entries/wallet-join", { contest_id: contest.id });
      toast.success("Entry Confirmed! 🎟️ Match link unlocked.");
      onClose();
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to join using wallet");
    } finally {
      setWalletJoining(false);
    }
  };

  const upiLink = `upi://pay?pa=${encodeURIComponent(config.admin_upi_id || "")}&pn=${encodeURIComponent(
    config.payee_name || "Admin"
  )}&am=${contest.entry_fee}&cu=INR&tn=${encodeURIComponent(contest.title)}`;

  const copyUpi = () => {
    navigator.clipboard?.writeText(config.admin_upi_id || "");
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one payment screenshot");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("contest_id", contest.id);
      fd.append("utr", utr);
      // Send first screenshot and all multiple screenshots
      fd.append("screenshot", files[0]);
      files.forEach((f) => fd.append("screenshots", f));

      await api.post("/entries", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Entry submitted! Admin will approve shortly.");
      onClose();
      onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to submit entry");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!contest} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        data-testid="join-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
            Join {contest.title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Entry Fee: <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular">{money(contest.entry_fee)}</span> · Prize Pool: <span className="font-extrabold text-amber-500 tabular">{money(contest.prize_pool)}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Instant Wallet Join Card (Primary Dream11 Flow) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Lightning size={16} weight="fill" className="text-emerald-500" /> Instant 1-Click Join
            </span>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              Wallet: <strong className="text-zinc-900 dark:text-zinc-100">{money(walletBal)}</strong>
            </span>
          </div>

          {hasEnough ? (
            <div className="mt-2.5">
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Pay directly with your wallet balance. 0 waiting time, match link unlocks instantly!
              </p>
              <Button
                disabled={walletJoining}
                onClick={handleWalletJoin}
                className="w-full mt-3 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                data-testid="wallet-join-btn"
              >
                <Lightning size={18} weight="fill" />
                {walletJoining ? "Confirming Entry..." : `Pay ${money(entryFee)} & Join Instantly`}
              </Button>
            </div>
          ) : (
            <div className="mt-2.5">
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                You need <strong className="text-amber-600 dark:text-amber-400 font-bold">{money(needed)}</strong> more in your wallet to join instantly.
              </p>
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDeposit(needed);
                }}
                className="w-full mt-2.5 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                data-testid="add-cash-join-btn"
              >
                <Lightning size={16} weight="fill" /> Add {money(needed)} via Instant UPI Gateway
              </Button>
            </div>
          )}
        </div>

        {/* Divider / Manual Upload Toggle */}
        <div className="text-center my-2">
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 underline font-semibold"
          >
            {showManual ? "▲ Hide manual payment options" : "▼ Or pay manually via UPI screenshot proof"}
          </button>
        </div>

        {/* Manual Payment Section (Collapsible) */}
        {showManual && (
          <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {/* UPI Payment Card */}
            <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex gap-4 items-center">
              <div className="bg-white p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0 w-[116px] shadow-sm flex items-center justify-center">
                {config.qr_path ? (
                  <ScreenshotViewer path={config.qr_path} testId="upi-qr-image" className="w-full rounded" />
                ) : (
                  <QRCodeSVG value={upiLink} size={100} data-testid="upi-qr" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Admin UPI ID
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="font-heading text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tabular truncate select-all"
                    data-testid="admin-upi-display"
                  >
                    {config.admin_upi_id || "—"}
                  </div>
                  <button
                    type="button"
                    onClick={copyUpi}
                    className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-500/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                    title="Copy UPI ID"
                    data-testid="copy-upi-btn"
                  >
                    {copied ? <Check size={16} weight="bold" className="text-emerald-500" /> : <Copy size={16} weight="bold" />}
                  </button>
                </div>
                {config.payee_name && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{config.payee_name}</div>
                )}
                <a
                  href={upiLink}
                  className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all"
                  data-testid="pay-upi-link"
                >
                  <DeviceMobile size={15} weight="bold" /> Pay {money(contest.entry_fee)} in UPI App
                </a>
              </div>
            </div>

            {config.instructions && (
              <p
                className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-3"
                data-testid="payment-instructions"
              >
                ℹ️ {config.instructions}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  UTR / Transaction Ref (optional)
                </Label>
                <Input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="12-digit UPI UTR"
                  className="mt-1.5 h-10 bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 tabular"
                  data-testid="input-utr"
                />
              </div>

              {/* Multiple Screenshots Uploader (up to 3) */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Payment Proof Screenshots ({files.length}/3) *
                  </Label>
                  {files.length < 3 && (
                    <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline flex items-center gap-1">
                      <Plus size={14} weight="bold" /> Add another
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleAddFiles}
                      />
                    </label>
                  )}
                </div>

                {previews.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5 mt-2">
                    {previews.map((prev, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-emerald-500/40 bg-zinc-100 dark:bg-zinc-800 aspect-video">
                        <img src={prev} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => removeFileIndex(idx, e)}
                          className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
                          title="Remove"
                        >
                          <X size={12} weight="bold" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 bg-black/70 text-[9px] font-bold text-white rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label
                    className="mt-1.5 flex flex-col items-center justify-center p-5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl cursor-pointer transition-all text-center"
                    data-testid="upload-zone"
                  >
                    <UploadSimple size={26} weight="bold" className="text-zinc-400 dark:text-zinc-500" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-1">
                      Click to upload screenshot (up to 3 images)
                    </span>
                    <span className="text-[10px] text-zinc-400">Supports PNG, JPG, WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddFiles}
                      data-testid="file-input"
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter className="mt-2 flex gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl" data-testid="cancel-join">
                Cancel
              </Button>
              <Button
                disabled={busy}
                onClick={submit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl shadow-md active:scale-95"
                data-testid="submit-entry-btn"
              >
                {busy ? "Submitting..." : "Submit Proof"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WithdrawDialog({ open, onClose, winningsBalance = 0, depositBalance = 0, onDone }) {
  const [amt, setAmt] = useState("");
  const [upi, setUpi] = useState("");
  const [busy, setBusy] = useState(false);

  const numAmt = parseFloat(amt) || 0;
  const maxWithdrawable = Math.max(0, winningsBalance);

  let validationError = "";
  if (amt !== "") {
    if (numAmt < 50) {
      validationError = "Minimum withdrawal amount is ₹50";
    } else if (numAmt > 50000) {
      validationError = "Maximum withdrawal per request is ₹50,000";
    } else if (numAmt > maxWithdrawable) {
      validationError = `Amount exceeds your withdrawable winnings (${money(maxWithdrawable)})`;
    }
  }

  const submit = async () => {
    if (numAmt < 50) {
      toast.error("Minimum withdrawal amount is ₹50");
      return;
    }
    if (numAmt > maxWithdrawable) {
      toast.error(`You can only withdraw up to ${money(maxWithdrawable)} (Winnings balance)`);
      return;
    }
    if (!upi.trim() || !upi.includes("@")) {
      toast.error("Enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    setBusy(true);
    try {
      await api.post("/withdrawals", { amount: numAmt, upi_id: upi.trim() });
      toast.success("Withdrawal requested! Admin will transfer to your UPI shortly.");
      setAmt("");
      setUpi("");
      onClose();
      onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to place withdrawal");
    } finally {
      setBusy(false);
    }
  };

  const setQuickAmount = (val) => {
    setAmt(String(val));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl"
        data-testid="withdraw-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
            <CurrencyInr size={24} className="text-emerald-500" /> Request Payout
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Instant 1-Tap UPI Transfer to your GPay, PhonePe, or Paytm account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Withdrawable Balance Indicator */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-emerald-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Trophy size={14} weight="fill" /> Withdrawable Winnings
              </div>
              <div className="font-heading text-2xl font-black text-zinc-950 dark:text-white tabular mt-0.5">
                {money(maxWithdrawable)}
              </div>
            </div>
            {depositBalance > 0 && (
              <div className="text-right">
                <div className="text-[10px] text-zinc-400 font-medium">Unutilized Deposit</div>
                <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 tabular">
                  {money(depositBalance)} (play only)
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Payout Amount (₹)
              </Label>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Min ₹50 · Max ₹50,000
              </span>
            </div>

            <Input
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              placeholder="e.g. 500"
              inputMode="decimal"
              className={`mt-1.5 h-11 bg-zinc-50 dark:bg-zinc-950/60 tabular font-bold text-base ${
                validationError ? "border-red-500 focus-visible:ring-red-500" : "border-zinc-200 dark:border-zinc-800"
              }`}
              data-testid="input-amount"
            />

            {validationError ? (
              <p className="text-xs text-red-500 font-medium mt-1">{validationError}</p>
            ) : null}

            {/* Quick Amount Selection Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50, 100, 200, 500].filter((v) => v <= maxWithdrawable).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setQuickAmount(v)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 transition-all"
                >
                  +{money(v)}
                </button>
              ))}
              {maxWithdrawable >= 50 && (
                <button
                  type="button"
                  onClick={() => setQuickAmount(Math.floor(maxWithdrawable))}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
                >
                  Withdraw All ({money(Math.floor(maxWithdrawable))})
                </button>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Your Receiving UPI ID
            </Label>
            <Input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              placeholder="e.g. mobile@paytm or name@okaxis"
              className="mt-1.5 h-11 bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 font-mono"
              data-testid="input-upi"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Ensure your UPI ID is correct. Admin will transfer directly to this address.
            </span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-0.5">
            <div>• Free UPI Transfers · 0% platform fee</div>
            <div>• Limit: Max 3 requests per 24 hours</div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            disabled={busy || numAmt < 50 || numAmt > maxWithdrawable || !upi.trim()}
            onClick={submit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl shadow-md active:scale-95"
            data-testid="submit-withdrawal-btn"
          >
            {busy ? "Requesting..." : `Withdraw ${numAmt >= 50 ? money(numAmt) : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WinnersBoard({ winners }) {
  if (!winners.length) return null;
  return (
    <div
      className="mb-8 bg-zinc-950 text-white rounded-3xl p-6 sm:p-7 border border-zinc-800 shadow-2xl relative overflow-hidden"
      data-testid="winners-board"
    >
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
        <Trophy size={18} weight="fill" /> Recent Match Winners
      </div>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {winners.slice(0, 6).map((w, idx) => (
          <div
            key={w.id}
            className="bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-amber-500/40 transition-colors"
            data-testid={`winner-${w.id}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-heading font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-500/40">
                #{idx + 1}
              </span>
              <div className="min-w-0">
                <div className="font-heading font-bold text-sm text-white truncate">{w.user_name}</div>
                <div className="text-[11px] text-zinc-400 truncate">{w.contest_title}</div>
              </div>
            </div>
            <div className="font-heading font-extrabold text-amber-400 tabular text-sm ml-3 shrink-0">
              +{money(w.winner_prize)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletHistory({ items }) {
  const color = {
    prize: "text-amber-500 dark:text-amber-400",
    credit: "text-emerald-600 dark:text-emerald-400",
    debit: "text-red-500 dark:text-red-400",
    payout: "text-red-500 dark:text-red-400",
  };

  return (
    <div
      className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/90 rounded-2xl overflow-hidden shadow-sm"
      data-testid="wallet-history"
    >
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 font-heading font-extrabold text-base text-zinc-950 dark:text-white flex items-center gap-2">
        <Receipt size={18} className="text-emerald-500" /> Transaction History
      </div>
      {items.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
          No transactions yet
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {items.map((t) => (
            <div
              key={t.id}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
              data-testid={`wallet-tx-${t.id}`}
            >
              <div>
                <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.note}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                  {t.type} · {new Date(t.created_at).toLocaleString()}
                </div>
              </div>
              <div className={`font-heading font-extrabold tabular text-sm sm:text-base ${color[t.type] || "text-zinc-900"}`}>
                {t.amount > 0 ? "+" : "−"}
                {money(Math.abs(t.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-12 sm:p-16 text-center">
      <Clock size={44} weight="duotone" className="text-emerald-500 mx-auto opacity-70" />
      <div className="font-heading font-extrabold text-zinc-900 dark:text-zinc-100 text-lg mt-3">{title}</div>
      <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">{body}</div>
    </div>
  );
}
