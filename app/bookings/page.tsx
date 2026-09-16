"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface BookingRecord {
  id: string;
  name: string;
  phone: string;
  car_company: string | null;
  car_model: string | null;
  car_number: string | null;
  service: string;
  price: number;
  date: string;
  time: string;
  location_address: string;
  status: string;
  payment_status: string;
  assigned_partner_id: string | null;
  created_at: string;
}

const STAGES = [
  { key: "pending", label: "Pending", icon: "⏳" },
  { key: "confirmed", label: "Confirmed", icon: "✓" },
  { key: "on the way", label: "On the way", icon: "🛵" },
  { key: "arrived", label: "Arrived", icon: "📍" },
  { key: "washing", label: "Washing", icon: "🧽" },
  { key: "completed", label: "Completed", icon: "✨" },
];

function getStageIndex(status: string | null) {
  const s = status?.toLowerCase() || "pending";
  return STAGES.findIndex((st) => st.key === s);
}

export default function BookingsPage() {
  const formatTimeRange = (time: string) => {
    if (!time) return "Scheduled";
    const [hour, minute] = time.slice(0, 5).split(":").map(Number);
    const start = new Date(2000, 0, 1, hour, minute);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const format = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    return `${format(start)} - ${format(end)}`;
  };

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<any | null>(null);

  // Review states
  const [reviewBooking, setReviewBooking] = useState<BookingRecord | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [bookingReviews, setBookingReviews] = useState<Record<string, any>>({});

  // Partner live locations
  const [partnerLocations, setPartnerLocations] = useState<
    Record<
      string,
      {
        latitude: number;
        longitude: number;
        last_location_at: string | null;
        full_name?: string | null;
      }
    >
  >({});

  // 1. Fetch Bookings and listen to Realtime updates
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadBookings = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("booking")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);

      // Clean up previous channel if any
      if (channel) {
        supabase.removeChannel(channel);
      }

      // Unique channel name per component mount to prevent duplicate subscribe conflicts
      const channelTopic = `customer-bookings-${user.id}-${Date.now()}`;

      channel = supabase
        .channel(channelTopic)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "booking",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setBookings((curr) => [payload.new as BookingRecord, ...curr]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "booking",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as BookingRecord;
            setBookings((curr) =>
              curr.map((b) => (b.id === updated.id ? updated : b))
            );
            setStatusNotification(updated);
            setTimeout(() => setStatusNotification(null), 6000);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "booking",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setBookings((curr) => curr.filter((b) => b.id !== payload.old.id));
          }
        )
        .subscribe();
    };

    loadBookings();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // 2. Load Reviews
  useEffect(() => {
    const loadReviews = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("booking_reviews")
        .select("*")
        .eq("user_id", user.id);

      if (data) {
        const reviewMap: Record<string, any> = {};
        data.forEach((r) => {
          reviewMap[r.booking_id] = r;
        });
        setBookingReviews(reviewMap);
      }
    };

    loadReviews();
  }, []);

  // 3. Periodic Poll for assigned partner coordinates
  useEffect(() => {
    const loadPartnerLocations = async () => {
      const partnerIds = bookings
        .map((b) => b.assigned_partner_id)
        .filter(Boolean) as string[];

      if (partnerIds.length === 0) {
        setPartnerLocations({});
        return;
      }

      const { data } = await supabase
        .from("partner_profiles")
        .select("user_id, full_name, current_latitude, current_longitude, last_location_at")
        .in("user_id", partnerIds);

      if (data) {
        const locs: Record<string, any> = {};
        data.forEach((p) => {
          if (p.current_latitude !== null && p.current_longitude !== null) {
            locs[p.user_id] = {
              latitude: Number(p.current_latitude),
              longitude: Number(p.current_longitude),
              last_location_at: p.last_location_at,
              full_name: p.full_name,
            };
          }
        });
        setPartnerLocations(locs);
      }
    };

    loadPartnerLocations();
    const interval = setInterval(loadPartnerLocations, 8000);
    return () => clearInterval(interval);
  }, [bookings]);

  // Review handlers
  const handleSaveReview = async () => {
    if (!reviewBooking || reviewRating < 1 || reviewRating > 5) {
      alert("Please select 1 to 5 stars.");
      return;
    }

    setSavingReview(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      setSavingReview(false);
      return;
    }

    let error;
    if (editingReview) {
      const res = await supabase
        .from("booking_reviews")
        .update({
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        })
        .eq("booking_id", reviewBooking.id)
        .eq("user_id", user.id);
      error = res.error;
    } else {
      const res = await supabase.from("booking_reviews").insert([
        {
          booking_id: reviewBooking.id,
          user_id: user.id,
          partner_id: reviewBooking.assigned_partner_id || null,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        },
      ]);
      error = res.error;
    }

    if (error) {
      alert(error.message);
    } else {
      setBookingReviews((prev) => ({
        ...prev,
        [reviewBooking.id]: {
          booking_id: reviewBooking.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        },
      }));
      setReviewBooking(null);
    }
    setSavingReview(false);
  };

  const handleDeleteReview = async (bookingId: string) => {
    if (!window.confirm("Delete your review?")) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("booking_reviews")
      .delete()
      .eq("booking_id", bookingId)
      .eq("user_id", user.id);

    if (!error) {
      setBookingReviews((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      setReviewBooking(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setCancellingId(bookingId);
    const { error } = await supabase
      .from("booking")
      .update({ status: "Cancelled" })
      .eq("id", bookingId);

    if (error) {
      alert("Failed to cancel: " + error.message);
    } else {
      setBookings((curr) =>
        curr.map((b) => (b.id === bookingId ? { ...b, status: "Cancelled" } : b))
      );
    }
    setCancellingId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Loading your bookings...
        </p>
      </main>
    );
  }

  const activeCount = bookings.filter((b) =>
    ["pending", "confirmed", "on the way", "arrived", "washing"].includes(
      b.status?.toLowerCase() || ""
    )
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 select-none">
      {/* Brand Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900">
            <span>‹</span>
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-orange-100 shadow-sm">
              <Image src="/icon-192.png" alt="FOOKA" fill className="object-cover" />
            </div>
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
              FOOKA WASH
            </h1>
          </div>

          
<Link
  href="/booking"   // or "/services"
  className="px-3 py-1.5 rounded-xl bg-gradient-to-r ..."
>
  + New Wash
</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
        {/* Realtime Status Update Banner Alert */}
        {statusNotification && (
          <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 p-0.5 rounded-2xl shadow-md animate-in fade-in">
            <div className="bg-white p-4 rounded-[14px] flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-orange-600">
                  ⚡ Live Status Update
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  Order #{statusNotification.id.slice(0, 8).toUpperCase()} is now{" "}
                  <span className="text-rose-600 underline decoration-2 underline-offset-2">
                    {statusNotification.status}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setStatusNotification(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Page Summary Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Car Washes
            </h2>
            <p className="text-xs text-slate-500">
              {activeCount > 0 ? `${activeCount} active wash in progress` : "All past and scheduled bookings"}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm hover:bg-slate-50"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Bookings Feed */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
            <span className="text-4xl block">🧼</span>
            <h3 className="text-lg font-black text-slate-800">No Bookings Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't scheduled any doorstep car washes yet. Treat your car to a foam shine today!
            </p>
            <div className="pt-2">

              <Link
  href="/booking"   // or "/services"
  className="inline-block px-6 py-3 rounded-xl bg-..."
>
  Book A Wash
</Link>
             
            </div>
          </div>
        ) : (
          bookings.map((item) => {
            const currentIdx = getStageIndex(item.status);
            const isCompleted = item.status?.toLowerCase() === "completed";
            const isCancelled = item.status?.toLowerCase() === "cancelled";
            const partnerLoc = item.assigned_partner_id
              ? partnerLocations[item.assigned_partner_id]
              : null;
            const existingReview = bookingReviews[item.id];

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-5 sm:p-6 space-y-5"
              >
                {/* Header: Service + Order ID + Price */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-md">
                      #{item.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      {item.service}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {item.car_company} {item.car_model} •{" "}
                      <span className="font-mono font-bold text-slate-700">{item.car_number}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 block">₹{item.price}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                        item.payment_status?.toLowerCase() === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.payment_status || "Pay on service"}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Date</span>
                    <span className="font-extrabold text-slate-800">{item.date}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Slot</span>
                    <span className="font-extrabold text-slate-800">{formatTimeRange(item.time)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      📍 {item.location_address}
                    </span>
                  </div>
                </div>

                {/* Live Progress Timeline */}
                {!isCancelled && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Live Service Status
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-50 to-rose-50 text-rose-600 border border-rose-200">
                        {item.status}
                      </span>
                    </div>

                    <div className="relative flex items-center justify-between w-full px-2">
                      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0" />
                      <div
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-sky-400 rounded-full transition-all duration-500 z-0"
                        style={{
                          width: `${(Math.max(0, currentIdx) / (STAGES.length - 1)) * 88}%`,
                        }}
                      />

                      {STAGES.map((st, idx) => {
                        const isReached = idx <= currentIdx;
                        return (
                          <div key={st.key} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                                isReached
                                  ? "bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md shadow-orange-500/25 scale-105"
                                  : "bg-white border-2 border-slate-200 text-slate-400"
                              }`}
                            >
                              {isReached ? st.icon : idx + 1}
                            </div>
                            <span
                              className={`text-[9px] sm:text-[10px] font-bold mt-1.5 text-center ${
                                isReached ? "text-slate-800" : "text-slate-400"
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Live Partner Tracker Card (if on the way, arrived, washing) */}
                {partnerLoc &&
                  ["on the way", "arrived", "washing"].includes(item.status?.toLowerCase()) && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-sky-500/20">
                          🛵
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">
                            {partnerLoc.full_name || "Assigned Partner"}
                          </p>
                          <p className="text-[10px] text-sky-700 font-semibold">
                            Live tracking available
                          </p>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps?q=${partnerLoc.latitude},${partnerLoc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5"
                      >
                        <span>🗺️</span>
                        <span>Track</span>
                      </a>
                    </div>
                  )}

                {/* Completed: Review Section */}
                {isCompleted && (
                  <div>
                    {existingReview ? (
                      <div
                        onClick={() => {
                          setReviewBooking(item);
                          setReviewRating(existingReview.rating);
                          setReviewComment(existingReview.comment || "");
                          setEditingReview(true);
                        }}
                        className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 cursor-pointer hover:bg-amber-50 transition flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-black text-amber-700">
                            ★ {existingReview.rating} / 5 Star Rating Given
                          </span>
                          {existingReview.comment && (
                            <p className="text-xs text-slate-600 italic mt-0.5">
                              "{existingReview.comment}"
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-orange-600">Edit Review ›</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReviewBooking(item);
                          setReviewRating(5);
                          setReviewComment("");
                          setEditingReview(false);
                        }}
                        className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span>⭐</span>
                        <span>Rate & Review Service</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Cancel Booking (Pending / Confirmed only) */}
                {["pending", "confirmed"].includes(item.status?.toLowerCase()) && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => handleCancelBooking(item.id)}
                      disabled={cancellingId === item.id}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
                    >
                      {cancellingId === item.id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ⭐ FOOKA Review Modal ⭐ */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900">
                {editingReview ? "Edit Your Review" : "Rate Your Car Wash"}
              </h3>
              <button
                onClick={() => setReviewBooking(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-lg"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500">
              How was your service for{" "}
              <strong>
                {reviewBooking.car_company} {reviewBooking.car_model}
              </strong>
              ?
            </p>

            {/* Star Selector */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`text-3xl transition-transform active:scale-125 ${
                    star <= reviewRating ? "text-amber-400" : "text-slate-200"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share details about the wash quality, cleanliness, or partner..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-slate-50/50"
            />

            <div className="space-y-2 pt-1">
              <button
                onClick={handleSaveReview}
                disabled={savingReview}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {savingReview ? "Submitting..." : editingReview ? "Save Changes" : "Submit Rating"}
              </button>

              {editingReview && (
                <button
                  onClick={() => handleDeleteReview(reviewBooking.id)}
                  disabled={savingReview}
                  className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50"
                >
                  Delete Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}