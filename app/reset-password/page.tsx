"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      try {
        /*
         * STEP 1:
         * Listen for Supabase authentication events FIRST.
         */
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;

          if (event === "PASSWORD_RECOVERY" && session) {
            setValidSession(true);
            setChecking(false);
          }
        });

        /*
         * STEP 2:
         * Supabase password-reset emails may contain
         * a "code" in the URL.
         *
         * We must exchange that code for a session.
         */
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Recovery code error:", error);
          }
        }

        /*
         * STEP 3:
         * Now check whether a valid session exists.
         */
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

        /*
         * Remove the code from the address bar.
         */
        if (code) {
          window.history.replaceState(
            {},
            document.title,
            "/reset-password"
          );
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Recovery session error:", error);

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

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      alert("Please fill both password fields.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully!");

    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  /*
   * Loading screen while Supabase processes
   * the password recovery link.
   */
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="text-4xl mb-4">🔐</div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Verifying Reset Link
          </h1>

          <p className="text-gray-500">
            Please wait while we verify your password reset link...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Invalid / expired link
   */
  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="text-5xl mb-4">🔗</div>

          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Reset Link Expired
          </h1>

          <p className="text-gray-500 mb-6">
            This password reset link is invalid or has expired.
            Please request a new reset link.
          </p>

          <a
            href="/login"
            className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  /*
   * Valid recovery session
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">

        <div className="text-center text-4xl mb-3">
          🔐
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Reset Password
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Create a new password for your account
        </p>

        {/* New Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 pr-12 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative mt-4">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 pr-12 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          onClick={handleResetPassword}
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all mt-6"
        >
          Update Password
        </button>

        <p className="text-center text-gray-500 mt-6">
          Remember your password?{" "}
          <a
            href="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </a>
        </p>

      </div>
    </div>
  );
}