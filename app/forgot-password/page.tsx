"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Password reset email sent! Please check your inbox or spam folder.");
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

      {/* Main Container */}
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Enter your account email and we'll send a secure password reset link.
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

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[48px] border border-slate-200 rounded-xl px-3.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-900 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <span>&rsaquo;</span>
              </>
            )}
          </button>
        </form>

        {/* Navigation Return Links */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
          <Link
            href="/login"
            className="font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
          >
            <span>&lsaquo;</span>
            <span>Back to Login</span>
          </Link>

          <Link
            href="/signup"
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}