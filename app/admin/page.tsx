"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { getDistanceFromLatLonInKm } from "@/lib/geo";
import { KOLKATA_ZONES } from "@/lib/zones";

import SopAuditDrawer from "../components/SopAuditDrawer";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const getCurrentBillingCycle = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();
  const isSundayAfter8PM = dayOfWeek === 0 && currentHour >= 20;

  const monday = new Date(now);
  let daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  if (isSundayAfter8PM) {
    monday.setDate(now.getDate() + 1);
  } else {
    monday.setDate(now.getDate() - daysToMonday);
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const disbursementMonday = new Date(sunday);
  disbursementMonday.setDate(sunday.getDate() + 1);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    cycleStartStr: formatDate(monday),
    cycleEndStr: formatDate(sunday),
    isPastSundayCutoff: isSundayAfter8PM,
    cycleLabel: `${monday.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${sunday.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
    disbursementDateStr: formatDate(disbursementMonday),
  };
};

const ADMIN_UIDS = [
  "8c45b8fe-6c06-4ff4-897d-90864bd8606b",
  "bdefbf81-2d1d-4b1b-8466-a3b64e721158",
];

type Partner = {
  id: string;
  user_id: string;
  partner_type: string;
  full_name: string;
  business_name: string | null;
  phone: string;
  email: string;
  address: string;
  status: string;
  verification_status: string;
  operating_zone?: string;
  is_available?: boolean;
  in_hand_cash?: number;
  current_lat?: number | null;
  current_lng?: number | null;
  total_washes_completed?: number;
  avg_wash_time_minutes?: number;
};

interface PartnerPayoutSummary {
  partner_id: string;
  partner_name: string;
  partner_phone: string;
  pending_amount: number;
  pending_washes: number;
}

const formatTimeRange = (time: string) => {
  if (!time) return "";
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  const startMinutes = hour * 60 + minute;
  const endMinutes = startMinutes + 30;

  const formatTime = (totalMinutes: number) => {
    let h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m.toString().padStart(2, "0")} ${period}`;
  };

  return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [reviews, setReviews] = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState<any | null>(null);
  const [selectedBookingForAudit, setSelectedBookingForAudit] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");
  const [dateFilter, setDateFilter] = useState("All");
  const [customDate, setCustomDate] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Partner Weekly Payout States
  const [payoutSummaries, setPayoutSummaries] = useState<PartnerPayoutSummary[]>([]);
  const [settlingPartnerId, setSettlingPartnerId] = useState<string | null>(null);
  const [purgingBookings, setPurgingBookings] = useState(false);

  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  // Billing Cycle Information (Monday 06:00 AM – Sunday 08:00 PM)
  const cycleInfo = useMemo(() => getCurrentBillingCycle(), []);

  // Check whether current time is past Sunday 8:00 PM (enables settlement button)
  const isSettlementWindowOpen = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const hour = now.getHours();
    return (day === 0 && hour >= 20) || day === 1; // Open Sunday after 8:00 PM and throughout Monday
  }, []);

  const fetchPendingPayouts = async (partnersList?: Partner[]) => {
    try {
      const activePartners = partnersList || partners;
      const { data: completedBookings, error } = await supabase
        .from("booking")
        .select("*")
        .eq("status", "Completed")
        .or("payout_status.eq.pending,payout_status.is.null");

      if (error || !completedBookings) return;

      const summaryMap: Record<string, PartnerPayoutSummary> = {};

      completedBookings.forEach((b: any) => {
        const partnerIdentifier = b.assigned_partner_id;
        if (!partnerIdentifier) return;

        const payout =
          Number(b.partner_payout) ||
          Math.round(Number(b.price || 499) * 0.70);

        if (!summaryMap[partnerIdentifier]) {
          const matched = activePartners.find(
            (p) => p.user_id === partnerIdentifier || p.id === partnerIdentifier
          );

          summaryMap[partnerIdentifier] = {
            partner_id: partnerIdentifier,
            partner_name: matched?.full_name || `Partner (${partnerIdentifier.slice(0, 8)})`,
            partner_phone: matched?.phone || "N/A",
            pending_amount: 0,
            pending_washes: 0,
          };
        }

        summaryMap[partnerIdentifier].pending_amount += payout;
        summaryMap[partnerIdentifier].pending_washes += 1;
      });

      setPayoutSummaries(Object.values(summaryMap));
    } catch (err) {
      console.error("Failed to load payout summaries:", err);
    }
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const checkAdminAndLoadData = async () => {
      setChecking(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!isMounted) return;
        setChecking(false);
        router.replace("/login");
        return;
      }

      if (!ADMIN_UIDS.includes(user.id)) {
        if (!isMounted) return;
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      if (!isMounted) return;
      setIsAdmin(true);

      const { data: bookingsData } = await supabase
        .from("booking")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsData && isMounted) {
        const unique = Array.from(
          new Map(bookingsData.map((b) => [b.id, b])).values()
        );
        setBookings(unique);
      }

      const { data: partnerData } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("status", "Approved")
        .eq("verification_status", "verified")
        .order("is_available", { ascending: false });

      if (partnerData && isMounted) {
        setPartners(partnerData as Partner[]);
        fetchPendingPayouts(partnerData as Partner[]);
      }

      const { data: reviewData } = await supabase
        .from("booking_reviews")
        .select("*");

      if (reviewData && isMounted) {
        const revMap: Record<string, any> = {};
        reviewData.forEach((r) => {
          revMap[r.booking_id] = r;
        });
        setReviews(revMap);
      }

      setChecking(false);

      channel = supabase.channel(`admin-live-${Date.now()}`);

      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "booking" },
          (payload) => {
            if (!isMounted) return;
            const newB = payload.new;
            setBookings((curr) => [newB, ...curr.filter((b) => b.id !== newB.id)]);
            setNewBookingAlert(newB);
            setTimeout(() => {
              if (isMounted) setNewBookingAlert(null);
            }, 6000);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "booking" },
          (payload) => {
            if (!isMounted) return;
            const updated = payload.new;

            setBookings((curr) =>
              curr.map((b) => (b.id === updated.id ? updated : b))
            );

            fetchPendingPayouts();

            setSelectedBookingForAudit((curr: any) =>
              curr?.id === updated.id ? updated : curr
            );
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "booking" },
          (payload) => {
            if (!isMounted) return;
            setBookings((curr) => curr.filter((b) => b.id !== payload.old.id));
            fetchPendingPayouts();
          }
        )
        .subscribe();
    };

    checkAdminAndLoadData();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const handleSettlePartner = async (summary: PartnerPayoutSummary) => {
    if (!isSettlementWindowOpen) {
      alert("Settlement Window Locked: Payouts can only be marked as settled after Sunday 8:00 PM.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm weekly payout of ₹${summary.pending_amount} for ${summary.partner_name} (${summary.pending_washes} washes)?\n\nEnsure NEFT/Bank transfer has been executed to the partner's registered bank account.`
    );
    if (!confirmed) return;

    setSettlingPartnerId(summary.partner_id);

    try {
      const { error } = await supabase
        .from("booking")
        .update({ payout_status: "settled" })
        .eq("assigned_partner_id", summary.partner_id)
        .eq("status", "Completed")
        .or("payout_status.eq.pending,payout_status.is.null");

      if (error) throw error;

      setStatusMessage(`Settled ₹${summary.pending_amount} for ${summary.partner_name}!`);
      setTimeout(() => setStatusMessage(""), 4000);
      await fetchPendingPayouts();
    } catch (err: any) {
      alert("Settlement update failed: " + err.message);
    } finally {
      setSettlingPartnerId(null);
    }
  };

  // Rule 1: 1-Click Complete Storage Purge for Past Week's Completed Bookings
  const handlePurgeOldCompletedBookings = async () => {
    const cutoffDate = cycleInfo.cycleStartStr; // Bookings before the active Monday cycle
    const confirmed = window.confirm(
      `Permanent Storage Cleanup:\nAre you sure you want to delete all COMPLETED bookings before ${cutoffDate} (Sunday 8:00 PM Cutoff)?\n\nThis will free up database storage.`
    );

    if (!confirmed) return;

    setPurgingBookings(true);
    try {
      const { error } = await supabase
        .from("booking")
        .delete()
        .eq("status", "Completed")
        .lt("date", cutoffDate);

      if (error) throw error;

      alert(`Historical completed bookings prior to ${cutoffDate} successfully purged from storage.`);
      setBookings((prev) =>
        prev.filter((b) => !(b.status === "Completed" && b.date < cutoffDate))
      );
      await fetchPendingPayouts();
    } catch (err: any) {
      alert("Purge failed: " + err.message);
    } finally {
      setPurgingBookings(false);
    }
  };

  const assignPartner = async (bookingId: string, partnerId: string) => {
    if (!partnerId) return;

    const { error: offerErr } = await supabase.from("booking_offers").insert({
      booking_id: bookingId,
      partner_id: partnerId,
      status: "pending",
      offered_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 1000).toISOString(),
    });

    if (offerErr) {
      alert("Failed to send dispatch offer: " + offerErr.message);
      return;
    }

    await supabase
      .from("booking")
      .update({
        status: "Pending",
        assigned_partner_id: partnerId,
      })
      .eq("id", bookingId);

    setBookings((curr) =>
      curr.map((b) =>
        b.id === bookingId
          ? { ...b, assigned_partner_id: partnerId, status: "Pending" }
          : b
      )
    );

    setStatusMessage("Dispatch offer sent! Awaiting partner response (60s)...");
    setTimeout(() => setStatusMessage(""), 3500);
  };

  const handleAuditPhotoUpdate = (updatedBooking: any) => {
    setBookings((curr) =>
      curr.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    setSelectedBookingForAudit(updatedBooking);
  };

  const filteredBookings = bookings.filter((b) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      b.name?.toLowerCase().includes(term) ||
      b.phone?.toLowerCase().includes(term) ||
      b.car_number?.toLowerCase().includes(term) ||
      b.service?.toLowerCase().includes(term);

    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    const matchPayment =
      paymentFilter === "All" || (b.payment_status || "Unpaid") === paymentFilter;
    const matchZone = zoneFilter === "All" || b.booking_zone === zoneFilter;

    const matchDate =
      dateFilter === "All"
        ? true
        : dateFilter === "Custom"
        ? b.date === customDate
        : b.date === dateFilter;

    return matchSearch && matchStatus && matchPayment && matchZone && matchDate;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
    const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
    return sortOrder === "Newest" ? timeB - timeA : timeA - timeB;
  });

  const totalRevenue = bookings
    .filter((b) => b.status === "Completed" && b.payment_status === "Paid")
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;
  const activeCount = bookings.filter((b) =>
    ["Confirmed", "On the way", "Arrived", "Washing"].includes(b.status)
  ).length;
  const cancelledCount = bookings.filter((b) => b.status === "Cancelled").length;

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl text-center">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-black text-slate-700 tracking-wider uppercase">
            Verifying Executive Clearance...
          </p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-black text-slate-900">Restricted Admin Zone</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            This terminal requires verified administrative permissions for Fooka Wash dispatch.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl hover:opacity-90 shadow-md shadow-orange-500/20 transition"
          >
            Return to App
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafc] text-slate-900 p-4 sm:p-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Brand Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-orange-200 shadow-sm flex-shrink-0">
              <Image src="/icon-192.png" alt="FOOKA" fill className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
                  FOOKA WASH COMMAND
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-md">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Cycle: <span className="font-bold text-slate-700">{cycleInfo.cycleLabel}</span> • Cutoff: Sunday 8:00 PM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {statusMessage && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 animate-in fade-in">
                {statusMessage}
              </span>
            )}
            
            {/* Storage Purge Action */}
            <button
              onClick={handlePurgeOldCompletedBookings}
              disabled={purgingBookings}
              className="text-xs font-bold px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition shadow-sm"
              title="Delete past weeks' completed bookings to reduce Supabase database usage"
            >
              {purgingBookings ? "Purging..." : "🗑️ Purge Past Bookings"}
            </button>

            <Link
              href="/admin/partners/manage"
              className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
            >
              Partner Verification
            </Link>
            <Link
              href="/bookings"
              className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
            >
              Customer View
            </Link>
            <button
              onClick={() => {
                fetchPendingPayouts();
                window.location.reload();
              }}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 text-white hover:opacity-90 transition shadow-md shadow-orange-500/20"
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Realtime Alert Banner */}
        {newBookingAlert && (
          <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 p-0.5 rounded-3xl shadow-xl animate-in fade-in">
            <div className="bg-white p-5 rounded-[22px] flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-orange-500/25 flex-shrink-0">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-md">
                    Incoming Wash Request
                  </span>
                  <p className="text-sm font-black text-slate-900 mt-1">
                    {newBookingAlert.name} ordered {newBookingAlert.service} for ₹{newBookingAlert.price}
                  </p>
                  <p className="text-xs text-slate-500">
                    Vehicle: {newBookingAlert.car_number} • Slot: {newBookingAlert.date} at {formatTimeRange(newBookingAlert.time)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNewBookingAlert(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Metrics Grid with Rule 2 (Cancellations Counter Box Included) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <p className="text-[11px] font-black uppercase text-slate-400">Total Washes</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{bookings.length}</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-orange-200 shadow-sm relative overflow-hidden">
            <p className="text-[11px] font-black uppercase text-amber-700">Pending Assignment</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-rose-50 to-red-50 rounded-3xl border border-rose-200 shadow-sm relative overflow-hidden">
            <p className="text-[11px] font-black uppercase text-rose-700">Active Washers</p>
            <p className="text-3xl font-black text-rose-600 mt-1">{activeCount}</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl border border-rose-300 shadow-sm relative overflow-hidden">
            <p className="text-[11px] font-black uppercase text-rose-800">Cancelled Washes</p>
            <p className="text-3xl font-black text-rose-700 mt-1">{cancelledCount}</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden col-span-2 sm:col-span-1">
            <p className="text-[11px] font-black uppercase text-emerald-700">Realized Revenue</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">₹{totalRevenue}</p>
          </div>
        </div>

        {/* PARTNER PAYOUT SETTLEMENT SECTION (Rule 3 Implemented) */}
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                  Partner Payouts & Weekly Settlements
                </h2>
                {!isSettlementWindowOpen ? (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    🔒 Locks Until Sun 8:00 PM
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 animate-pulse">
                    🔓 Settlement Window Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review weekly 70% wash shares. Settlement button activates after Sunday 08:00 PM for Monday bank transfer (NEFT/Account).
              </p>
            </div>

            <button
              onClick={() => fetchPendingPayouts()}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition self-start sm:self-auto"
            >
              🔄 Refresh Balances
            </button>
          </div>

          {payoutSummaries.length === 0 ? (
            <div className="text-center py-6 text-slate-400 font-medium text-xs">
              ✨ All partner balances are settled! No pending payouts at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {payoutSummaries.map((item) => (
                <div
                  key={item.partner_id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-orange-200 transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900">{item.partner_name}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        {item.pending_washes} {item.pending_washes === 1 ? "wash" : "washes"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">📞 {item.partner_phone}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        • Bank Payout Mode
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Pending Payout
                      </span>
                      <span className="text-lg font-black text-rose-600">
                        ₹{item.pending_amount.toFixed(0)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSettlePartner(item)}
                      disabled={settlingPartnerId === item.partner_id || !isSettlementWindowOpen}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm ${
                        isSettlementWindowOpen
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white cursor-pointer"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                      title={
                        isSettlementWindowOpen
                          ? "Mark as settled"
                          : "Locked during active wash week. Opens Sunday 8:00 PM."
                      }
                    >
                      {settlingPartnerId === item.partner_id
                        ? "Settling..."
                        : isSettlementWindowOpen
                        ? "Mark Settled ✓"
                        : "Locked (Sun 8 PM)"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Search customer, phone, plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="All">All Operational Statuses</option>
              <option value="Pending">Pending (Unassigned)</option>
              <option value="Confirmed">Confirmed</option>
              <option value="On the way">On the way</option>
              <option value="Arrived">Arrived</option>
              <option value="Washing">Washing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="All">All Settlements</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid / Pay on Service</option>
            </select>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="All">All Kolkata Zones</option>
              {KOLKATA_ZONES.map((z: string) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="All">All Dates</option>
              <option value={today}>Scheduled Today</option>
              <option value="Custom">Custom Date</option>
            </select>
          </div>

          {dateFilter === "Custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-xs px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          )}
        </div>

        {/* Orders Feed */}
        {sortedBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-4xl block">🧼</span>
            <p className="text-base font-black text-slate-800">No matching orders found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((item) => {
              const review = reviews[item.id];

              const custLat = item.latitude ?? item.customer_lat ?? null;
              const custLng = item.longitude ?? item.customer_lng ?? null;

              const rankedPartners = partners
                .filter(
                  (p) => !item.booking_zone || p.operating_zone === item.booking_zone
                )
                .map((p) => {
                  const dist = getDistanceFromLatLonInKm(
                    custLat,
                    custLng,
                    p.current_lat,
                    p.current_lng
                  );
                  return { ...p, dist };
                })
                .sort((a, b) => {
                  if (Boolean(a.is_available) !== Boolean(b.is_available)) {
                    return a.is_available ? -1 : 1;
                  }
                  if (a.dist === null) return 1;
                  if (b.dist === null) return -1;
                  return a.dist - b.dist;
                });

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4 hover:border-orange-200 transition"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
                          #{item.id.slice(0, 8).toUpperCase()}
                        </span>
                        {item.booking_zone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                            📍 {item.booking_zone}
                          </span>
                        )}
                        <h3 className="font-black text-base text-slate-900">{item.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {item.service} • ₹{item.price} • {item.date} ({formatTimeRange(item.time)})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          item.payment_status?.toLowerCase() === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.payment_status || "Unpaid"}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                          item.status === "Cancelled"
                            ? "bg-rose-100 text-rose-700 border border-rose-300"
                            : "bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm shadow-orange-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Vehicle Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer Phone</span>
                      {item.phone ? (
                        <a href={`tel:${item.phone}`} className="font-extrabold text-rose-600 hover:underline mt-0.5 block">
                          📞 {item.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 mt-0.5 block">Not provided</span>
                      )}
                    </div>

                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Vehicle Specification</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">
                        {item.car_company} {item.car_model} •{" "}
                        <span className="font-mono text-rose-600">{item.car_number}</span>
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Service Address</span>
                      <span className="font-medium text-slate-700 truncate block mt-0.5">
                        📍 {item.location_address}
                      </span>
                      {custLat && custLng && (
                        <a
                          href={`https://www.google.com/maps?q=${custLat},${custLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-rose-600 hover:underline inline-block mt-1"
                        >
                          Google Maps Pin ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Customer Review Card */}
                  {review && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-amber-700">
                          ★ {review.rating} / 5 Star Customer Rating
                        </span>
                        {review.comment && (
                          <p className="text-slate-600 italic mt-0.5">"{review.comment}"</p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase text-orange-600 bg-white/80 px-2 py-0.5 rounded-md border border-orange-200">
                        Verified Review
                      </span>
                    </div>
                  )}

                  {/* Dispatch Controls */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-50/40 via-orange-50/30 to-slate-50 p-4 rounded-2xl border border-rose-100">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black uppercase text-rose-800 tracking-wider mb-1">
                        Dispatch Washer Partner ({item.booking_zone || "All Zones"})
                      </label>
                      <select
                        value={item.assigned_partner_id || ""}
                        onChange={(e) => assignPartner(item.id, e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                      >
                        <option value="">
                          {rankedPartners.length > 0
                            ? "Select verified partner in this zone..."
                            : "No active partners found in this zone"}
                        </option>
                        {rankedPartners.map((p) => {
                          const onlineStatus = p.is_available ? "🟢 ONLINE" : "🔴 OFFLINE";
                          const distanceText =
                            p.dist !== null ? `${p.dist} km gap` : "GPS Off";
                          const washMetrics = `${p.total_washes_completed || 0} washes (${p.avg_wash_time_minutes || 30}m avg)`;

                          return (
                            <option key={p.id} value={p.user_id}>
                              {onlineStatus} | {p.full_name} ({distanceText}) • {washMetrics} — {p.phone}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* SOP Audit Drawer Trigger */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForAudit(item)}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-slate-200 whitespace-nowrap"
                      >
                        ⏱️ Audit SOP & Photos
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                        Override Status
                      </label>
                      <select
                        value={item.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const { error } = await supabase
                            .from("booking")
                            .update({ status: newStatus })
                            .eq("id", item.id);

                          if (error) {
                            alert("Status update failed: " + error.message);
                          } else {
                            setBookings((curr) =>
                              curr.map((b) => (b.id === item.id ? { ...b, status: newStatus } : b))
                            );
                          }
                        }}
                        className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="On the way">On the way</option>
                        <option value="Arrived">Arrived</option>
                        <option value="Washing">Washing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {item.payment_status !== "Paid" && (
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                          Settlement
                        </label>
                        <button
                          onClick={async () => {
                            const { error } = await supabase
                              .from("booking")
                              .update({ payment_status: "Paid" })
                              .eq("id", item.id);

                            if (!error) {
                              setBookings((curr) =>
                                curr.map((b) =>
                                  b.id === item.id ? { ...b, payment_status: "Paid" } : b
                                )
                              );
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-sm"
                        >
                          Mark Paid
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SopAuditDrawer
        isOpen={Boolean(selectedBookingForAudit)}
        onClose={() => setSelectedBookingForAudit(null)}
        booking={selectedBookingForAudit}
        partner={partners.find((p) => p.user_id === selectedBookingForAudit?.assigned_partner_id)}
        onBookingUpdated={handleAuditPhotoUpdate}
      />
    </main>
  );
}