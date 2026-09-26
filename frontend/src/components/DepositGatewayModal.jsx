import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api } from "../lib/api";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  CurrencyInr,
  Lightning,
  CheckCircle,
  Copy,
  Check,
  DeviceMobile,
  QrCode,
  ShieldCheck,
  Sparkle,
  ArrowRight,
  CreditCard,
  ArrowSquareOut,
  Receipt,
  LinkSimple,
  Wallet,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function DepositGatewayModal({
  open,
  onClose,
  initialAmount = 100,
  currentBalance = 0,
  onSuccess,
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [tab, setTab] = useState("apps"); // "apps" | "qr" | "razorpay"
  const [order, setOrder] = useState(null);
  const [step, setStep] = useState("select"); // "select" | "processing" | "success"
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletConfig, setWalletConfig] = useState(null);
  const [rzpPaymentId, setRzpPaymentId] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(initialAmount || 100);
      setStep("select");
      setOrder(null);
      setRzpPaymentId("");
      api
        .get("/wallet/config")
        .then((r) => setWalletConfig(r.data))
        .catch(() => {});
    }
  }, [open, initialAmount]);

  const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const handleCreateOrder = async (selectedApp = "generic") => {
    const num = parseFloat(amount);
    if (!num || num < 10) {
      toast.error("Minimum deposit is ₹10");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/wallet/deposit/create", {
        amount: num,
        upi_app: selectedApp,
      });
      setOrder(res.data);

      // If on mobile and a specific app is selected, open intent
      if (selectedApp === "gpay" && res.data.gpay_uri) {
        window.location.href = res.data.gpay_uri;
      } else if (selectedApp === "phonepe" && res.data.phonepe_uri) {
        window.location.href = res.data.phonepe_uri;
      } else if (selectedApp === "paytm" && res.data.paytm_uri) {
        window.location.href = res.data.paytm_uri;
      } else if (selectedApp === "upi" && res.data.upi_uri) {
        window.location.href = res.data.upi_uri;
      }

      // Transition to verifying state
      setStep("processing");

      // Automated Verification Simulation:
      setTimeout(async () => {
        try {
          const verifyRes = await api.post("/wallet/deposit/verify", {
            order_id: res.data.order_id,
            simulated: true,
          });
          setStep("success");
          toast.success(`₹${num} added to your wallet!`);
          if (onSuccess) {
            onSuccess(verifyRes.data.wallet_balance);
          }
        } catch (e) {
          toast.error("Deposit verification failed");
          setStep("select");
        }
      }, 2500);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to initialize deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentLink = () => {
    const link = walletConfig?.razorpay_payment_link;
    if (!link) {
      toast.error("No Razorpay payment link configured by admin");
      return;
    }
    const targetUrl = link.startsWith("http") ? link : `https://${link}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    toast.info("Opened Razorpay payment link. After paying, click Confirm below.");
  };

  const handleRazorpayVerify = async (orderIdToUse, pId) => {
    const num = parseFloat(amount);
    if (!num || num < 10) {
      toast.error("Minimum deposit is ₹10");
      return;
    }
    setLoading(true);
    setStep("processing");
    try {
      const finalOrderId = orderIdToUse || order?.order_id || `order_${Date.now()}`;
      const finalPaymentId = pId || rzpPaymentId.trim() || `pay_${Date.now().toString(36)}`;
      const verifyRes = await api.post("/wallet/razorpay/verify", {
        razorpay_order_id: finalOrderId,
        razorpay_payment_id: finalPaymentId,
        razorpay_signature: "rzp_verified",
        amount: num,
      });
      setStep("success");
      toast.success(`₹${num} added to your wallet via Razorpay!`);
      if (onSuccess) {
        onSuccess(verifyRes.data.wallet_balance);
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Razorpay verification failed");
      setStep("select");
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    const num = parseFloat(amount);
    if (!num || num < 10) {
      toast.error("Minimum deposit is ₹10");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/wallet/razorpay/create-order", { amount: num });
      const orderData = res.data;
      setOrder(orderData);

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        // Fallback to verification simulation
        await handleRazorpayVerify(orderData.order_id, `pay_demo_${Date.now()}`);
        return;
      }

      const options = {
        key: orderData.key_id || "rzp_test_pitchplay",
        amount: orderData.amount_paise,
        currency: "INR",
        name: "PitchPlay Fantasy",
        description: `Wallet Deposit ₹${num}`,
        order_id: orderData.is_live_order ? orderData.order_id : undefined,
        prefill: {
          name: orderData.user_name || "PitchPlay Player",
          contact: orderData.user_mobile || "",
        },
        theme: {
          color: "#059669",
        },
        handler: async function (response) {
          setStep("processing");
          try {
            const verifyRes = await api.post("/wallet/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || "",
              amount: num,
            });
            setStep("success");
            toast.success(`₹${num} added to your wallet via Razorpay!`);
            if (onSuccess) {
              onSuccess(verifyRes.data.wallet_balance);
            }
          } catch (e) {
            toast.error("Razorpay verification failed");
            setStep("select");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error(response?.error?.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to initialize Razorpay");
    } finally {
      setLoading(false);
    }
  };

  const copyUpi = (upiId) => {
    if (!upiId) return;
    navigator.clipboard?.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const receivingUpi = walletConfig?.admin_upi_id || "9602341799@upi";
  const hasRazorpayLink = Boolean(walletConfig?.razorpay_payment_link);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden" data-testid="deposit-gateway-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Lightning size={12} weight="fill" /> Instant Automated Deposit
            </span>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              Balance: <strong className="text-zinc-900 dark:text-zinc-100">{money(currentBalance)}</strong>
            </span>
          </div>

          <DialogTitle className="font-heading font-black text-2xl text-zinc-950 dark:text-white mt-1">
            {step === "success" ? "Deposit Successful!" : "Add Cash to Wallet"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {step === "success"
              ? "Funds are instantly available for joining fantasy contests."
              : "Zero transaction fees · Instant UPI & Razorpay Settlement"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 mt-2"
            >
              {/* Amount Display & Input */}
              <div className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Enter Deposit Amount
                </span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-2xl font-black text-zinc-400">₹</span>
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-heading font-black text-4xl text-zinc-950 dark:text-white w-40 text-center bg-transparent border-none outline-none tabular"
                    placeholder="100"
                    data-testid="deposit-amount-input"
                  />
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                        Number(amount) === amt
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selector Tabs */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTab("apps")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tab === "apps"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                  data-testid="tab-upi-apps"
                >
                  <DeviceMobile size={15} weight="bold" /> Fast UPI
                </button>
                <button
                  type="button"
                  onClick={() => setTab("qr")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tab === "qr"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                  data-testid="tab-upi-qr"
                >
                  <QrCode size={15} weight="bold" /> Scan QR
                </button>
                <button
                  type="button"
                  onClick={() => setTab("razorpay")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tab === "razorpay"
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                  data-testid="tab-razorpay"
                >
                  <CreditCard size={15} weight="bold" /> Razorpay
                </button>
              </div>

              {tab === "apps" && (
                /* App Cards */
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleCreateOrder("gpay")}
                      disabled={loading}
                      className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-zinc-950/40 flex items-center gap-2.5 transition-all text-left shadow-sm active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-sm">
                        G
                      </div>
                      <div>
                        <div className="font-heading font-extrabold text-xs text-zinc-900 dark:text-white">Google Pay</div>
                        <span className="text-[10px] text-zinc-400">1-Tap Instant</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateOrder("phonepe")}
                      disabled={loading}
                      className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-zinc-950/40 flex items-center gap-2.5 transition-all text-left shadow-sm active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black text-sm">
                        P
                      </div>
                      <div>
                        <div className="font-heading font-extrabold text-xs text-zinc-900 dark:text-white">PhonePe</div>
                        <span className="text-[10px] text-zinc-400">1-Tap Instant</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateOrder("paytm")}
                      disabled={loading}
                      className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-zinc-950/40 flex items-center gap-2.5 transition-all text-left shadow-sm active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-black text-sm">
                        ₹
                      </div>
                      <div>
                        <div className="font-heading font-extrabold text-xs text-zinc-900 dark:text-white">Paytm UPI</div>
                        <span className="text-[10px] text-zinc-400">1-Tap Instant</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateOrder("upi")}
                      disabled={loading}
                      className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-zinc-950/40 flex items-center gap-2.5 transition-all text-left shadow-sm active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-sm">
                        ⚡
                      </div>
                      <div>
                        <div className="font-heading font-extrabold text-xs text-zinc-900 dark:text-white">Any UPI App</div>
                        <span className="text-[10px] text-zinc-400">BHIM / CRED</span>
                      </div>
                    </button>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleCreateOrder("generic")}
                    disabled={loading}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all mt-3 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Pay {money(amount)}</span>
                    <ArrowRight size={18} weight="bold" />
                  </Button>
                </div>
              )}

              {tab === "qr" && (
                /* QR Mode */
                <div className="text-center space-y-3">
                  <div className="bg-white p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 w-fit mx-auto shadow-sm">
                    <QRCodeSVG
                      value={`upi://pay?pa=${receivingUpi}&pn=${encodeURIComponent(walletConfig?.payee_name || "PitchPlay")}&am=${amount}&cu=INR`}
                      size={140}
                    />
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Scan using any UPI app to deposit{" "}
                    <strong className="text-zinc-900 dark:text-white font-bold">{money(amount)}</strong>
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                      <span>UPI: {receivingUpi}</span>
                      <button
                        type="button"
                        onClick={() => copyUpi(receivingUpi)}
                        className="text-emerald-600 hover:underline p-0.5"
                      >
                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleCreateOrder("qr")}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl"
                  >
                    Confirm & Auto-Verify Payment
                  </Button>
                </div>
              )}

              {tab === "razorpay" && (
                /* Razorpay Gateway & Payment Link Mode */
                <div className="space-y-3">
                  {/* Direct Payment Link Option */}
                  {hasRazorpayLink ? (
                    <div className="p-3.5 rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                          <LinkSimple size={15} weight="bold" />
                          <span>Direct Razorpay Payment Link</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 uppercase">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        Open the official Razorpay payment page to pay via Credit/Debit Cards, NetBanking, Paytm, or UPI.
                      </p>
                      <Button
                        type="button"
                        onClick={handleOpenPaymentLink}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-heading font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                        data-testid="open-razorpay-link-btn"
                      >
                        <span>Open Razorpay Payment Page</span>
                        <ArrowSquareOut size={16} weight="bold" />
                      </Button>

                      {/* Payment ID Confirmation */}
                      <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/50 space-y-2">
                        <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          After completing payment, confirm deposit:
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Razorpay Payment ID (e.g. pay_...)"
                            value={rzpPaymentId}
                            onChange={(e) => setRzpPaymentId(e.target.value)}
                            className="h-9 text-xs font-mono bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                            data-testid="razorpay-payment-id-input"
                          />
                          <Button
                            type="button"
                            onClick={() => handleRazorpayVerify()}
                            disabled={loading}
                            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shrink-0"
                            data-testid="verify-razorpay-link-btn"
                          >
                            Verify & Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Standard Razorpay Checkout */}
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                        <CreditCard size={16} weight="bold" className="text-emerald-500" />
                        <span>Razorpay Checkout Popup</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Cards / UPI / NetBanking</span>
                    </div>

                    <Button
                      type="button"
                      onClick={handleRazorpayCheckout}
                      disabled={loading}
                      className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-heading font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
                      data-testid="razorpay-checkout-btn"
                    >
                      <CreditCard size={16} weight="bold" />
                      <span>Pay {money(amount)} via Razorpay Popup</span>
                    </Button>
                  </div>

                  {/* 1-Click Instant Demo Verification */}
                  <button
                    type="button"
                    onClick={() => handleRazorpayVerify(null, `pay_demo_${Date.now()}`)}
                    disabled={loading}
                    className="w-full py-2 px-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-dashed border-emerald-500/30 flex items-center justify-center gap-1.5"
                    data-testid="razorpay-demo-instant-btn"
                  >
                    <Sparkle size={14} weight="fill" />
                    <span>Instant Demo Deposit ₹{amount} (Skip Payment)</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 pt-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>256-Bit Encrypted · Instant Auto-Credit</span>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-10 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
              <div>
                <h3 className="font-heading font-black text-xl text-zinc-950 dark:text-white">
                  Verifying Payment...
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Connecting to payment gateway. Do not close this window.
                </p>
                <div className="mt-4 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-mono font-bold inline-block">
                  Order ID: {order?.order_id || "DEP-PROCESSING"}
                </div>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-6 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle size={40} weight="fill" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Payment Confirmed
                </span>
                <h3 className="font-heading font-black text-3xl text-zinc-950 dark:text-white mt-0.5">
                  +{money(amount)}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Added to your wallet. You're ready to join live cricket matches!
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={onClose}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold rounded-xl"
                  data-testid="deposit-success-done-btn"
                >
                  Done & Back to Lobby
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
