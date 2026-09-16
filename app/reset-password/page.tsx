"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      try {
        // 1. Listen for Supabase password recovery events
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;

          if (event === "PASSWORD_RECOVERY" && session) {
            setValidSession(true);
            setChecking(false);
          }
        });

        // 2. Exchange code if URL contains a code query param (PKCE flow)
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");

          if (code) {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              console.error("Recovery code exchange error:", exchangeError);
            }

            // Clean the code param from address bar
            window.history.replaceState({}, document.title, "/reset-password");
          }
        }

        // 3. Verify if active session exists
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          setValidSession(true);
        } else {
          setValidSession(false);
        }

        setChecking(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Recovery verification error:", error);
        if (mounted) {
          setValidSession(false);
          setChecking(false);
        }
      }
    };

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!password || !confirmPassword) {
      setErrorMessage("Please complete both password fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    setSuccessMessage("Password updated successfully! Redirecting to login...");

    // Sign out the recovery session so customer logs in fresh with the new password
    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  // State 1: Verifying Recovery Token
  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 select-none">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            Verifying Reset Link
          </h1>
          <p className="text-xs text-slate-500">
            Please wait while we establish your secure recovery session...
          </p>
        </div>
      </main>
    );
  }

  // State 2: Expired or Invalid Link
  if (!validSession) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 select-none">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto">
            ⚠️
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Reset Link Expired or Invalid
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            This password recovery link has either already been used or has expired. Please request a fresh reset link.
          </p>
          <div className="pt-2 space-y-2">
            <Link
              href="/forgot-password"
              className="block w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-500/25 hover:opacity-95 transition"
            >
              Request New Link
            </Link>
            <Link
              href="/login"
              className="block w-full py-3 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // State 3: Active Valid Recovery Session Form
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

      {/* Reset Card */}
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Create a new password for your customer account
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center leading-relaxed">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Enter new password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[48px] border border-slate-200 rounded-xl px-3.5 pr-14 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-900 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full min-h-[48px] border border-slate-200 rounded-xl px-3.5 pr-14 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-900 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 transition"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <span>&rsaquo;</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Remember your password? Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}