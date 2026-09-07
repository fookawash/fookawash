"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Bookings() {
  const formatTimeRange = (time: string) => {
    const [hour, minute] = time.slice(0, 5).split(":").map(Number);

    const start = new Date(2000, 0, 1, hour, minute);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const format = (date: Date) =>
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

    return `${format(start)} - ${format(end)}`;
  };

  const [booking, setBooking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<any | null>(null);
  const totalBookings = booking.length;

const activeBookings = booking.filter(
  (item) =>
    item.status === "Pending" ||
    item.status === "Confirmed"
).length;

const completedBookings = booking.filter(
  (item) => item.status === "Completed"
).length;

const isBookingTimePassed = (bookingDate: string, bookingTime: string) => {
  const now = new Date();

  const todayLocal =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

  if (bookingDate !== todayLocal) {
    return bookingDate < todayLocal;
  }

  const [hour, minute] = bookingTime.slice(0, 5).split(":").map(Number);

  const bookingMinutes = hour * 60 + minute;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return bookingMinutes <= currentMinutes;
};

const upcomingBookingReminder = [...booking]
  .filter((item) => {
    if (
      item.status === "Cancelled" ||
      item.status === "Completed"
    ) {
      return false;
    }

    const bookingDateTime = new Date(
      `${item.date}T${item.time}`
    ).getTime();

    return bookingDateTime > Date.now();
  })
  .sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();

    return dateA - dateB;
  })[0] || null;

useEffect(() => {
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const loadBookings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBooking([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("booking")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setBooking(data || []);
    setLoading(false);

    channel = supabase
      .channel(`customer-bookings-${user.id}-${Date.now()}`)

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setBooking((currentBookings) => [
            payload.new,
            ...currentBookings,
          ]);
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
    setBooking((currentBookings) =>
      currentBookings.map((item) =>
        item.id === payload.new.id
          ? payload.new
          : item
      )
    );

    setStatusNotification(payload.new);

    setTimeout(() => {
      setStatusNotification(null);
    }, 5000);
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
          setBooking((currentBookings) =>
            currentBookings.filter(
              (item) => item.id !== payload.old.id
            )
          );
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">
          ⏳ Loading your bookings...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-600">
          My Bookings
        </h1>
        {statusNotification && (
  <div className="w-full max-w-2xl mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-blue-800 font-bold text-lg">
          🔔 Booking Status Updated
        </p>

        <p className="text-gray-700 mt-2">
          Your booking{" "}
          <strong>
            #{statusNotification.id.slice(0, 8).toUpperCase()}
          </strong>{" "}
          is now{" "}
          <strong>{statusNotification.status}</strong>.
        </p>
      </div>

      <button
        onClick={() => setStatusNotification(null)}
        className="text-gray-500 hover:text-gray-800 font-bold text-xl"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  </div>
)}
        <button
  onClick={() => window.location.reload()}
  disabled={refreshing}
  className="bg-gray-800 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-900 transition disabled:bg-gray-400"
>
  🔄 Refresh
</button>

        {booking.length > 0 && (
          <a
            href="/booking?new=true"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            + Book Another Car Wash
          </a>
        )}
      </div>
      {upcomingBookingReminder && (
  <div className="w-full max-w-2xl mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
    <p className="text-blue-800 font-bold text-lg">
      🔔 Upcoming Booking
    </p>

    <p className="text-gray-700 mt-2">
      Your{" "}
      <strong>{upcomingBookingReminder.service}</strong>{" "}
      is scheduled for{" "}
      <strong>{upcomingBookingReminder.date}</strong>.
    </p>

    <p className="text-blue-700 font-semibold mt-1">
      🕒 {formatTimeRange(upcomingBookingReminder.time)}
    </p>
    {upcomingBookingReminder.car_company && upcomingBookingReminder.car_model && (
  <p className="text-sm text-gray-600 mt-2">
    🚘 {upcomingBookingReminder.car_company} {upcomingBookingReminder.car_model}
  </p>
)}

    <p className="text-sm text-gray-600 mt-2">
      🚗 {upcomingBookingReminder.car_number}
    </p>
  </div>
)}

{booking.length > 0 && (
  <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
    <div className="bg-white border border-blue-100 rounded-xl p-4 text-center shadow-sm">
      <p className="text-sm font-semibold text-gray-500">
        Total Bookings
      </p>
      <p className="text-2xl font-bold text-blue-600 mt-1">
        {totalBookings}
      </p>
    </div>

    <div className="bg-white border border-yellow-100 rounded-xl p-4 text-center shadow-sm">
      <p className="text-sm font-semibold text-gray-500">
        Active
      </p>
      <p className="text-2xl font-bold text-yellow-600 mt-1">
        {activeBookings}
      </p>
    </div>

    <div className="bg-white border border-green-100 rounded-xl p-4 text-center shadow-sm">
      <p className="text-sm font-semibold text-gray-500">
        Completed
      </p>
      <p className="text-2xl font-bold text-green-600 mt-1">
        {completedBookings}
      </p>
    </div>
  </div>
)}



      {booking.length > 0 ? (
        booking.map((item: any) => (
          <div
            key={item.id}
            className="mt-6 w-full max-w-2xl mx-auto bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-gray-100"
          >
            {/* Booking Header */}
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Booking Details
              </h2>

              <span className="text-2xl">🚗</span>
            </div>

            {/* Basic Booking Information */}
            <div className="space-y-3 text-gray-700">

              
              {/* Booking ID */}
<div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase">
      Booking ID
    </p>

    <p
      className="text-lg font-bold text-blue-700 mt-1"
      title={item.id}
    >
      #{item.id.slice(0, 8).toUpperCase()}
    </p>
  </div>

  <button
    onClick={async () => {
      try {
        await navigator.clipboard.writeText(item.id);
        alert("Booking ID copied!");
      } catch (error) {
        console.error(error);
        alert("Unable to copy Booking ID.");
      }
    }}
    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
  >
    📋 Copy ID
  </button>
</div>

              {/* Name */}
              <p className="break-words">
                <strong>Name:</strong> {item.name}
              </p>

              {/* Phone */}
              <p className="break-words">
                <strong>Phone:</strong>{" "}
                {item.phone ? (
                  <a
                    href={`tel:${item.phone}`}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {item.phone}
                  </a>
                ) : (
                  "Not provided"
                )}
              </p>

              {/* Car Number */}
              {item.car_company && item.car_model && (
  <p className="break-woeds">
    🚘 Car: {item.car_company} {item.car_model}
  </p>
)}
              <p className="break-words">
                <strong>Car Number:</strong> {item.car_number}
              </p>

              {/* Service */}
              <p className="break-words">
                <strong>Service:</strong> {item.service}
              </p>

              {/* Date / Time / Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500">
                    DATE
                  </p>

                  <p className="font-bold text-blue-700 mt-1">
                    {item.date}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500">
                    TIME
                  </p>

                  <p className="font-bold text-blue-700 mt-1">
                    {formatTimeRange(item.time)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-xs font-semibold text-gray-500">
                    PRICE
                  </p>

                  <p className="font-bold text-green-700 mt-1">
                    ₹{item.price}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">
                  Payment Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Payment Status
                    </p>

                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${
                        item.payment_status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.payment_status || "Unpaid"}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Payment Method
                    </p>

                    <p className="font-bold text-gray-800 mt-1">
                      Pay after service
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Status */}
              <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-gray-800">
                    Booking Status
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      item.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : item.status === "Confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : item.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                
                {/* Progress */}
<div className="relative mt-6">
  <div
  className={`absolute top-5 left-[16%] right-[16%] h-1 ${
    item.status === "Completed"
      ? "bg-green-500"
      : item.status === "Confirmed"
      ? "bg-gradient-to-r from-green-500 to-gray-200"
      : "bg-gray-200"
  }`}
/>

  <div className="relative grid grid-cols-3 text-center">

    {/* Pending */}
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
          item.status === "Pending" ||
          item.status === "Confirmed" ||
          item.status === "Completed"
            ? "bg-green-500 text-white border-green-500"
            : "bg-white text-gray-400 border-gray-300"
        }`}
      >
        {item.status === "Pending" ||
        item.status === "Confirmed" ||
        item.status === "Completed"
          ? "✓"
          : "1"}
      </div>

      <p className="text-xs sm:text-sm font-bold text-gray-700 mt-2">
        Pending
      </p>
    </div>

    {/* Confirmed */}
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
          item.status === "Confirmed" ||
          item.status === "Completed"
            ? "bg-green-500 text-white border-green-500"
            : "bg-white text-gray-400 border-gray-300"
        }`}
      >
        {item.status === "Confirmed" ||
        item.status === "Completed"
          ? "✓"
          : "2"}
      </div>

      <p className="text-xs sm:text-sm font-bold text-gray-700 mt-2">
        Confirmed
      </p>
    </div>

    {/* Completed */}
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
          item.status === "Completed"
            ? "bg-green-500 text-white border-green-500"
            : "bg-white text-gray-400 border-gray-300"
        }`}
      >
        {item.status === "Completed" ? "✓" : "3"}
      </div>

      <p className="text-xs sm:text-sm font-bold text-gray-700 mt-2">
        Completed
      </p>
    </div>

  </div>
</div>

                {/* Status Explanation */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">
                    {item.status === "Pending"
                      ? "Your booking is waiting for admin confirmation."
                      : item.status === "Confirmed"
                      ? "Your booking has been confirmed. Please arrive at your selected time."
                      : item.status === "Completed"
                      ? "Your car wash service has been completed."
                      : "This booking has been cancelled."}
                  </p>
                </div>
              </div>
            </div>

            {/* Cancel Booking */}
            {(item.status === "Pending" ||
  item.status === "Confirmed") &&
  !isBookingTimePassed(item.date, item.time) && (
              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    `Cancel this booking?\n\nService: ${item.service}\nDate: ${item.date}\nTime: ${formatTimeRange(
                      item.time
                    )}\n\nThis action cannot be undone.`
                  );

                  if (!confirmed) {
                    return;
                  }

                  setCancellingId(item.id);

                  const { error } = await supabase
                    .from("booking")
                    .update({status: "Cancelled"})
                    .eq("id", item.id);

                  if (error) {
                    console.error(error);
                    alert("Cancellation failed!");
                    setCancellingId(null);
                    return;
                  }

                  setBooking((currentBookings) =>
  currentBookings.map((b: any) =>
    b.id === item.id
      ? { ...b, status: "Cancelled" }
      : b
  )
);

                  setCancellingId(null);
                }}
                className="mt-5 w-full sm:w-auto bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-red-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={cancellingId === item.id}
              >
                {cancellingId === item.id
                  ? "Cancelling..."
                  : "Cancel Booking"}
              </button>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📅</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No bookings yet
          </h2>

          <p className="text-gray-500 mb-6">
            You haven't made any car wash bookings yet.
          </p>

          <a
            href="/booking"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Book Now
          </a>
        </div>
      )}
    </main>
  );
}