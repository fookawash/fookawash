"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 sm:pb-16 select-none">
      
      {/* 1. App Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md border border-orange-100">
              <Image
                src="/icon-192.png"
                alt="FOOKA Logo"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wider bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
                FOOKA WASH
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">
                Doorstep Car Care
              </p>
            </div>
          </div>

          {/* Top Quick Actions (Desktop & Mobile) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Change href from "/my-bookings" to "/bookings" */}
<Link
  href="/bookings"
  className="flex flex-col items-center justify-center py-1.5 text-slate-500 hover:text-slate-900 font-bold text-[11px]"
>
  <span className="text-lg">📋</span>
  <span className="mt-0.5">Bookings</span>
</Link>
            <Link
              href="/booking"
              className="bg-gradient-to-r from-orange-500 to-rose-600 text-white text-xs sm:text-sm font-extrabold px-4 py-2 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-95 active:scale-95 transition"
            >
              Book Wash
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:py-16 px-4 bg-gradient-to-b from-orange-50/60 via-rose-50/30 to-slate-50">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-orange-200 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-xs font-black text-orange-600 tracking-wide uppercase">
              Fast Doorstep Service
            </span>
          </div>

          {/* Hero Heading */}
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Showroom Shine, <br />
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
              Right At Your Doorstep.
            </span>
          </h2>

          <p className="text-base sm:text-xl text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
            Professional high-pressure foam wash, interior vacuuming & detailing at your home or office.
          </p>

          {/* Primary CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/booking"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-black text-base shadow-xl shadow-rose-500/25 hover:shadow-rose-500/35 active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <span>🚗</span>
              <span>Book A Wash Now</span>
              <span>›</span>
            </Link>

            <Link
              href="/services"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 font-extrabold text-sm hover:bg-slate-100 active:scale-95 transition shadow-sm"
            >
              View Service Packages
            </Link>
          </div>

          {/* Mini Trust Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="text-sky-500">💧</span> Zero Scratch Guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-orange-500">⚡</span> 45-Min Service
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">🛡️</span> Verified Washers
            </span>
          </div>
        </div>
      </section>

      {/* 3. Core Features Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
              🧼
            </div>
            <h3 className="text-lg font-black text-slate-900">Pressure Foam Wash</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Snow foam gun technology lifts deep grime and road dust without causing swirl marks on vehicle paint.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
              📍
            </div>
            <h3 className="text-lg font-black text-slate-900">Doorstep Convenience</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              No long queues at service stations. Our partners arrive fully equipped at your parking slot or driveway.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
              📱
            </div>
            <h3 className="text-lg font-black text-slate-900">Live Stage Tracking</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Know the exact moment your partner is on the way, arrived, washing, and ready for handover.
            </p>
          </div>

        </div>
      </section>

      {/* 4. How It Works (Swiggy / Urban Company 3-Step Process) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="text-center max-w-md mx-auto mb-8">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
              Super Simple
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-2">How FOOKA Works</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Car care delivered in 3 quick steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-orange-500/30">
                1
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">Choose Package & Slot</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Pick your car model, preferred wash package, date and time.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-rose-500/30">
                2
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">Partner Arrives</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                A verified FOOKA washer comes directly to your location with equipment.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-sky-500/30">
                3
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">Inspect & Pay</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Inspect your clean car, rate the partner, and pay after completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Fixed Mobile Bottom Navigation Bar (Play Store App Feel) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-4 py-2">
        <div className="grid grid-cols-3 gap-1 text-center">
          <Link
            href="/"
            className="flex flex-col items-center justify-center py-1.5 text-orange-600 font-extrabold text-[11px]"
          >
            <span className="text-lg">🏠</span>
            <span className="mt-0.5">Home</span>
          </Link>

          <Link
            href="/booking"
            className="flex flex-col items-center justify-center py-1.5 text-slate-500 hover:text-slate-900 font-bold text-[11px]"
          >
            <span className="text-lg">🚗</span>
            <span className="mt-0.5">Book Wash</span>
          </Link>

          <Link
            href="/my-bookings"
            className="flex flex-col items-center justify-center py-1.5 text-slate-500 hover:text-slate-900 font-bold text-[11px]"
          >
            <span className="text-lg">📋</span>
            <span className="mt-0.5">Bookings</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation */}
<nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 flex items-center justify-between shadow-lg">
  <Link href="/" className="flex flex-col items-center gap-0.5 text-orange-600">
    <span className="text-lg">🏠</span>
    <span className="text-[10px] font-bold">Home</span>
  </Link>
  <Link href="/services" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800">
    <span className="text-lg">✨</span>
    <span className="text-[10px] font-bold">Services</span>
  </Link>
  <Link href="/my-bookings" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800">
    <span className="text-lg">📋</span>
    <span className="text-[10px] font-bold">Bookings</span>
  </Link>
  <Link href="/help" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800">
    <span className="text-lg">💬</span>
    <span className="text-[10px] font-bold">Help</span>
  </Link>
  <Link href="/profile" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800">
    <span className="text-lg">👤</span>
    <span className="text-[10px] font-bold">Profile</span>
  </Link>
</nav>

    </main>
  );
}