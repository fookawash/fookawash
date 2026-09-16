"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modals
  const [showVehicleSection, setShowVehicleSection] = useState(false);
  const [showAddressSection, setShowAddressSection] = useState(false);

  // Vehicles
  const [savedVehicles, setSavedVehicles] = useState<any[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleCompany, setVehicleCompany] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Addresses
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [address, setAddress] = useState("");
  const [addressLatitude, setAddressLatitude] = useState<number | null>(null);
  const [addressLongitude, setAddressLongitude] = useState<number | null>(null);
  const [addressLocationLoading, setAddressLocationLoading] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/phone-login");
        return;
      }

      setUser(user);
      setPhone(user.phone || "");

      // Pull synced name from public.profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setName(profile?.full_name || user.user_metadata?.full_name || "");

      // Pull saved vehicles
      const { data: vehicles } = await supabase
        .from("saved_vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSavedVehicles(vehicles || []);

      // Pull saved addresses
      const { data: addresses } = await supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSavedAddresses(addresses || []);

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

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", user.id);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMessage("Name updated successfully!");
    }
    setSavingName(false);
  };

  const handleSaveVehicle = async () => {
    setMessage("");
    setErrorMessage("");

    if (!vehicleNumber.trim() || !vehicleCompany.trim() || !vehicleModel.trim()) {
      setErrorMessage("Please fill all vehicle fields.");
      return;
    }

    setSavingVehicle(true);

    const { data, error } = await supabase
      .from("saved_vehicles")
      .insert([
        {
          user_id: user.id,
          car_number: vehicleNumber.trim().toUpperCase(),
          car_company: vehicleCompany.trim(),
          car_model: vehicleModel.trim(),
          is_default: savedVehicles.length === 0,
        },
      ])
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSavedVehicles((prev) => [data, ...prev]);
      setVehicleNumber("");
      setVehicleCompany("");
      setVehicleModel("");
      setMessage("Vehicle added successfully!");
    }
    setSavingVehicle(false);
  };

  const handleSaveAddress = async () => {
    setMessage("");
    setErrorMessage("");

    if (!address.trim()) {
      setErrorMessage("Address cannot be empty.");
      return;
    }

    setSavingAddress(true);

    const { data, error } = await supabase
      .from("saved_addresses")
      .insert([
        {
          user_id: user.id,
          address: address.trim(),
          latitude: addressLatitude,
          longitude: addressLongitude,
          is_default: savedAddresses.length === 0,
        },
      ])
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSavedAddresses((prev) => [data, ...prev]);
      setAddress("");
      setAddressLatitude(null);
      setAddressLongitude(null);
      setMessage("Address saved successfully!");
    }
    setSavingAddress(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported on this browser.");
      return;
    }

    setAddressLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddressLatitude(latitude);
        setAddressLongitude(longitude);

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const readable = [
              data.locality,
              data.city,
              data.principalSubdivision,
              data.postcode,
            ]
              .filter(Boolean)
              .filter((val, idx, arr) => arr.indexOf(val) === idx)
              .join(", ");
            setAddress(readable || `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          } else {
            setAddress(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
        } catch {
          setAddress(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        } finally {
          setAddressLocationLoading(false);
        }
      },
      () => {
        setErrorMessage("Location access was denied. Please enter address manually.");
        setAddressLocationLoading(false);
      },
      { timeout: 15000 }
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/phone-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading profile...
        </p>
      </div>
    );
  }

  const defaultVehicle = savedVehicles.find((v) => v.is_default) || savedVehicles[0];
  const defaultAddress = savedAddresses.find((a) => a.is_default) || savedAddresses[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <span>&lsaquo;</span>
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-orange-100 shadow-sm">
              <Image
                src="/icon-192.png"
                alt="FOOKA"
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
            <span className="font-black text-sm uppercase tracking-wider bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
              FOOKA WASH
            </span>
          </div>

          <Link
            href="/help"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
          >
            Help & FAQs
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-[#FF6B00] via-[#FF3366] to-[#E11D48] rounded-3xl p-6 text-white shadow-xl shadow-rose-900/15 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl font-black">
            {name ? name.charAt(0).toUpperCase() : "👤"}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2.5 py-0.5 rounded-md">
              Verified Customer
            </span>
            <h1 className="text-xl font-black mt-1">{name || "Valued Customer"}</h1>
            <p className="text-xs text-rose-100 font-mono mt-0.5">
              📱 {phone || "Phone Verified"}
            </p>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
            {message}
          </div>
        )}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* Personal Details */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Account Information
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Full Name
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="flex-1 min-h-[48px] border border-slate-200 rounded-xl px-3.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-900"
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="px-5 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-95 disabled:opacity-50 transition"
              >
                {savingName ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Registered Mobile Number
            </label>
            <input
              type="text"
              value={phone || "Verified Phone"}
              readOnly
              className="w-full min-h-[48px] border border-slate-200 bg-slate-100/60 rounded-xl px-3.5 text-sm font-mono text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Saved Vehicles */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>🚗</span> Saved Vehicles
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {savedVehicles.length === 0
                  ? "No vehicle registered"
                  : `${savedVehicles.length} car${savedVehicles.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowVehicleSection(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition"
            >
              Manage
            </button>
          </div>

          {defaultVehicle && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-xs text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded inline-block">
                  {defaultVehicle.car_number}
                </p>
                <p className="font-bold text-sm text-slate-800 mt-1">
                  {defaultVehicle.car_company} {defaultVehicle.car_model}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-md">
                Default
              </span>
            </div>
          )}
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>📍</span> Saved Addresses
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {savedAddresses.length === 0
                  ? "No addresses saved"
                  : `${savedAddresses.length} saved location${savedAddresses.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddressSection(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
            >
              Manage
            </button>
          </div>

          {defaultAddress && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
              <p className="font-medium text-xs text-slate-700 truncate flex-1">
                {defaultAddress.address}
              </p>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-md shrink-0">
                Default
              </span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 font-black text-xs uppercase tracking-wider hover:bg-rose-100 active:scale-95 transition"
        >
          Sign Out of Account
        </button>
      </div>

      {/* Vehicle Modal */}
      {showVehicleSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900">Manage Vehicles</h3>
              <button
                type="button"
                onClick={() => setShowVehicleSection(false)}
                className="text-slate-400 font-black text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <input
                type="text"
                value={vehicleCompany}
                onChange={(e) => setVehicleCompany(e.target.value)}
                placeholder="Brand (e.g. Maruti, Tata)"
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white outline-none"
              />
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Model (e.g. Swift, Nexon)"
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white outline-none"
              />
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="Number (e.g. WB56GH6754)"
                maxLength={10}
                className="w-full border border-slate-200 p-2.5 rounded-xl uppercase font-mono font-bold text-xs bg-white outline-none"
              />
              <button
                type="button"
                onClick={handleSaveVehicle}
                disabled={savingVehicle}
                className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {savingVehicle ? "Adding..." : "+ Add Vehicle"}
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {savedVehicles.map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-slate-200 p-3 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      {v.car_number}
                    </span>
                    <p className="font-bold text-xs text-slate-800 mt-0.5">
                      {v.car_company} {v.car_model}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.from("saved_vehicles").delete().eq("id", v.id);
                      setSavedVehicles((prev) => prev.filter((item) => item.id !== v.id));
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900">Manage Addresses</h3>
              <button
                type="button"
                onClick={() => setShowAddressSection(false)}
                className="text-slate-400 font-black text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address (flat, landmark, city)..."
                rows={2}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white outline-none resize-none"
              />
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={addressLocationLoading}
                className="w-full border border-sky-200 bg-sky-50 text-sky-700 py-2 rounded-xl font-bold text-xs hover:bg-sky-100 transition"
              >
                {addressLocationLoading ? "Detecting GPS..." : "🎯 Pin Current Location"}
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {savingAddress ? "Saving..." : "+ Save Address"}
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {savedAddresses.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-200 p-3 flex items-center justify-between gap-3"
                >
                  <p className="text-xs font-medium text-slate-700 truncate flex-1">
                    {a.address}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.from("saved_addresses").delete().eq("id", a.id);
                      setSavedAddresses((prev) => prev.filter((item) => item.id !== a.id));
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}