import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api, API, getToken } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import {
  Baseball as CricketBall,
  SignOut,
  Users,
  Ticket,
  Receipt,
  CurrencyInr,
  Plus,
  Trash,
  Check,
  X,
  Trophy,
  Eye,
  ChartBar,
  Gear,
  PencilSimple,
  MagnifyingGlass,
  UploadSimple,
  List,
  WhatsappLogo,
  Bell,
  Clock,
  CreditCard,
  LinkSimple,
  Sparkle,
  QrCode,
  Lightning,
  Copy,
  CheckCircle,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { generateDefaultPrizeBreakup } from "../components/PrizeBreakupModal";
import { motion, AnimatePresence } from "framer-motion";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const StatusBadge = ({ status }) => {
  const map = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-400",
    approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400",
    won: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400",
    paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
    open: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
    upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
    closed: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    completed: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${map[status] || "bg-zinc-100 text-zinc-700"}`}>
      {status}
    </span>
  );
};

const sections = [
  { key: "stats", label: "Overview", icon: ChartBar },
  { key: "contests", label: "Contests", icon: Ticket },
  { key: "entries", label: "Payments", icon: Receipt },
  { key: "withdrawals", label: "Withdrawals", icon: CurrencyInr },
  { key: "users", label: "Users", icon: Users },
  { key: "payment", label: "Payment settings", icon: Gear },
];

export default function AdminApp() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("stats");
  const [mobileDrawer, setMobileDrawer] = useState(false);

  const doLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row transition-colors" data-testid="admin-app">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-heading font-extrabold text-lg text-zinc-950 dark:text-white">
          <CricketBall weight="fill" className="text-emerald-500" size={24} />
          PitchPlay Admin
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileDrawer(!mobileDrawer)}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            aria-label="Toggle navigation menu"
          >
            {mobileDrawer ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-2 shadow-xl"
          >
            {sections.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActive(key); setMobileDrawer(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active === key
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Icon size={18} weight={active === key ? "duotone" : "regular"} />
                {label}
              </button>
            ))}
            <Button variant="ghost" onClick={doLogout} className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl mt-2">
              <SignOut size={16} className="mr-2" /> Logout
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-zinc-900/90 border-r border-zinc-200 dark:border-zinc-800 sticky top-0 h-screen flex-col justify-between backdrop-blur-md shrink-0">
        <div>
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 font-heading font-extrabold text-lg text-zinc-950 dark:text-white">
                <CricketBall weight="fill" className="text-emerald-500" size={24} />
                PitchPlay
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-500">Admin console</div>
            </div>
            <ThemeToggle />
          </div>
          <nav className="p-3 space-y-1">
            {sections.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active === key
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent"
                }`}
                data-testid={`admin-nav-${key}`}
              >
                <Icon size={18} weight={active === key ? "duotone" : "regular"} />
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="px-2 py-2 text-xs">
            <div className="font-bold text-zinc-950 dark:text-white">{user?.name}</div>
            <div className="text-zinc-500 dark:text-zinc-400 tabular">{user?.mobile}</div>
          </div>
          <Button variant="ghost" onClick={doLogout} className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl mt-1" data-testid="admin-logout-btn">
            <SignOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-full overflow-x-hidden">
        {active === "stats" && <StatsPanel />}
        {active === "contests" && <ContestsPanel />}
        {active === "entries" && <EntriesPanel />}
        {active === "withdrawals" && <WithdrawalsPanel />}
        {active === "users" && <UsersPanel />}
        {active === "payment" && <PaymentSettingsPanel />}
      </main>
    </div>
  );
}

function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: "", message: "", type: "system" });
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data));
  }, []);

  const sendBroadcast = async () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      toast.error("Enter title and message");
      return;
    }
    setBroadcasting(true);
    try {
      await api.post("/notifications/create", { ...notifForm, user_id: "all" });
      toast.success("Broadcast notification sent to all players!");
      setNotifForm({ title: "", message: "", type: "system" });
      setNotifOpen(false);
    } catch (e) {
      toast.error("Failed to broadcast");
    } finally {
      setBroadcasting(false);
    }
  };

  const cards = [
    { label: "Total users", value: stats?.total_users ?? "—", testId: "stat-total-users" },
    { label: "Total contests", value: stats?.total_contests ?? "—", testId: "stat-total-contests" },
    { label: "Pending approvals", value: stats?.pending_entries ?? "—", alert: (stats?.pending_entries || 0) > 0, testId: "stat-pending-entries" },
    { label: "Pending withdrawals", value: stats?.pending_withdrawals ?? "—", alert: (stats?.pending_withdrawals || 0) > 0, testId: "stat-pending-withdrawals" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Admin Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Key real-time metrics across PitchPlay.</p>
        </div>
        <Button
          onClick={() => setNotifOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2"
        >
          <Bell size={16} weight="fill" /> Broadcast Message
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`p-5 rounded-2xl border transition-all ${
              c.alert
                ? "bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200"
                : "bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800/90 text-zinc-950 dark:text-white"
            }`}
            data-testid={c.testId}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{c.label}</div>
            <div className="font-heading text-3xl font-black mt-2 tabular">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-xl text-zinc-950 dark:text-white flex items-center gap-2">
              <Bell size={20} className="text-emerald-500" /> Broadcast Notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-bold uppercase text-zinc-500">Title</Label>
              <Input
                value={notifForm.title}
                onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                placeholder="e.g. Mega Tournament Starting at 7 PM! 🏏"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-zinc-500">Message</Label>
              <Textarea
                rows={3}
                value={notifForm.message}
                onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                placeholder="Enter message for all players..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setNotifOpen(false)}>Cancel</Button>
            <Button disabled={broadcasting} onClick={sendBroadcast} className="bg-emerald-600 text-white font-bold">
              {broadcasting ? "Sending..." : "Send to All Players"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContestsPanel() {
  const [contests, setContests] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [settleContest, setSettleContest] = useState(null);
  const blank = {
    title: "", description: "", external_link: "", entry_fee: "", prize_pool: "",
    max_participants: 100, match_time: "", scheduled_open_time: "", scheduled_close_time: "",
    prize_distribution: null
  };
  const [form, setForm] = useState(blank);

  const load = () => api.get("/contests").then((r) => setContests(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      const pool = parseFloat(form.prize_pool || "0");
      const maxP = parseInt(form.max_participants || "100");
      const dist = form.prize_distribution || generateDefaultPrizeBreakup(pool, maxP);

      const payload = {
        title: form.title, description: form.description, external_link: form.external_link,
        entry_fee: parseFloat(form.entry_fee || "0"), prize_pool: pool,
        prize_distribution: dist,
        max_participants: maxP,
        match_time: form.match_time ? new Date(form.match_time).toISOString() : null,
        scheduled_open_time: form.scheduled_open_time ? new Date(form.scheduled_open_time).toISOString() : null,
        scheduled_close_time: form.scheduled_close_time ? new Date(form.scheduled_close_time).toISOString() : null,
      };
      if (editing) {
        await api.patch(`/contests/${editing.id}`, payload);
        toast.success("Contest updated");
      } else {
        await api.post("/contests", payload);
        toast.success("Contest created with multi-tier prize pool");
      }
      setOpen(false); setEditing(null); setForm(blank); load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save contest");
    }
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      title: c.title, description: c.description || "", external_link: c.external_link || "",
      entry_fee: String(c.entry_fee), prize_pool: String(c.prize_pool), max_participants: c.max_participants,
      match_time: toLocalInput(c.match_time),
      scheduled_open_time: toLocalInput(c.scheduled_open_time),
      scheduled_close_time: toLocalInput(c.scheduled_close_time),
      prize_distribution: c.prize_distribution || null,
    });
    setOpen(true);
  };

  const toggle = async (c, status) => {
    await api.patch(`/contests/${c.id}`, { status });
    toast.success(`Contest ${status}`);
    load();
  };

  const del = async (c) => {
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    await api.delete(`/contests/${c.id}`);
    toast.success("Contest deleted");
    load();
  };

  const currentPool = parseFloat(form.prize_pool || "0");
  const currentMaxP = parseInt(form.max_participants || "100");
  const previewSlabs = form.prize_distribution || generateDefaultPrizeBreakup(currentPool, currentMaxP);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Contests</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Create and schedule contests with Dream11-style multi-tier prize pools & automated payouts.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(blank); setOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl" data-testid="new-contest-btn">
          <Plus size={16} weight="bold" className="mr-1" /> New contest
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-6 overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Title</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Entry / Prize</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Participants</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Status</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contests.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-zinc-500">No contests yet</TableCell></TableRow>
            ) : contests.map((c) => (
              <TableRow key={c.id} data-testid={`admin-contest-row-${c.id}`}>
                <TableCell>
                  <div className="font-bold text-zinc-950 dark:text-white">{c.title}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs">{c.external_link}</div>
                  {c.match_time && <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Match: {new Date(c.match_time).toLocaleString()}</div>}
                </TableCell>
                <TableCell className="tabular">
                  <span className="font-bold">{money(c.entry_fee)}</span> / <span className="text-amber-500 font-bold">{money(c.prize_pool)}</span>
                </TableCell>
                <TableCell className="tabular">{c.participants_count}/{c.max_participants}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1 rounded-xl h-8 px-2.5 shadow-sm"
                      onClick={() => setSettleContest(c)}
                      data-testid={`settle-contest-${c.id}`}
                      title="Settle & Distribute Multi-Tier Prizes"
                    >
                      <Trophy size={14} weight="fill" />
                      <span>Settle</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)} data-testid={`edit-contest-${c.id}`}><PencilSimple size={14} /></Button>
                    {c.status === "open" ? (
                      <Button size="sm" variant="outline" onClick={() => toggle(c, "closed")} data-testid={`close-contest-${c.id}`}>Close</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => toggle(c, "open")} data-testid={`open-contest-${c.id}`}>Reopen</Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(c)} data-testid={`delete-contest-${c.id}`}><Trash size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Contest Create / Edit Dialog with Multi-Tier Prize Presets */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl" data-testid="new-contest-dialog">
          <DialogHeader><DialogTitle className="font-heading font-extrabold">{editing ? "Edit contest" : "Create contest"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-1">
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="contest-title-input" /></Field>
            <Field label="External play link"><Input value={form.external_link} onChange={(e) => setForm({ ...form, external_link: e.target.value })} placeholder="https://..." data-testid="contest-link-input" /></Field>
            <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="contest-desc-input" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Entry fee (₹)"><Input inputMode="decimal" value={form.entry_fee} onChange={(e) => setForm({ ...form, entry_fee: e.target.value })} data-testid="contest-fee-input" /></Field>
              <Field label="Prize pool (₹)"><Input inputMode="decimal" value={form.prize_pool} onChange={(e) => setForm({ ...form, prize_pool: e.target.value })} data-testid="contest-prize-input" /></Field>
            </div>
            <Field label="Max participants"><Input inputMode="numeric" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} data-testid="contest-max-input" /></Field>
            <Field label="Match time (entries close)"><Input type="datetime-local" value={form.match_time} onChange={(e) => setForm({ ...form, match_time: e.target.value })} data-testid="contest-time-input" /></Field>

            {/* Scheduling fields */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Field label="Auto-Open Time (Optional)"><Input type="datetime-local" value={form.scheduled_open_time} onChange={(e) => setForm({ ...form, scheduled_open_time: e.target.value })} /></Field>
              <Field label="Auto-Close Time (Optional)"><Input type="datetime-local" value={form.scheduled_close_time} onChange={(e) => setForm({ ...form, scheduled_close_time: e.target.value })} /></Field>
            </div>

            {/* Multi-Tier Prize Distribution Presets */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Prize Distribution Presets
                </Label>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Dream11 Multi-Tier
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const pool = parseFloat(form.prize_pool || "0");
                    setForm({ ...form, prize_distribution: [
                      { rank_from: 1, rank_to: 1, label: "Rank 1", percentage: 100, prize: pool, winners_count: 1, prize_per_winner: pool }
                    ] });
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 text-[11px] font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Winner 100%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pool = parseFloat(form.prize_pool || "0");
                    const p1 = Math.round(pool * 0.6);
                    const p2 = Math.round(pool * 0.25);
                    const p3 = Math.round(pool * 0.15);
                    setForm({ ...form, prize_distribution: [
                      { rank_from: 1, rank_to: 1, label: "Rank 1", percentage: 60, prize: p1, winners_count: 1, prize_per_winner: p1 },
                      { rank_from: 2, rank_to: 2, label: "Rank 2", percentage: 25, prize: p2, winners_count: 1, prize_per_winner: p2 },
                      { rank_from: 3, rank_to: 3, label: "Rank 3", percentage: 15, prize: p3, winners_count: 1, prize_per_winner: p3 },
                    ] });
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 text-[11px] font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Top 3 (60/25/15)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pool = parseFloat(form.prize_pool || "0");
                    const p1 = Math.round(pool * 0.4);
                    const p2 = Math.round(pool * 0.25);
                    const p3 = Math.round(pool * 0.15);
                    const p4 = Math.round(pool * 0.1);
                    const p5 = Math.round(pool * 0.1);
                    setForm({ ...form, prize_distribution: [
                      { rank_from: 1, rank_to: 1, label: "Rank 1", percentage: 40, prize: p1, winners_count: 1, prize_per_winner: p1 },
                      { rank_from: 2, rank_to: 2, label: "Rank 2", percentage: 25, prize: p2, winners_count: 1, prize_per_winner: p2 },
                      { rank_from: 3, rank_to: 3, label: "Rank 3", percentage: 15, prize: p3, winners_count: 1, prize_per_winner: p3 },
                      { rank_from: 4, rank_to: 5, label: "Rank 4 - 5", percentage: 10, prize: p4, winners_count: 2, prize_per_winner: Math.round(p4 / 2) },
                      { rank_from: 6, rank_to: 10, label: "Rank 6 - 10", percentage: 10, prize: p5, winners_count: 5, prize_per_winner: Math.round(p5 / 5) },
                    ] });
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 text-[11px] font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Top 5 Slabs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pool = parseFloat(form.prize_pool || "0");
                    const maxP = parseInt(form.max_participants || "100");
                    setForm({ ...form, prize_distribution: generateDefaultPrizeBreakup(pool, maxP) });
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 text-[11px] font-bold text-amber-700 dark:text-amber-400"
                >
                  Auto Dream11
                </button>
              </div>

              {/* Slabs preview */}
              <div className="max-h-28 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 space-y-1 bg-zinc-50 dark:bg-zinc-950/40 text-xs">
                {previewSlabs.map((slab, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between text-[11px] px-1.5 py-0.5">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      {slab.label || (slab.rank_from === slab.rank_to ? `Rank ${slab.rank_from}` : `Rank ${slab.rank_from}-${slab.rank_to}`)} ({slab.percentage}%):
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular">
                      {money(slab.prize_per_winner || Math.round(slab.prize / (slab.winners_count || 1)))} each
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" data-testid="create-contest-submit">{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contest Settlement & Multi-Tier Payout Dialog */}
      <ContestSettleDialog
        contest={settleContest}
        onClose={() => setSettleContest(null)}
        onSettled={load}
      />
    </div>
  );
}

function ContestSettleDialog({ contest, onClose, onSettled }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [activeDistribution, setActiveDistribution] = useState([]);

  useEffect(() => {
    if (!contest) return;
    setLoading(true);
    const pool = parseFloat(contest.prize_pool || "0");
    const maxP = parseInt(contest.max_participants || "100");
    const dist = contest.prize_distribution && contest.prize_distribution.length > 0
      ? contest.prize_distribution
      : generateDefaultPrizeBreakup(pool, maxP);
    setActiveDistribution(dist);

    api.get(`/leaderboard/${contest.id}`)
      .then((res) => {
        const list = (res.data?.standings || []).map((s, idx) => ({
          entry_id: s.entry_id,
          user_id: s.user_id,
          user_name: s.user_name,
          user_mobile: s.user_mobile,
          points: s.points || 0,
          rank: s.rank || idx + 1,
        }));
        setStandings(list);
      })
      .catch(() => toast.error("Failed to load contest entries"))
      .finally(() => setLoading(false));
  }, [contest]);

  const pool = parseFloat(contest?.prize_pool || "0");

  const getPrizeForRank = (rankNum) => {
    for (const slab of activeDistribution) {
      if (slab.rank_from <= rankNum && rankNum <= slab.rank_to) {
        const count = Math.max(1, slab.rank_to - slab.rank_from + 1);
        const slabPrize = slab.prize ?? Math.round((slab.percentage / 100) * pool);
        return Math.round(slabPrize / count);
      }
    }
    return 0;
  };

  const autoRankByPoints = () => {
    const sorted = [...standings]
      .sort((a, b) => parseFloat(b.points || 0) - parseFloat(a.points || 0))
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
    setStandings(sorted);
    toast.success("Ranks re-assigned based on fantasy points!");
  };

  const updatePoints = (entryId, pts) => {
    setStandings(standings.map(s => s.entry_id === entryId ? { ...s, points: pts } : s));
  };

  const updateRank = (entryId, r) => {
    setStandings(standings.map(s => s.entry_id === entryId ? { ...s, rank: parseInt(r || "1") } : s));
  };

  const totalDistributed = standings.reduce((acc, cur) => acc + getPrizeForRank(cur.rank), 0);
  const totalWinners = standings.filter(s => getPrizeForRank(s.rank) > 0).length;

  const handleSettle = async () => {
    if (standings.length === 0) {
      toast.error("No entries to settle");
      return;
    }
    setSettling(true);
    try {
      const rankings = standings.map(s => ({
        entry_id: s.entry_id,
        rank: parseInt(s.rank || 1),
        points: parseFloat(s.points || 0),
      }));

      const res = await api.post(`/contests/${contest.id}/settle`, {
        rankings,
        auto_distribute: true,
      });

      toast.success(`Success! Credited ${money(res.data.total_distributed)} to ${res.data.winners_count} winners' wallets!`);
      onSettled();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to settle contest");
    } finally {
      setSettling(false);
    }
  };

  return (
    <Dialog open={!!contest} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col" data-testid="contest-settle-dialog">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Trophy size={13} weight="fill" /> Match Settlement & Payout Engine
            </span>
            <span className="text-xs font-mono font-bold text-zinc-500">
              Prize Pool: <strong className="text-emerald-600">{money(contest?.prize_pool)}</strong>
            </span>
          </div>
          <DialogTitle className="font-heading font-black text-2xl text-zinc-950 dark:text-white mt-1">
            Settle Winnings — {contest?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Assign player points or ranks. Prize money will be automatically calculated and credited directly to each winner's in-app wallet balance.
          </DialogDescription>
        </DialogHeader>

        {/* Live Calculation Strip */}
        <div className="grid grid-cols-3 gap-3 my-3">
          <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Players</span>
            <div className="font-heading font-black text-xl text-zinc-900 dark:text-white mt-0.5">{standings.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Winning Spots</span>
            <div className="font-heading font-black text-xl text-amber-600 dark:text-amber-300 mt-0.5">{totalWinners} Winners</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Payout</span>
            <div className="font-heading font-black text-xl text-emerald-600 dark:text-emerald-300 mt-0.5">{money(totalDistributed)}</div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between py-1">
          <div className="text-xs font-bold text-zinc-500">
            Ranked by points or manual rank assignment:
          </div>
          <Button
            type="button"
            size="sm"
            onClick={autoRankByPoints}
            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs rounded-xl"
            data-testid="auto-rank-btn"
          >
            <Sparkle size={14} className="mr-1.5" weight="fill" /> Auto-Rank by Points
          </Button>
        </div>

        {/* Participants Table */}
        <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800/80 my-2">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading contest participants...</div>
          ) : standings.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">No participants enrolled in this contest yet.</div>
          ) : (
            standings.map((p) => {
              const prize = getPrizeForRank(p.rank);
              return (
                <div key={p.entry_id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-12">
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={p.rank}
                        onChange={(e) => updateRank(p.entry_id, e.target.value)}
                        className="h-8 text-center font-heading font-black text-xs px-1"
                        title="Rank"
                        data-testid={`player-rank-${p.entry_id}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-950 dark:text-white truncate">{p.user_name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{p.user_mobile || "Mobile"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Points"
                        value={p.points}
                        onChange={(e) => updatePoints(p.entry_id, e.target.value)}
                        className="h-8 text-right font-mono text-xs px-2"
                        title="Fantasy Points"
                        data-testid={`player-points-${p.entry_id}`}
                      />
                    </div>
                    <div className="w-24 text-right">
                      {prize > 0 ? (
                        <div className="font-heading font-black text-sm text-emerald-600 dark:text-emerald-400 tabular">
                          +{money(prize)}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 font-medium">—</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-3 flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={settling}>Cancel</Button>
          <Button
            onClick={handleSettle}
            disabled={settling || standings.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-extrabold text-xs px-5 rounded-xl shadow-lg shadow-emerald-600/20"
            data-testid="confirm-settle-btn"
          >
            {settling ? "Processing Wallet Credits..." : `🚀 Distribute ${money(totalDistributed)} to ${totalWinners} Winners`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder, testId }) {
  return (
    <div className="relative mt-5 max-w-sm">
      <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" data-testid={testId} />
    </div>
  );
}

function EntriesPanel() {
  const [entries, setEntries] = useState([]);
  const [preview, setPreview] = useState(null);
  const [winnerFor, setWinnerFor] = useState(null);
  const [winnerWhatsapp, setWinnerWhatsapp] = useState(null);
  const [prize, setPrize] = useState("");
  const [q, setQ] = useState("");
  const shown = entries.filter((e) =>
    !q || [e.user_name, e.user_mobile, e.contest_title, e.utr].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))
  );

  const load = () => api.get("/entries").then((r) => setEntries(r.data));
  useEffect(() => { load(); }, []);

  const decide = async (e, action) => {
    try {
      await api.post(`/entries/${e.id}/decision`, { action });
      toast.success(action === "approve" ? "Approved" : "Rejected");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    }
  };

  const declare = async () => {
    const n = parseFloat(prize);
    if (!n || n <= 0) {
      toast.error("Enter prize amount");
      return;
    }
    try {
      const res = await api.post(`/entries/${winnerFor.id}/declare-winner`, { entry_id: winnerFor.id, prize_amount: n });
      toast.success("Winner declared, wallet auto-credited! 🎉");
      if (res.data?.whatsapp_link) {
        setWinnerWhatsapp(res.data.whatsapp_link);
      } else {
        setWinnerFor(null);
        setPrize("");
      }
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Payment Approvals</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Review UPI screenshots, approve to unlock play links, and declare winners.</p>
      <SearchBox value={q} onChange={setQ} placeholder="Search mobile, name, contest, UTR..." testId="entries-search" />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-4 overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">User</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Contest</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Fee / UTR</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Status</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-zinc-500">No entries found</TableCell></TableRow>
            ) : (
              shown.map((e) => (
                <TableRow key={e.id} data-testid={`admin-entry-row-${e.id}`}>
                  <TableCell>
                    <div className="font-bold text-zinc-950 dark:text-white">{e.user_name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular">{e.user_mobile}</div>
                  </TableCell>
                  <TableCell><div className="font-semibold text-zinc-800 dark:text-zinc-200">{e.contest_title}</div></TableCell>
                  <TableCell className="tabular">
                    <div className="font-bold">{money(e.entry_fee)}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">UTR: {e.utr || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                    {e.status === "won" && <div className="text-xs text-amber-500 font-bold mt-1 tabular">🏆 {money(e.winner_prize)}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setPreview(e)} data-testid={`view-screenshot-${e.id}`} title="View Screenshot">
                        <Eye size={14} />
                      </Button>
                      {e.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => decide(e, "approve")} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid={`approve-entry-${e.id}`}><Check size={14} /></Button>
                          <Button size="sm" variant="destructive" onClick={() => decide(e, "reject")} data-testid={`reject-entry-${e.id}`}><X size={14} /></Button>
                        </>
                      )}
                      {e.status === "approved" && (
                        <Button size="sm" onClick={() => { setWinnerFor(e); setWinnerWhatsapp(null); }} className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold" data-testid={`declare-winner-${e.id}`}>
                          <Trophy size={14} className="mr-1" /> Declare Winner
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Screenshot Viewer Dialog (Multi-screenshot support) */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6" data-testid="screenshot-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading font-black">
              Payment Screenshots — {preview?.user_name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            {preview?.screenshot_paths && preview.screenshot_paths.length > 1 ? (
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {preview.screenshot_paths.map((p, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-1">
                    <ScreenshotViewer path={p} className="w-full h-auto max-h-72 object-contain" />
                    <span className="text-[10px] text-zinc-500 block text-center mt-1">Proof #{idx + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              preview?.screenshot_path && (
                <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-2">
                  <ScreenshotViewer path={preview.screenshot_path} className="w-full max-h-[65vh] object-contain rounded-xl" />
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Declare Winner Dialog with WhatsApp Winner Alert */}
      <Dialog open={!!winnerFor} onOpenChange={(v) => { if (!v) { setWinnerFor(null); setWinnerWhatsapp(null); } }}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6" data-testid="winner-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-xl flex items-center gap-2">
              <Trophy size={22} className="text-amber-500" /> Declare Winner
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Award prize to <strong className="text-zinc-950 dark:text-white">{winnerFor?.user_name}</strong> for <strong className="text-zinc-950 dark:text-white">{winnerFor?.contest_title}</strong>.
          </div>

          {!winnerWhatsapp ? (
            <div className="mt-4">
              <Field label="Prize amount (₹)">
                <Input inputMode="decimal" value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="e.g. 500" className="h-11 tabular font-bold text-lg" data-testid="winner-prize-input" />
              </Field>
              <DialogFooter className="mt-5 flex gap-2">
                <Button variant="outline" onClick={() => setWinnerFor(null)}>Cancel</Button>
                <Button onClick={declare} className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold" data-testid="winner-submit-btn">
                  Confirm & Credit Wallet
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-sm text-emerald-700 dark:text-emerald-300 font-bold">
                ✅ Prize credited to wallet! Congratulate the winner now:
              </div>
              <a
                href={winnerWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black rounded-xl shadow-lg transition-all"
              >
                <WhatsappLogo size={20} weight="fill" /> Send WhatsApp Congratulations
              </a>
              <Button variant="outline" onClick={() => { setWinnerFor(null); setWinnerWhatsapp(null); setPrize(""); }} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WithdrawalsPanel() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // Modals state
  const [qrModal, setQrModal] = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [utrInput, setUtrInput] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/withdrawals").then((r) => setWithdrawals(r.data));
  useEffect(() => { load(); }, []);

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const paidCount = withdrawals.filter((w) => w.status === "paid").length;
  const rejectedCount = withdrawals.filter((w) => w.status === "rejected").length;

  const shown = withdrawals.filter((w) => {
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (!q) return true;
    const term = q.toLowerCase();
    return [w.user_name, w.user_mobile, w.upi_id, w.utr, w.decision_note].some(
      (v) => (v || "").toLowerCase().includes(term)
    );
  });

  const getUpiUri = (w) => {
    if (!w) return "";
    return `upi://pay?pa=${encodeURIComponent(w.upi_id)}&pn=${encodeURIComponent(w.user_name)}&am=${w.amount}&tn=${encodeURIComponent(`PitchPlay Payout ${w.id.slice(0, 8)}`)}&cu=INR`;
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    setBusy(true);
    try {
      await api.post(`/withdrawals/${approveModal.id}/decision`, {
        action: "approve",
        utr: utrInput.trim(),
        note: decisionNote.trim(),
      });
      toast.success(`Payout of ₹${approveModal.amount} marked as Paid! Player notified.`);
      setApproveModal(null);
      setUtrInput("");
      setDecisionNote("");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to approve payout");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!decisionNote.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/withdrawals/${rejectModal.id}/decision`, {
        action: "reject",
        note: decisionNote.trim(),
      });
      toast.success(`Payout rejected. ₹${rejectModal.amount} refunded to player's winnings!`);
      setRejectModal(null);
      setDecisionNote("");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to reject payout");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Payout Requests
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Instant 1-Tap UPI pay & QR scan. Only winnings are withdrawable.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold animate-pulse">
            ⚡ {pendingCount} Pending Payout{pendingCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950"
            }`}
          >
            All ({withdrawals.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "pending"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-amber-600"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-emerald-600"
            }`}
          >
            Paid ({paidCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "rejected"
                ? "bg-red-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-red-600"
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search player, mobile, UPI, UTR..."
          testId="withdrawals-search"
        />
      </div>

      {/* Payouts Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-4 overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Player</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Amount</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Receiving UPI</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Status / Ref</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 text-right">1-Tap Payout Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                  No payout requests found
                </TableCell>
              </TableRow>
            ) : (
              shown.map((w) => (
                <TableRow key={w.id} data-testid={`admin-withdrawal-row-${w.id}`}>
                  <TableCell>
                    <div className="font-bold text-zinc-950 dark:text-white">{w.user_name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular">{w.user_mobile}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {new Date(w.created_at).toLocaleString()}
                    </div>
                  </TableCell>

                  <TableCell className="font-bold tabular text-base text-emerald-600 dark:text-emerald-400">
                    {money(w.amount)}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg w-fit">
                      <span>{w.upi_id}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(w.upi_id, w.id)}
                        className="text-zinc-500 hover:text-emerald-500 transition-colors p-0.5"
                        title="Copy UPI ID"
                      >
                        {copiedId === w.id ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={w.status} />
                    {w.status === "paid" && (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        {w.utr && <div className="font-mono text-zinc-700 dark:text-zinc-300">UTR: {w.utr}</div>}
                        <div>{w.decided_at ? new Date(w.decided_at).toLocaleDateString() : ""}</div>
                      </div>
                    )}
                    {w.status === "rejected" && (
                      <div className="text-[11px] text-red-500 dark:text-red-400 mt-1 max-w-xs truncate" title={w.decision_note}>
                        {w.decision_note ? `Reason: ${w.decision_note}` : "Rejected & refunded"}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    {w.status === "pending" ? (
                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        {/* 1-Tap UPI App Link */}
                        <a
                          href={getUpiUri(w)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all active:scale-95"
                          title="Open directly in PhonePe / Google Pay / UPI"
                          data-testid={`upi-app-link-${w.id}`}
                        >
                          <Lightning size={14} weight="fill" className="text-emerald-500" />
                          Pay via App
                        </a>

                        {/* Scan QR Modal trigger */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQrModal(w)}
                          className="h-8 px-2.5 text-xs font-bold border-zinc-200 dark:border-zinc-700"
                          title="Show Payout QR Code"
                          data-testid={`scan-qr-btn-${w.id}`}
                        >
                          <QrCode size={14} className="mr-1 text-zinc-600 dark:text-zinc-300" />
                          Scan QR
                        </Button>

                        {/* Approve Dialog */}
                        <Button
                          size="sm"
                          onClick={() => {
                            setApproveModal(w);
                            setUtrInput("");
                            setDecisionNote("");
                          }}
                          className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          data-testid={`approve-wd-${w.id}`}
                        >
                          <Check size={14} className="mr-1" /> Mark Paid
                        </Button>

                        {/* Reject Dialog */}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setRejectModal(w);
                            setDecisionNote("Invalid UPI ID");
                          }}
                          className="h-8 px-2 text-xs"
                          data-testid={`reject-wd-${w.id}`}
                          title="Reject and refund to winnings balance"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">Processed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dynamic UPI Payout QR Modal */}
      <Dialog open={!!qrModal} onOpenChange={(v) => !v && setQrModal(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-center shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-xl flex items-center justify-center gap-2">
              <QrCode size={22} className="text-emerald-500" /> Scan Payout QR
            </DialogTitle>
          </DialogHeader>

          {qrModal && (
            <div className="mt-2 space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Transfer Amount</div>
                <div className="font-heading text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular">
                  {money(qrModal.amount)}
                </div>
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                  To: {qrModal.user_name}
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  <span>{qrModal.upi_id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(qrModal.upi_id, "modal")}
                    className="p-1 hover:text-emerald-500"
                    title="Copy UPI"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              {/* QR Code Canvas */}
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-md inline-block mx-auto">
                <QRCodeSVG
                  value={getUpiUri(qrModal)}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed px-2">
                Open Google Pay, PhonePe, or Paytm on your mobile. Scan this QR to transfer with 0 typing errors!
              </p>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => {
                    const target = qrModal;
                    setQrModal(null);
                    setApproveModal(target);
                    setUtrInput("");
                    setDecisionNote("");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs h-11 rounded-xl shadow-md"
                >
                  <CheckCircle size={16} weight="bold" className="mr-1.5" />
                  Paid? Enter UTR & Complete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setQrModal(null)}
                  className="w-full text-xs h-10 rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve / Mark Paid Dialog */}
      <Dialog open={!!approveModal} onOpenChange={(v) => !v && setApproveModal(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-xl flex items-center gap-2">
              <CheckCircle size={22} className="text-emerald-500" /> Confirm Payout
            </DialogTitle>
          </DialogHeader>

          {approveModal && (
            <div className="mt-2 space-y-4">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                    {approveModal.user_name} ({approveModal.user_mobile})
                  </div>
                  <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400 mt-0.5">
                    UPI: {approveModal.upi_id}
                  </div>
                </div>
                <div className="font-heading font-black text-xl text-emerald-600 dark:text-emerald-400 tabular">
                  {money(approveModal.amount)}
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  12-Digit UPI UTR / Bank Reference Number
                </Label>
                <Input
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. 428910482910"
                  className="mt-1.5 h-11 tabular font-mono font-bold"
                  data-testid="payout-utr-input"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Optional but recommended — will be sent in the player's payment notification.
                </span>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Admin Note (Optional)
                </Label>
                <Input
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="e.g. Transferred via PhonePe Business"
                  className="mt-1.5 h-10"
                />
              </div>

              <DialogFooter className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setApproveModal(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  disabled={busy}
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl"
                  data-testid="confirm-mark-paid-btn"
                >
                  {busy ? "Processing..." : "Confirm Payout & Notify Player"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject & Refund Dialog */}
      <Dialog open={!!rejectModal} onOpenChange={(v) => !v && setRejectModal(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-xl text-red-600 flex items-center gap-2">
              <X size={22} /> Reject Payout & Refund Player
            </DialogTitle>
          </DialogHeader>

          {rejectModal && (
            <div className="mt-2 space-y-4">
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-red-900 dark:text-red-300 font-bold">
                    {rejectModal.user_name}
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-0.5">
                    UPI: {rejectModal.upi_id}
                  </div>
                </div>
                <div className="font-heading font-black text-xl text-red-600 dark:text-red-400 tabular">
                  {money(rejectModal.amount)}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
                ℹ️ Rejecting will automatically refund {money(rejectModal.amount)} back to {rejectModal.user_name}&apos;s withdrawable winnings balance.
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Reason for Rejection *
                </Label>
                <div className="flex flex-wrap gap-1.5 my-2">
                  {[
                    "Invalid UPI ID",
                    "Bank server down",
                    "Account name mismatch",
                    "Duplicate request",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDecisionNote(preset)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Input
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Enter rejection reason for player"
                  className="mt-1 h-10"
                  data-testid="reject-reason-input"
                />
              </div>

              <DialogFooter className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setRejectModal(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  disabled={busy}
                  variant="destructive"
                  onClick={handleReject}
                  className="font-heading font-bold rounded-xl"
                  data-testid="confirm-reject-btn"
                >
                  {busy ? "Refunding..." : "Confirm Rejection & Refund"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [walletFor, setWalletFor] = useState(null);

  const load = () => api.get("/admin/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const shown = users.filter((u) => !q || [u.name, u.mobile, u.referral_code].some((v) => (v || "").toLowerCase().includes(q.toLowerCase())));

  const block = async (u) => {
    await api.post(`/admin/users/${u.id}/block`, { blocked: !u.blocked });
    toast.success(u.blocked ? "User unblocked" : "User blocked");
    load();
  };

  const del = async (u) => {
    if (!window.confirm(`Delete user ${u.name}?`)) return;
    await api.delete(`/admin/users/${u.id}`);
    toast.success("User deleted");
    load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Player Accounts</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Manage player balances, referral codes, and security.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl" data-testid="add-user-btn">
          <Plus size={16} weight="bold" className="mr-1" /> Add Player
        </Button>
      </div>

      <SearchBox value={q} onChange={setQ} placeholder="Search name, mobile, referral code..." testId="users-search" />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-4 overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Name</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Mobile</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Ref Code</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Wallet</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300">Total Won</TableHead>
              <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500">No users found</TableCell></TableRow>
            ) : (
              shown.map((u) => (
                <TableRow key={u.id} className={u.blocked ? "opacity-60" : ""} data-testid={`admin-user-row-${u.id}`}>
                  <TableCell className="font-bold text-zinc-950 dark:text-white">
                    {u.name}
                    {u.blocked && <span className="ml-2 text-[10px] font-bold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">blocked</span>}
                  </TableCell>
                  <TableCell className="tabular font-mono">{u.mobile}</TableCell>
                  <TableCell className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{u.referral_code || "—"}</TableCell>
                  <TableCell className="tabular">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{money(u.wallet_balance)}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Dep: {money(u.deposit_balance || 0)} · Win: {money(u.winnings_balance || 0)}
                    </div>
                  </TableCell>
                  <TableCell className="tabular font-bold text-amber-500">{money(u.total_won)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setWalletFor(u)}><CurrencyInr size={14} className="mr-1" />Adjust</Button>
                      <Button size="sm" variant="outline" onClick={() => block(u)}>{u.blocked ? "Unblock" : "Block"}</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(u)}><Trash size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddUserDialog open={addOpen} onClose={() => setAddOpen(false)} onDone={load} />
      <WalletDialog user={walletFor} onClose={() => setWalletFor(null)} onDone={load} />
    </div>
  );
}

function AddUserDialog({ open, onClose, onDone }) {
  const [form, setForm] = useState({ name: "", mobile: "", password: "", wallet_balance: "0" });
  const submit = async () => {
    try {
      await api.post("/admin/users", { ...form, wallet_balance: parseFloat(form.wallet_balance || "0") });
      toast.success("User added");
      setForm({ name: "", mobile: "", password: "", wallet_balance: "0" });
      onClose(); onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6" data-testid="add-user-dialog">
        <DialogHeader><DialogTitle className="font-heading font-extrabold">Add User</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="add-user-name" /></Field>
          <Field label="Mobile"><Input inputMode="numeric" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} data-testid="add-user-mobile" /></Field>
          <Field label="Password"><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="add-user-password" /></Field>
          <Field label="Opening Wallet (₹)"><Input inputMode="decimal" value={form.wallet_balance} onChange={(e) => setForm({ ...form, wallet_balance: e.target.value })} data-testid="add-user-wallet" /></Field>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" data-testid="add-user-submit">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WalletDialog({ user, onClose, onDone }) {
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const adjust = async (sign) => {
    const n = parseFloat(amt);
    if (!n || n <= 0) { toast.error("Enter amount"); return; }
    try {
      await api.post(`/admin/users/${user.id}/wallet`, { amount: sign * n, note });
      toast.success("Wallet updated");
      setAmt(""); setNote(""); onClose(); onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6" data-testid="wallet-adjust-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading font-extrabold">Adjust Wallet — {user?.name}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Current balance: <strong className="text-emerald-600 font-bold">{money(user?.wallet_balance)}</strong></div>
        <div className="grid gap-3 mt-2">
          <Field label="Amount (₹)"><Input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="e.g. 100" data-testid="wallet-adjust-amount" /></Field>
          <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bonus" data-testid="wallet-adjust-note" /></Field>
        </div>
        <DialogFooter className="mt-3 flex gap-2">
          <Button onClick={() => adjust(-1)} variant="destructive" className="flex-1" data-testid="wallet-debit-btn">− Debit</Button>
          <Button onClick={() => adjust(1)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex-1" data-testid="wallet-credit-btn">+ Credit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentSettingsPanel() {
  const [form, setForm] = useState({
    upi_id: "",
    payee_name: "",
    instructions: "",
    qr_path: null,
    razorpay_payment_link: "",
    razorpay_key_id: "",
    razorpay_key_secret: "",
  });
  const [file, setFile] = useState(null);
  const [testingRzp, setTestingRzp] = useState(false);

  const load = () => api.get("/admin/payment-settings").then((r) => setForm(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.put("/admin/payment-settings", form);
      toast.success("Payment settings saved");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save settings");
    }
  };

  const testRazorpayConnection = async () => {
    if (!form.razorpay_key_id?.trim() || !form.razorpay_key_secret?.trim()) {
      toast.error("Please enter both Razorpay Key ID and Key Secret to test connection");
      return;
    }
    setTestingRzp(true);
    try {
      const res = await api.post("/admin/payment-settings/test-razorpay", {
        key_id: form.razorpay_key_id.trim(),
        key_secret: form.razorpay_key_secret.trim(),
      });
      toast.success(res.data.message || "Connected to Razorpay successfully!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Razorpay verification failed. Check Key ID and Secret.");
    } finally {
      setTestingRzp(false);
    }
  };

  const uploadQr = async () => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("qr", file);
      await api.post("/admin/payment-settings/qr", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("QR uploaded");
      setFile(null);
      load();
    } catch (e) {
      toast.error("Failed to upload QR");
    }
  };

  const removeQr = async () => {
    await api.delete("/admin/payment-settings/qr");
    toast.success("QR removed, using auto-generated code");
    load();
  };

  const rzpMode = form.razorpay_key_id?.startsWith("rzp_live")
    ? "live"
    : form.razorpay_key_id?.startsWith("rzp_test")
    ? "test"
    : "none";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Payment Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Configure receiving UPI ID, Razorpay live gateway keys, and automated settlement.</p>
      </div>

      {/* UPI Receiving Config */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">₹</div>
          <h2 className="font-heading font-black text-lg text-zinc-950 dark:text-white">Receiving UPI Settings</h2>
        </div>
        <Field label="Receiving UPI ID">
          <Input value={form.upi_id || ""} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} placeholder="e.g. 9602341799@upi" data-testid="settings-upi-input" />
        </Field>
        <Field label="Payee display name">
          <Input value={form.payee_name || ""} onChange={(e) => setForm({ ...form, payee_name: e.target.value })} placeholder="e.g. PitchPlay Fantasy" data-testid="settings-name-input" />
        </Field>
        <Field label="Instructions to users">
          <Textarea rows={3} value={form.instructions || ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="e.g. Scan QR or click UPI app to pay" data-testid="settings-instructions-input" />
        </Field>
        <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl" data-testid="save-settings-btn">
          Save Settings
        </Button>
      </div>

      {/* Razorpay Real-Time Gateway Config */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CreditCard size={18} weight="bold" />
            </div>
            <div>
              <h2 className="font-heading font-black text-lg text-zinc-950 dark:text-white">Real-Time Razorpay Gateway</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Accept Credit Cards, Debit Cards, NetBanking, and UPI automatically</p>
            </div>
          </div>
          {rzpMode === "live" ? (
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Gateway
            </span>
          ) : rzpMode === "test" ? (
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Test Mode
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              Demo Simulation
            </span>
          )}
        </div>

        {/* Razorpay Quick Help Box */}
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl text-xs space-y-2">
          <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
            <span>🔑 Where to find your Razorpay API Credentials:</span>
            <a
              href="https://dashboard.razorpay.com/app/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Razorpay Keys Page <ArrowSquareOut size={12} weight="bold" />
            </a>
          </div>
          <ol className="list-decimal list-inside text-zinc-600 dark:text-zinc-400 space-y-1 text-[11px]">
            <li>Log into your <strong>Razorpay Dashboard</strong> (<code className="font-mono text-blue-600 dark:text-blue-400">dashboard.razorpay.com</code>)</li>
            <li>Go to <strong>Account & Settings</strong> → <strong>API Keys</strong></li>
            <li>Click <strong>Generate Key</strong> to copy your <strong>Key ID</strong> and <strong>Key Secret</strong></li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <Field label="Razorpay Key ID">
            <Input
              value={form.razorpay_key_id || ""}
              onChange={(e) => setForm({ ...form, razorpay_key_id: e.target.value })}
              placeholder="rzp_live_... or rzp_test_..."
              className="font-mono text-xs"
              data-testid="settings-razorpay-key-id-input"
            />
          </Field>
          <Field label="Razorpay Key Secret">
            <Input
              type="password"
              value={form.razorpay_key_secret || ""}
              onChange={(e) => setForm({ ...form, razorpay_key_secret: e.target.value })}
              placeholder="••••••••••••••••"
              className="font-mono text-xs"
              data-testid="settings-razorpay-secret-input"
            />
          </Field>
        </div>

        <Field label="Razorpay Payment Link (Optional Payment Page)">
          <div className="space-y-1">
            <Input
              value={form.razorpay_payment_link || ""}
              onChange={(e) => setForm({ ...form, razorpay_payment_link: e.target.value })}
              placeholder="e.g. https://rzp.io/l/your-link or https://pages.razorpay.com/..."
              data-testid="settings-razorpay-link-input"
            />
            <p className="text-[11px] text-zinc-400">
              Optional: paste a Razorpay Payment Page URL if you also want a standalone web checkout link.
            </p>
          </div>
        </Field>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={testRazorpayConnection}
            disabled={testingRzp || !form.razorpay_key_id}
            className="rounded-xl border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold"
            data-testid="test-razorpay-connection-btn"
          >
            {testingRzp ? "Verifying..." : "⚡ Test Razorpay Connection"}
          </Button>

          <Button
            onClick={save}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex-1 min-w-[160px]"
            data-testid="save-razorpay-settings-btn"
          >
            Save Razorpay Configuration
          </Button>
        </div>
      </div>

      {/* Custom QR Code Image */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <h2 className="font-heading font-black text-lg text-zinc-950 dark:text-white">Custom QR Code Image</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Upload your custom PhonePe / GPay QR code image if preferred over auto-generated QR.</p>

        {form.qr_path && (
          <div className="mt-4 flex items-center gap-4">
            <div className="w-28 h-28 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white p-2">
              <ScreenshotViewer path={form.qr_path} className="w-full h-full object-contain" />
            </div>
            <Button size="sm" variant="destructive" onClick={removeQr}>Remove Custom QR</Button>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} className="max-w-xs" />
          <Button disabled={!file} onClick={uploadQr} className="bg-zinc-900 dark:bg-white text-white dark:text-black font-bold">
            <UploadSimple size={16} className="mr-1" /> Upload QR
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ScreenshotViewer({ path, className = "", testId }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let url = null;
    const fetchImg = async () => {
      try {
        const res = await api.get(`/files?path=${encodeURIComponent(path)}`, {
          responseType: "blob",
        });
        if (!cancelled) {
          url = URL.createObjectURL(res.data);
          setBlobUrl(url);
        }
      } catch (e) {
        if (!cancelled) setError(true);
      }
    };
    if (path) fetchImg();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);

  if (error) return <div className="text-xs text-red-500 p-2">Failed to load screenshot</div>;
  if (!blobUrl) return <div className="text-xs text-zinc-400 p-2">Loading image...</div>;
  return <img src={blobUrl} alt="Payment proof" className={className} data-testid={testId} />;
}
