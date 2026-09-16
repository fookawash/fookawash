"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Service = {
  id: number;
  name: string;
  price: number;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price")
        .order("id", { ascending: true });

      if (error) {
        console.error("Services fetch error:", error);
        setError("Unable to load services at this moment.");
        setLoading(false);
        return;
      }

      setServices(data || []);
      setLoading(false);
    };

    loadServices();
  }, []);

  const getIcon = (name: string) => {
    if (name === "Basic Wash") return "🚗";
    if (name === "Premium Wash") return "🫧";
    if (name === "Interior Cleaning") return "🧽";
    if (name === "Full Car Cleaning") return "✨";
    return "🚿";
  };

  const getDescription = (name: string) => {
    if (name === "Basic Wash") {
      return "Exterior high-pressure foam wash, tyre dressing & crystal clear glass wipe.";
    }
    if (name === "Premium Wash") {
      return "Complete foam wash, wheel arch cleaning, cabin vacuuming & dashboard polish.";
    }
    if (name === "Interior Cleaning") {
      return "Deep cabin detailing, seat vacuuming, floor mat shampooing & AC vent dust removal.";
    }
    if (name === "Full Car Cleaning") {
      return "Comprehensive exterior pressure wash + interior deep detail + protective spray wax.";
    }
    return "Professional doorstep car detailing and wash service.";
  };

  const getBadge = (name: string) => {
    if (name === "Premium Wash") return "Most Popular";
    if (name === "Full Car Cleaning") return "Best Value";
    return null;
  };

  const getFeatures = (name: string) => {
    if (name === "Basic Wash") {
      return ["High-Pressure Rinse", "Snow Foam Wash", "Tyre Dressing", "Glass Clean"];
    }
    if (name === "Premium Wash") {
      return ["Snow Foam Wash", "Cabin Vacuuming", "Dashboard Polish", "Door Jambs Clean"];
    }
    if (name === "Interior Cleaning") {
      return ["Deep Mat Wash", "Upholstery Vacuum", "Dashboard Conditioning", "Boot Clean"];
    }
    if (name === "Full Car Cleaning") {
      return ["Complete Foam Wash", "Full Cabin Detail", "High-Gloss Spray Wax", "Engine Bay Dusting"];
    }
    return ["Doorstep Service", "Scratch-Free Wash", "Eco-Friendly Foam"];
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 sm:pb-16 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <span>&lsaquo;</span>
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-orange-100 shadow-sm">
              <Image
                src="/icon-192.png"
                alt="FOOKA Logo"
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
            <span className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
              FOOKA WASH
            </span>
          </div>

          <Link
            href="/my-bookings"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            My Bookings
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="px-4 pt-6 sm:pt-10 pb-6 max-w-6xl mx-auto text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-black text-orange-600 uppercase tracking-wide">
          <span>✨</span> Doorstep Packages
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
          Our Wash Packages
        </h1>

        <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
          Choose the ideal wash package for your car. All services are performed at your doorstep with pay-on-completion.
        </p>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading packages...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-md mx-auto my-12 p-5 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-black text-rose-600 underline uppercase tracking-wider"
          >
            Tap to retry
          </button>
        </div>
      )}

      {/* Services Grid */}
      {!loading && !error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((service) => {
              const badge = getBadge(service.name);
              const features = getFeatures(service.name);

              return (
                <div
                  key={service.id}
                  className="relative bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
                >
                  {badge && (
                    <span className="absolute -top-3 right-5 bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md shadow-rose-500/20">
                      {badge}
                    </span>
                  )}

                  <div>
                    {/* Icon & Title */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 via-rose-50 to-sky-50 border border-slate-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform">
                      {getIcon(service.name)}
                    </div>

                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {service.name}
                    </h2>

                    <p className="text-xs text-slate-500 mt-2 leading-relaxed min-h-[36px]">
                      {getDescription(service.name)}
                    </p>

                    {/* Features Checklist */}
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      {features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Fare
                      </span>
                      <span className="text-2xl font-black text-slate-900">
                        ₹{service.price}
                      </span>
                    </div>

                    <Link
                      href={`/booking?service=${encodeURIComponent(service.name)}`}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 active:scale-95 transition flex items-center gap-1"
                    >
                      <span>Book</span>
                      <span>&rsaquo;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee Note */}
          <div className="mt-12 text-center text-xs font-semibold text-slate-500 flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
            <span>🛡️ 100% Paint-Safe Foam</span>
            <span>💧 Verified Doorstep Washers</span>
            <span>💵 Pay After Handover</span>
          </div>
        </div>
      )}
    </main>
  );
}