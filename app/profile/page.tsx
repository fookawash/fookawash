"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setName(user.user_metadata?.full_name || "");
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSaveName = async () => {
    setMessage("");
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Name cannot be empty.");
      return;
    }

    setSavingName(true);

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: name.trim(),
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setSavingName(false);
      return;
    }

    setUser(data.user);
    setName(data.user.user_metadata?.full_name || "");

    setMessage("Name updated successfully!");
    setSavingName(false);
  };

  const handleChangePassword = async () => {
    setMessage("");
    setErrorMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please enter both password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorMessage(error.message);
      setChangingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    setMessage("Password changed successfully!");
    setChangingPassword(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-12">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👤</div>

          <h1 className="text-3xl font-bold text-gray-800">
            My Profile
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your account information
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-center font-medium">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Name */}
        <div className="mb-5">
          <label className="block font-semibold text-gray-700 mb-2">
            Name
          </label>

          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {savingName ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="block font-semibold text-gray-700 mb-2">
            Email
          </label>

          <input
            type="email"
            value={user?.email || ""}
            readOnly
            className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl text-gray-600"
          />
        </div>

        {/* Account ID */}
        <div className="mb-8">
          <label className="block font-semibold text-gray-700 mb-2">
            Account ID
          </label>

          <input
            type="text"
            value={user?.id || ""}
            readOnly
            className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl text-gray-600 text-sm"
          />
        </div>

        {/* Change Password */}
        <div className="border-t border-gray-200 pt-7">
          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            Change Password
          </h2>

          {/* New Password */}
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 p-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3 text-gray-500"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative mb-4">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 p-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-4 top-3 text-gray-500"
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {changingPassword
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-lg mt-5 hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}