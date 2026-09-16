"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PhoneAuthPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  // Timer & Security States
  const [timeLeft, setTimeLeft] = useState(10);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // E.164 Clean India Phone (+91)
  const sanitizePhone = (input: string) => {
    const raw = input.replace(/\D/g, "");
    if (raw.length === 10) return `+91${raw}`;
    if (raw.startsWith("91") && raw.length === 12) return `+${raw}`;
    return null;
  };

  // 10-Second Strict Expiration Timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(10);
    setIsExpired(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // WebOTP API: Auto-Capture & Auto-Fill from SMS
  const startWebOtpListener = () => {
    if (typeof window !== "undefined" && "OTPCredential" in window) {
      abortControllerRef.current = new AbortController();

      navigator.credentials
        .get({
          otp: { transport: ["sms"] },
          signal: abortControllerRef.current.signal,
        } as any)
        .then((content: any) => {
          if (content && content.code) {
            setOtp(content.code);
            // Instant Auto-Submit upon detection
            executeVerification(content.code);
          }
        })
        .catch((err) => {
          // Graceful fallback if user cancels or browser doesn't trigger
          console.log("WebOTP auto-read:", err);
        });
    }
  };

  // Step 1: Send / Resend OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const formattedPhone = sanitizePhone(phone);
    if (!formattedPhone) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        data: {
          full_name: fullName.trim() || "Customer",
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(`OTP sent to ${formattedPhone}`);
    setStep("otp");
    setOtp("");
    startTimer();
    startWebOtpListener();
  };

  // Step 2: Verify OTP Function
  const executeVerification = async (tokenToVerify: string) => {
    const formattedPhone = sanitizePhone(phone);
    if (!formattedPhone) {
      setErrorMessage("Invalid phone format.");
      return;
    }

    if (isExpired) {
      setErrorMessage("This OTP has expired. Please request a new code.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: tokenToVerify.trim(),
      type: "sms",
    });

    if (error) {
      setErrorMessage(error.message || "Invalid verification code.");
      setLoading(false);
      return;
    }

    // Stop listeners and timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    // Secure Profile Sync (only update name if provided)
    if (fullName.trim() && data.user) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", data.user.id);
    }

    setSuccessMessage("Verified successfully! Redirecting...");

    setTimeout(() => {
      router.push("/booking");
    }, 1000);
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP.");
      return;
    }
    executeVerification(otp);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10 select-none">
      {/* Brand Header */}
      <Link href="/" className="mb-6 flex items-center gap-2 group">
        <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-orange-100 shadow-sm group-hover:scale-105 transition">
          <Image
            src="/icon-192.png"
            alt="FOOKA Logo"
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>
        <span className="font-black text-base tracking-wider uppercase bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
          FOOKA WASH
        </span>
      </Link>

      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {step === "phone" ? "Doorstep Car Care" : "Verify Phone"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {step === "phone"
              ? "Instant login & registration using mobile number"
              : `Code sent to +91 ${phone.replace(/\D/g, "").slice(-10)}`}
          </p>
        </div>

        {/* Feedback Badges */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
            {successMessage}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-slate-400 font-normal">(Optional for Sign In)</span>
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full min-h-[48px] border border-slate-200 rounded-xl px-3.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Number *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-bold text-slate-500">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full min-h-[48px] border border-slate-200 rounded-xl pl-12 pr-3.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 tracking-wider transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.replace(/\D/g, "").length < 10}
              className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Requesting OTP...</span>
                </>
              ) : (
                <>
                  <span>Get OTP</span>
                  <span>&rsaquo;</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleManualVerify} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  6-Digit OTP (Auto-Detecting)
                </label>
                <span
                  className={`text-xs font-black ${
                    timeLeft > 3 ? "text-orange-600" : "text-rose-600 animate-pulse"
                  }`}
                >
                  {timeLeft > 0 ? `00:${String(timeLeft).padStart(2, "0")}s` : "Expired"}
                </span>
              </div>

              <input
                type="text"
                required
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="------"
                disabled={isExpired || loading}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setOtp(val);
                  if (val.length === 6) executeVerification(val);
                }}
                className={`w-full min-h-[52px] border rounded-xl px-3.5 text-center text-2xl tracking-[0.4em] font-black transition ${
                  isExpired
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-slate-50/50 border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                }`}
              />
            </div>

            {isExpired ? (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
              >
                🔄 Code Expired — Resend OTP
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <span>&rsaquo;</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setErrorMessage("");
                if (timerRef.current) clearInterval(timerRef.current);
              }}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1"
            >
              Edit Mobile Number
            </button>
          </form>
        )}

        {/* Alternate Fallback */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Sign in with Email & Password instead
          </Link>
        </div>
      </div>
    </main>
  );
}