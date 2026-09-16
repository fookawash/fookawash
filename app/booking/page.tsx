"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
const X = ({ className }: { className?: string }) => (
  <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Home = ({ className }: { className?: string }) => <span className={className}>🏠</span>;
const Briefcase = ({ className }: { className?: string }) => <span className={className}>💼</span>;
const MapPin = ({ className }: { className?: string }) => <span className={className}>📍</span>;

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  badge?: string;
  desc: string;
  icon: string;
}

const serviceList: ServiceItem[] = [
  {
    id: "Basic Wash",
    name: "Basic Wash",
    price: 299,
    desc: "Exterior foam wash, tyre dressing & glass wipe",
    icon: "🚗",
  },
  {
    id: "Premium Wash",
    name: "Premium Wash",
    price: 399,
    badge: "Popular",
    desc: "Pressure foam wash, interior vacuum & dashboard shine",
    icon: "🫧",
  },
  {
    id: "Interior Cleaning",
    name: "Interior Deep Clean",
    price: 499,
    desc: "Full cabin vacuuming, mat cleaning & upholstery care",
    icon: "🧽",
  },
  {
    id: "Full Car Cleaning",
    name: "Full Car Detailing",
    price: 599,
    badge: "Best Value",
    desc: "Pressure foam wash + deep interior detailing + wax gloss",
    icon: "✨",
  },
];

const carModels: { [key: string]: string[] } = {
  "Maruti Suzuki": ["Alto", "Swift", "Baleno", "Wagon R", "Dzire", "Brezza", "Ertiga", "Fronx"],
  Hyundai: ["Grand i10 Nios", "i20", "Exter", "Venue", "Verna", "Creta", "Alcazar"],
  Tata: ["Tiago", "Tigor", "Altroz", "Punch", "Nexon", "Harrier", "Safari"],
  Mahindra: ["XUV 3XO", "Bolero", "Scorpio", "Thar", "XUV700"],
  Toyota: ["Glanza", "Urban Cruiser Hyryder", "Innova Crysta", "Innova Hycross", "Fortuner"],
  Honda: ["Amaze", "City", "Elevate"],
  Kia: ["Sonet", "Seltos", "Carens"],
  Volkswagen: ["Polo", "Virtus", "Taigun"],
  Skoda: ["Slavia", "Kushaq", "Kodiaq"],
  Renault: ["Kwid", "Triber", "Kiger"],
  Nissan: ["Magnite"],
  BMW: ["2 Series", "3 Series", "5 Series", "X1", "X3"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC"],
  Audi: ["A4", "A6", "Q3", "Q5"],
  Other: ["Other Model"],
};

const allTimeSlots = [
  { value: "06:00", label: "06:00 AM - 06:30 AM" },
  { value: "06:30", label: "06:30 AM - 07:00 AM" },
  { value: "07:00", label: "07:00 AM - 07:30 AM" },
  { value: "07:30", label: "07:30 AM - 08:00 AM" },
  { value: "08:00", label: "08:00 AM - 08:30 AM" },
  { value: "08:30", label: "08:30 AM - 09:00 AM" },
  { value: "09:00", label: "09:00 AM - 09:30 AM" },
  { value: "09:30", label: "09:30 AM - 10:00 AM" },
  { value: "10:00", label: "10:00 AM - 10:30 AM" },
  { value: "10:30", label: "10:30 AM - 11:00 AM" },
  { value: "11:00", label: "11:00 AM - 11:30 AM" },
  { value: "11:30", label: "11:30 AM - 12:00 PM" },
  { value: "12:00", label: "12:00 PM - 12:30 PM" },
  { value: "12:30", label: "12:30 PM - 01:00 PM" },
  { value: "13:00", label: "01:00 PM - 01:30 PM" },
  { value: "13:30", label: "01:30 PM - 02:00 PM" },
  { value: "14:00", label: "02:00 PM - 02:30 PM" },
  { value: "14:30", label: "02:30 PM - 03:00 PM" },
  { value: "15:00", label: "03:00 PM - 03:30 PM" },
  { value: "15:30", label: "03:30 PM - 04:00 PM" },
  { value: "16:00", label: "04:00 PM - 04:30 PM" },
  { value: "16:30", label: "04:30 PM - 05:00 PM" },
  { value: "17:00", label: "05:00 PM - 05:30 PM" },
  { value: "17:30", label: "05:30 PM - 06:00 PM" },
  { value: "18:00", label: "06:00 PM - 06:30 PM" },
  { value: "18:30", label: "06:30 PM - 07:00 PM" },
  { value: "19:00", label: "07:00 PM - 07:30 PM" },
  { value: "19:30", label: "07:30 PM - 08:00 PM" },
];

export default function BookingPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [carCompany, setCarCompany] = useState("");
  const [carModel, setCarModel] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [service, setService] = useState("Basic Wash");

  // Address Modal States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [bookingFor, setBookingFor] = useState<"myself" | "someone_else">("myself");
  const [addressTag, setAddressTag] = useState<"Home" | "Work" | "Other">("Home");
  const [flatBuilding, setFlatBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [locality, setLocality] = useState("Lake Town, Kolkata");
  const [landmark, setLandmark] = useState("");

  // Operating Schedule: 8:00 PM Cutoff Check
  const { minDate, initialDate } = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // If past 8:00 PM (20:00), today is blocked
    if (currentHour >= 20) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormatted = formatDate(tomorrow);
      return { minDate: tomorrowFormatted, initialDate: tomorrowFormatted };
    }

    const todayFormatted = formatDate(now);
    return { minDate: todayFormatted, initialDate: todayFormatted };
  }, []);

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auth & Defaults
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        const devAuth = localStorage.getItem("FOOKA_DEV_AUTH");
        if (devAuth === "true") {
          const devUser = {
            id: "00000000-0000-0000-0000-000000000001",
            user_metadata: { full_name: "Test Customer" },
          };
          setUser(devUser);
          setName("Test Customer");
          setLoadingAuth(false);
          return;
        }
        setLoadingAuth(false);
        router.push("/login");
        return;
      }

      setUser(session.user);
      const savedName = session.user.user_metadata?.full_name;
      if (savedName) setName(savedName);

      const { data: defaultVehicle } = await supabase
        .from("saved_vehicles")
        .select("car_number, car_company, car_model")
        .eq("user_id", session.user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (defaultVehicle) {
        setCarNumber(defaultVehicle.car_number || "");
        setCarCompany(defaultVehicle.car_company || "");
        setCarModel(defaultVehicle.car_model || "");
      }

      const { data: defaultAddress } = await supabase
        .from("saved_addresses")
        .select("address, latitude, longitude")
        .eq("user_id", session.user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (defaultAddress) {
        setLocationAddress(defaultAddress.address || "");
        setLatitude(defaultAddress.latitude ?? null);
        setLongitude(defaultAddress.longitude ?? null);
      }

      setLoadingAuth(false);
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const selectedService = params.get("service");
      if (selectedService && serviceList.some((s) => s.id === selectedService)) {
        setService(selectedService);
      }
    }
  }, []);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          if (!res.ok) throw new Error("Lookup failed");
          const data = await res.json();
          const detectedLocality = data.locality || data.city || "Lake Town, Kolkata";
          setLocality(detectedLocality);

          const fullReadable = [data.locality, data.city, data.principalSubdivision, data.postcode]
            .filter(Boolean)
            .filter((val, idx, arr) => arr.indexOf(val) === idx)
            .join(", ");

          setLocationAddress(fullReadable || `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } catch {
          setLocationAddress(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } finally {
          setLocationLoading(false);
        }
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  const handleSaveModalAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatBuilding.trim()) {
      alert("Please enter your flat, house or building details.");
      return;
    }

    const composed = [
      flatBuilding,
      floor ? `Floor: ${floor}` : "",
      landmark ? `Near ${landmark}` : "",
      locality,
    ]
      .filter(Boolean)
      .join(", ");

    setLocationAddress(composed);
    setIsAddressModalOpen(false);
  };

  const isTimeSlotPast = (slotValue: string) => {
    const now = new Date();
    const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    // If date is tomorrow or later, all slots from 06:00 AM to 08:00 PM are active
    if (date !== todayFormatted) return false;

    const [hour, minute] = slotValue.split(":").map(Number);
    const slotMinutes = hour * 60 + minute;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return slotMinutes <= currentMinutes;
  };

  const selectedServiceObj = serviceList.find((s) => s.id === service) || serviceList[0];

  const isFormValid =
    name &&
    carNumber &&
    /^[6-9]\d{9}$/.test(phone) &&
    carCompany &&
    carModel &&
    locationAddress &&
    service &&
    date &&
    time &&
    !isTimeSlotPast(time);

  const handleBooking = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!name || !carNumber || !phone || !locationAddress || !service || !date || !time) {
      alert("Please fill in all booking fields.");
      return;
    }

    if (date < minDate) {
      alert("Bookings for today are closed after 8:00 PM. Please choose tomorrow or later.");
      return;
    }

    setSubmitting(true);

    const { data: newBooking, error } = await supabase
      .from("booking")
      .insert([
        {
          name,
          car_number: carNumber,
          car_company: carCompany,
          car_model: carModel,
          phone,
          location_address: locationAddress,
          latitude,
          longitude,
          service,
          date,
          time,
          user_id: user.id,
          status: "Pending",
          price: selectedServiceObj.price,
          payment_status: "Unpaid",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Booking submission error:", error);
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setMessage(
      `Booking placed! Order #${newBooking.id.slice(0, 8).toUpperCase()}. Connecting with nearby washers...`
    );

    setTimeout(() => {
      startTransition(() => {
        router.push("/bookings");
      });
    }, 1200);
  };

  if (loadingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-orange-600 font-bold text-xs uppercase tracking-widest">
          Securing your booking session...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-36 select-none">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-bold text-xs"
          >
            <span>&lsaquo;</span>
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 rounded-md overflow-hidden border border-orange-100">
              <Image src="/icon-192.png" alt="FOOKA" fill sizes="24px" className="object-cover" />
            </div>
            <span className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
              FOOKA WASH
            </span>
          </div>

          <Link href="/bookings" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            Bookings
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        {/* Banner */}
        <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-rose-600 rounded-3xl p-6 text-white shadow-xl shadow-rose-900/15">
          <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2.5 py-1 rounded-md">
            Doorstep Service
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Schedule Your Car Wash
          </h1>
          <p className="text-xs sm:text-sm text-rose-100 mt-1">
            Operating daily from 06:00 AM to 08:00 PM.
          </p>
        </div>

        {/* 1. Vehicle Details */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>🚗</span> Vehicle Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Car Brand / Company
              </label>
              <select
                value={carCompany}
                onChange={(e) => {
                  setCarCompany(e.target.value);
                  setCarModel("");
                }}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3.5 text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Company</option>
                {Object.keys(carModels).map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Car Model
              </label>
              <select
                value={carModel}
                disabled={!carCompany}
                onChange={(e) => setCarModel(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3.5 text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{carCompany ? "Select Model" : "Select Brand First"}</option>
                {carCompany &&
                  carModels[carCompany].map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Registration / Plate Number
            </label>
            <input
              type="text"
              placeholder="e.g. WB06HG5767"
              maxLength={10}
              autoCapitalize="characters"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
              className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3.5 text-sm uppercase font-mono font-bold bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:normal-case placeholder:font-sans placeholder:font-normal"
            />
          </div>
        </div>

        {/* 2. Packages */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>🫧</span> Choose Package
            </h2>
            <span className="text-xs font-bold text-orange-600">Pay after wash</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {serviceList.map((item) => {
              const isSelected = service === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setService(item.id)}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  {item.badge && (
                    <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}

                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-lg font-black text-slate-900">₹{item.price}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 mt-2">{item.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Location & Contact */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>📍</span> Doorstep Address
            </h2>
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(true)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 underline"
            >
              Add Detailed Address +
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3.5 text-sm font-semibold bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Service Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Flat / Building, Locality, Landmark"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="px-4 rounded-xl border border-slate-200 font-bold text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0"
              >
                Edit
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className={`w-full py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition ${
              locationLoading
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-wait"
                : "border-sky-300 text-sky-600 bg-sky-50/50 hover:bg-sky-50"
            }`}
          >
            {locationLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                Detecting GPS Location...
              </>
            ) : (
              <>
                <span>🎯</span>
                Auto-Detect Locality via GPS
              </>
            )}
          </button>
        </div>

        {/* 4. Schedule Date & Time (With 8:00 PM cutoff) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>⏰</span> Date & Time
            </h2>
            <span className="text-[10px] font-bold text-slate-400">
              Hours: 6:00 AM – 8:00 PM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Service Date
              </label>
              <input
                type="date"
                value={date}
                min={minDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDate(newDate);
                  setTime("");
                }}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3.5 text-sm font-semibold bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {minDate > new Date().toISOString().split("T")[0] && (
                <p className="text-[11px] text-amber-600 font-semibold mt-1">
                  * Same-day bookings close at 8:00 PM. Booking for tomorrow onwards.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Time Slot
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3.5 text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Time Slot</option>
                {allTimeSlots.map((slot) => {
                  const isPast = isTimeSlotPast(slot.value);
                  return (
                    <option key={slot.value} value={slot.value} disabled={isPast}>
                      {slot.label} {isPast ? " (Passed)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-1">
            <p className="font-extrabold text-sm">Booking Placed Successfully!</p>
            <p className="text-xs text-emerald-700">{message}</p>
          </div>
        )}
      </div>

      {/* Address Drawer Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Save address details</h2>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalAddress} className="p-6 space-y-4 text-xs">
              {/* Who you are booking for */}
              <div>
                <label className="block text-slate-700 font-bold mb-2">
                  Who you are booking for?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="bookingFor"
                      checked={bookingFor === "myself"}
                      onChange={() => setBookingFor("myself")}
                      className="accent-black w-4 h-4"
                    />
                    Myself
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="bookingFor"
                      checked={bookingFor === "someone_else"}
                      onChange={() => setBookingFor("someone_else")}
                      className="accent-black w-4 h-4"
                    />
                    Someone else
                  </label>
                </div>
              </div>

              {/* Tag Selection */}
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">
                  Save address as *
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { type: "Home", icon: Home },
                    { type: "Work", icon: Briefcase },
                    { type: "Other", icon: MapPin },
                  ].map(({ type, icon: Icon }) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setAddressTag(type as any)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition ${
                        addressTag === type
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flat / Building */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Flat / House no / Building name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 3B, Tower 2, Green Apts"
                  value={flatBuilding}
                  onChange={(e) => setFlatBuilding(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 placeholder-slate-400 text-xs"
                />
              </div>

              {/* Floor */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Floor (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3rd Floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 placeholder-slate-400 text-xs"
                />
              </div>

              {/* Locality */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">
                    Area / Sector / Locality *
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="text-blue-600 font-bold hover:underline text-xs"
                  >
                    Change / GPS
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lake Town, Kolkata"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 placeholder-slate-400 text-xs bg-white"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nearby landmark (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Big Bazaar / Clock Tower"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 placeholder-slate-400 text-xs"
                />
              </div>

              <button
  type="submit"
  className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 hover:opacity-95 text-white font-black rounded-2xl tracking-wider uppercase shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all cursor-pointer"
>
  Save Address
</button>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                ₹{selectedServiceObj.price}
              </span>
              <span className="text-[11px] font-bold text-emerald-600">Pay on Handover</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBooking}
            disabled={submitting || !isFormValid}
            className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
              submitting || !isFormValid
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white shadow-rose-500/25 hover:opacity-95 active:scale-95 cursor-pointer"
            }`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <span>Confirm Wash</span>
                <span>&rsaquo;</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}