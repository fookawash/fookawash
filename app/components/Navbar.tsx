"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_UID = "8c45b8fe-6c06-4ff4-897d-90864bd8606b";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setIsAdmin(user?.id === ADMIN_UID);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.id === ADMIN_UID);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/phone-login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3.5">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-2 group"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-orange-100 shadow-sm group-hover:scale-105 transition-transform">
            <Image
              src="/icon-192.png"
              alt="FOOKA WASH Logo"
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <span className="font-black text-lg sm:text-xl tracking-wider uppercase bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
            FOOKA WASH
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-xs font-bold text-slate-600 hover:text-orange-600 transition"
          >
            Home
          </Link>

          <Link
            href="/services"
            className="text-xs font-bold text-slate-600 hover:text-orange-600 transition"
          >
            Services
          </Link>

          <Link
            href="/help"
            className="text-xs font-bold text-slate-600 hover:text-orange-600 transition"
          >
            Help & Support
          </Link>

          <Link
            href="/about"
            className="text-xs font-bold text-slate-600 hover:text-orange-600 transition"
          >
            About
          </Link>

          {!loading && isAdmin && (
            <Link
              href="/admin"
              className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition"
            >
              Admin
            </Link>
          )}

          {!loading && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/booking"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 active:scale-95 transition"
              >
                Book Now
              </Link>

              <Link
                href="/bookings"
                className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              >
                My Bookings
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
              >
                <span>👤</span>
                <span>Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/phone-login"
                className="text-xs font-bold text-slate-700 hover:text-orange-600 transition px-2"
              >
                Login
              </Link>

              <Link
                href="/phone-signup"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 active:scale-95 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-800 p-2 focus:outline-none text-xl"
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-2.5 px-6 pb-6 pt-2 bg-white border-t border-slate-100 animate-in fade-in">
          <Link
            href="/"
            onClick={closeMenu}
            className="font-bold text-sm text-slate-800 py-2 border-b border-slate-100"
          >
            🏠 Home
          </Link>

          <Link
            href="/services"
            onClick={closeMenu}
            className="font-bold text-sm text-slate-800 py-2 border-b border-slate-100"
          >
            ✨ Services Packages
          </Link>

          <Link
            href="/help"
            onClick={closeMenu}
            className="font-bold text-sm text-slate-800 py-2 border-b border-slate-100"
          >
            💬 Help & Support
          </Link>

          <Link
            href="/about"
            onClick={closeMenu}
            className="font-bold text-sm text-slate-800 py-2 border-b border-slate-100"
          >
            ℹ️ About FOOKA
          </Link>

          {!loading && isAdmin && (
            <Link
              href="/admin"
              onClick={closeMenu}
              className="font-bold text-sm text-purple-600 py-2 border-b border-slate-100"
            >
              ⚙️ Admin Dashboard
            </Link>
          )}

          {!loading && user ? (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/booking"
                onClick={closeMenu}
                className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-extrabold text-sm shadow-md"
              >
                Book Now
              </Link>

              <Link
                href="/bookings"
                onClick={closeMenu}
                className="font-bold text-sm text-slate-800 py-2 border-b border-slate-100"
              >
                📋 My Bookings
              </Link>

              <Link
                href="/profile"
                onClick={closeMenu}
                className="font-bold text-sm text-slate-800 py-2 border-b border-slate-100"
              >
                👤 My Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left font-bold text-sm text-rose-600 py-2"
              >
                🚪 Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/phone-login"
                onClick={closeMenu}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm"
              >
                Login with Phone
              </Link>

              <Link
                href="/phone-signup"
                onClick={closeMenu}
                className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-extrabold text-sm shadow-md"
              >
                Sign Up Now
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}