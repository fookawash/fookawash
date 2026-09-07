"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_UID = "8c45b8fe-6c06-4ff4-897d-90864bd8606b";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
    window.location.href = "/login";
  };

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-600 px-6 sm:px-8 py-4 text-white shadow-md">

      {/* Logo */}
      <a
        href="/"
        className="text-2xl sm:text-3xl font-extrabold tracking-wide hover:text-blue-100 transition"
      >
        🚗 CarWash
      </a>

      {/* Navigation Links */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">

        <a
          href="/"
          className="font-semibold hover:text-blue-100 transition"
        >
          Home
        </a>

        <a
          href="/services"
          className="font-semibold hover:text-blue-100 transition"
        >
          Services
        </a>

        <a
          href="/about"
          className="font-semibold hover:text-blue-100 transition"
        >
          About
        </a>

        {!loading && isAdmin && (
          <a
            href="/admin"
            className="font-semibold hover:text-blue-100 transition"
          >
            Admin
          </a>
        )}

        {!loading && user ? (
          <>
            <a
              href="/booking"
              className="font-semibold bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
            >
              Book Now
            </a>
            <a
  href="/profile"
  className="font-semibold hover:text-blue-100 transition"
>
  Profile
</a>
            <a
  href="/bookings"
  className="font-semibold hover:text-blue-100 transition"
>
  My Bookings
</a>

            <button
              onClick={handleLogout}
              className="font-semibold bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a
              href="/login"
              className="font-semibold hover:text-blue-100 transition"
            >
              Login
            </a>

            <a
              href="/signup"
              className="font-semibold bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
            >
              Sign Up
            </a>
          </>
        )}

      </div>
    </nav>
  );
}