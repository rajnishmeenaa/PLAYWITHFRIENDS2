import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import ThemeToggle from "../components/ThemeToggle";
import { toast } from "sonner";
import {
  Baseball as CricketBall,
  ArrowRight,
  ShieldCheck,
  Lightning,
  Trophy,
  Sparkle,
  CheckCircle,
  UsersThree,
  DeviceMobile,
  Key,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

const HERO = "https://images.pexels.com/photos/36741131/pexels-photo-36741131.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Landing() {
  const { user, login, signup, setUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "otp"
  const [form, setForm] = useState({ name: "", mobile: "", password: "", referral_code: "" });
  const [otpState, setOtpState] = useState({ mobile: "", otp: "", step: "send", demoOtp: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setForm((prev) => ({ ...prev, referral_code: ref.toUpperCase() }));
      setMode("signup");
      toast.success(`Referral code ${ref.toUpperCase()} applied! ₹20 bonus unlocked.`);
    }
  }, []);

  if (user) {
    navigate(user.role === "admin" ? "/admin" : "/app", { replace: true });
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const u = await login(form.mobile.trim(), form.password);
        toast.success(`Welcome back, ${u.name}`);
        navigate(u.role === "admin" ? "/admin" : "/app", { replace: true });
      } else if (mode === "signup") {
        const res = await api.post("/auth/signup", {
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          password: form.password,
          referral_code: form.referral_code.trim() || undefined,
        });
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        toast.success(`Welcome to PitchPlay, ${res.data.user.name}!`);
        navigate("/app", { replace: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpState.mobile.trim() || otpState.mobile.trim().length < 6) {
      toast.error("Please enter a valid mobile number");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/send-otp", { mobile: otpState.mobile.trim() });
      setOtpState((prev) => ({ ...prev, step: "verify", demoOtp: res.data.otp }));
      toast.success(res.data.message || `OTP sent to ${otpState.mobile}!`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpState.otp.trim()) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        mobile: otpState.mobile.trim(),
        otp: otpState.otp.trim(),
      });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate(res.data.user.role === "admin" ? "/admin" : "/app", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid OTP code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black transition-colors"
      data-testid="landing-page"
    >
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 font-heading font-extrabold text-xl tracking-tight text-zinc-950 dark:text-white"
            data-testid="brand-logo"
          >
            <div className="relative">
              <CricketBall weight="fill" className="text-emerald-500" size={28} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              PitchPlay
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMode("login")}
              className={`text-sm font-semibold transition-colors px-3 py-1.5 rounded-full ${
                mode === "login"
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
              data-testid="nav-login-btn"
            >
              Login
            </button>
            <Button
              onClick={() => setMode("signup")}
              className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm active:scale-95 transition-all text-xs sm:text-sm px-4"
              data-testid="nav-signup-btn"
            >
              Sign up
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero + Auth */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16 w-full flex-1">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 flex flex-col gap-6"
          >
            <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl group">
              <img
                src={HERO}
                alt="Cricket Pitch Stadium"
                className="w-full h-[320px] sm:h-[440px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30" />
              <div className="grain absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" />

              <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end">
                <div className="flex items-center gap-2 self-start bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Lightning weight="fill" size={13} /> Live Private Contests
                </div>

                <h1 className="mt-4 font-heading text-white text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
                  Play Private Matches.<br />
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                    Win & Withdraw Instantly.
                  </span>
                </h1>

                <p className="mt-3 sm:mt-4 text-zinc-300 text-sm sm:text-base max-w-lg leading-relaxed font-body">
                  Admin drops the private contest link, you join with direct UPI entry, and payouts go straight back to your UPI wallet.
                </p>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10 text-xs sm:text-sm text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={16} weight="fill" className="text-emerald-400" />
                    <span>Instant Approvals</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy size={16} weight="fill" className="text-amber-400" />
                    <span>Real-time Payouts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={16} weight="fill" className="text-teal-400" />
                    <span>100% Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Admin-Verified",
                  body: "Manual screenshot verification for every contest entry.",
                  color: "text-emerald-500",
                },
                {
                  icon: Lightning,
                  title: "Any Match Link",
                  body: "Join fantasy tournaments, private lobbies, and quiz pots.",
                  color: "text-amber-500",
                },
                {
                  icon: Trophy,
                  title: "UPI Withdrawals",
                  body: "Withdraw winnings anytime directly to your personal UPI ID.",
                  color: "text-teal-500",
                },
              ].map(({ icon: Icon, title, body, color }, idx) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                  className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all shadow-sm hover:shadow-md"
                >
                  <div className={`p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 w-fit ${color}`}>
                    <Icon size={22} weight="duotone" />
                  </div>
                  <div className="font-heading font-bold text-zinc-900 dark:text-zinc-100 mt-3">{title}</div>
                  <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{body}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Auth Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div
              className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl relative overflow-hidden"
              data-testid="auth-card"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

              {/* Mode Toggle Tabs (Login / Sign Up / OTP) */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2 text-xs sm:text-sm font-heading font-bold rounded-xl transition-all ${
                    mode === "login"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                  data-testid="tab-login"
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setMode("otp")}
                  className={`flex-1 py-2 text-xs sm:text-sm font-heading font-bold rounded-xl transition-all ${
                    mode === "otp"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  OTP Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 py-2 text-xs sm:text-sm font-heading font-bold rounded-xl transition-all ${
                    mode === "signup"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                  data-testid="tab-signup"
                >
                  Sign Up
                </button>
              </div>

              <div className="mt-5 mb-2">
                <h2 className="font-heading font-extrabold text-2xl text-zinc-950 dark:text-white">
                  {mode === "login"
                    ? "Welcome back!"
                    : mode === "otp"
                    ? "Instant OTP Login"
                    : "Join the Pitch"}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {mode === "login"
                    ? "Enter credentials to access active matches."
                    : mode === "otp"
                    ? "Fast login with 6-digit one-time passcode."
                    : "Create an account to join matches & withdraw."}
                </p>
              </div>

              {/* Password Login or Signup Form */}
              {mode !== "otp" ? (
                <form className="mt-5 space-y-4" onSubmit={submit}>
                  <AnimatePresence mode="wait">
                    {mode === "signup" && (
                      <motion.div
                        key="signup-name"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Full name
                          </Label>
                          <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Virat K."
                            className="mt-1.5 h-11 bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
                            data-testid="input-name"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="ref" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                            <span>Referral Code (Optional)</span>
                            <span className="text-emerald-500 font-bold lowercase">+₹20 bonus</span>
                          </Label>
                          <Input
                            id="ref"
                            value={form.referral_code}
                            onChange={(e) => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
                            placeholder="e.g. PP4X9K2L"
                            className="mt-1.5 h-11 bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 uppercase font-mono"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <Label htmlFor="mobile" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Mobile number
                    </Label>
                    <Input
                      id="mobile"
                      inputMode="numeric"
                      pattern="[0-9]{6,15}"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="9876543210"
                      className="mt-1.5 h-11 bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 tabular"
                      data-testid="input-mobile"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 4 characters"
                      className="mt-1.5 h-11 bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
                      data-testid="input-password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-base rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all mt-2"
                    data-testid="auth-submit-btn"
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Please wait...
                      </span>
                    ) : mode === "login" ? (
                      <span className="flex items-center justify-center gap-2">
                        Enter Contest Lobby <ArrowRight size={18} weight="bold" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Create My Account <ArrowRight size={18} weight="bold" />
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                /* OTP Login Form */
                <div className="mt-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Mobile Number
                    </Label>
                    <Input
                      inputMode="numeric"
                      value={otpState.mobile}
                      onChange={(e) => setOtpState({ ...otpState, mobile: e.target.value })}
                      placeholder="9876543210"
                      className="mt-1.5 h-11 bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 tabular"
                    />
                  </div>

                  {otpState.step === "send" ? (
                    <Button
                      onClick={handleSendOtp}
                      disabled={busy}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl shadow-lg active:scale-95 transition-all mt-2"
                    >
                      {busy ? "Sending OTP..." : "Send Verification Code"}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      {otpState.demoOtp && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                          <span className="text-zinc-600 dark:text-zinc-300">
                            Demo Code: <strong className="font-mono text-emerald-500 font-black text-sm">{otpState.demoOtp}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setOtpState({ ...otpState, otp: otpState.demoOtp })}
                            className="px-2.5 py-1 rounded bg-emerald-500 text-black font-black text-[11px] hover:bg-emerald-400 active:scale-95"
                          >
                            Auto Fill
                          </button>
                        </div>
                      )}

                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          6-Digit Passcode
                        </Label>
                        <Input
                          inputMode="numeric"
                          maxLength={6}
                          value={otpState.otp}
                          onChange={(e) => setOtpState({ ...otpState, otp: e.target.value })}
                          placeholder="123456"
                          className="mt-1.5 h-11 text-center font-mono font-black text-lg tracking-widest bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setOtpState({ ...otpState, step: "send" })}
                          className="flex-1 rounded-xl h-11"
                        >
                          Change Number
                        </Button>
                        <Button
                          onClick={handleVerifyOtp}
                          disabled={busy}
                          className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl shadow-md"
                        >
                          {busy ? "Verifying..." : "Verify & Play"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center pt-4">
                🔒 Encrypted platform. Mobile number visible only to admin.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <CricketBall weight="fill" className="text-emerald-500" size={18} />
            <span>© {new Date().getFullYear()} PitchPlay — Private Cricket Fantasy Arena</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
              v2.0 • Live
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
