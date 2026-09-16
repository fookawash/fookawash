"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PhoneSignupPage() {
  const router = useRouter();

  // Registration Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "verify">("details");

  // Timer & Security States
  const [timeLeft, setTimeLeft] = useState(10);
  const [isExpired, setIsExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // E.164 India Sanitizer
  const sanitizePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    // Always strips extra leading zeros/codes and prefixes with strict +91
    const clean10 = digits.slice(-10);
    if (clean10.length === 10) {
      return `+91${clean10}`;
    }
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

  // WebOTP API: Auto-Capture & Auto-Fill from incoming SMS
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
            executeVerification(content.code);
          }
        })
        .catch((err) => {
          console.log("WebOTP auto-read fallback:", err);
        });
    }
  };

  // Step 1: Send Registration OTP
  const handleInitiateSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const formattedPhone = sanitizePhone(phone);
    if (!formattedPhone) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        data: {
          full_name: fullName.trim(),
          role: "customer",
        },
      },
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(`OTP sent to ${formattedPhone}`);
    setStep("verify");
    setOtp("");
    startTimer();
    startWebOtpListener();
  };

  // Step 2: Verify & Store Initial Profile/Vehicle
  const executeVerification = async (tokenToVerify: string) => {
    const formattedPhone = sanitizePhone(phone);
    if (!formattedPhone) {
      setErrorMessage("Invalid mobile number format.");
      return;
    }

    if (isExpired) {
      setErrorMessage("This OTP has expired. Please tap 'Resend OTP'.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: tokenToVerify.trim(),
      type: "sms",
    });

    if (error) {
      setErrorMessage(error.message || "Invalid verification code.");
      setSubmitting(false);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (data.user) {
      // 1. Sync full name to profiles table
      await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", data.user.id);

      // 2. Pre-save vehicle if provided during signup
      if (carNumber.trim()) {
        await supabase.from("saved_vehicles").insert([
          {
            user_id: data.user.id,
            car_number: carNumber.trim().toUpperCase(),
            car_company: "Registered Vehicle",
            car_model: "Standard",
            is_default: true,
          },
        ]);
      }
    }

    setSuccessMessage("Account created successfully! Redirecting to booking...");

    setTimeout(() => {
      router.push("/booking");
    }, 1000);
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }
    executeVerification(otp);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10 select-none">
      {/* Top Brand Link */}
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
            {step === "details" ? "Customer Sign Up" : "Verify Phone"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {step === "details"
              ? "Register with mobile number for instant doorstep booking"
              : `Code sent to +91 ${phone.replace(/\D/g, "").slice(-10)}`}
          </p>
        </div>

        {/* Feedback Messages */}
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

        {step === "details" ? (
          <form onSubmit={handleInitiateSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Rahul Sharma"
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Car Plate Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                autoCapitalize="characters"
                maxLength={10}
                placeholder="e.g. WB06HG5767"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                className="w-full min-h-[48px] border border-slate-200 rounded-xl px-3.5 text-sm font-mono uppercase bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || phone.replace(/\D/g, "").length < 10 || !fullName.trim()}
              className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Get Verification Code</span>
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
                disabled={isExpired || submitting}
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
                onClick={() => handleInitiateSignup()}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
              >
                🔄 Code Expired — Resend OTP
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || otp.length < 6}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Create Account</span>
                    <span>&rsaquo;</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setStep("details");
                setOtp("");
                setErrorMessage("");
                if (timerRef.current) clearInterval(timerRef.current);
              }}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1"
            >
              Edit Registration Details
            </button>
          </form>
        )}

        {/* Alternate Navigation */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
          <Link
            href="/login"
            className="font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Sign In with Email
          </Link>

          <Link
            href="/phone-login"
            className="font-bold text-orange-600 hover:text-orange-700 transition"
          >
            Existing User Login
          </Link>
        </div>
      </div>
    </main>
  );
}