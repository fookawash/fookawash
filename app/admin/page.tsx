"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const ADMIN_UID = "8c45b8fe-6c06-4ff4-897d-90864bd8606b";

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
const [isAdmin, setIsAdmin] = useState(false);
const [checking, setChecking] = useState(true);
const [newBookingAlert, setNewBookingAlert] = useState<any | null>(null);

const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [statusMessage,setStatusMessage] = useState("");
const [paymentFilter, setPaymentFilter] = useState("All");
const [sortOrder, setSortOrder] = useState("Newest");
const [dateFilter, setDateFilter] = useState("All");
const [customDate, setCustomDate] = useState("");

const router = useRouter();

const filteredBookings = bookings.filter((booking) => {
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    booking.name?.toLowerCase().includes(search) ||
    booking.phone?.toLowerCase().includes(search) ||
    booking.car_number?.toLowerCase().includes(search) ||
    booking.service?.toLowerCase().includes(search);

  const matchesStatus =
  statusFilter === "All" ||
  booking.status === statusFilter;

const matchesDate =
  dateFilter === "All"
    ? true
    : dateFilter === "Custom"
    ? booking.date === customDate
    : booking.date === dateFilter;



  const bookingPaymentStatus = booking.payment_status || "Unpaid";

const matchesPayment =
  paymentFilter === "All" ||
  bookingPaymentStatus === paymentFilter;

return matchesSearch && matchesStatus && matchesPayment && matchesDate;
});

const sortedBookings = [...filteredBookings].sort((a, b) => {
  const dateA = new Date(`${a.date}T${a.time}`).getTime();
  const dateB = new Date(`${b.date}T${b.time}`).getTime();

  return sortOrder === "Newest"
    ? dateB - dateA
    : dateA - dateB;
});
const totalRevenue = bookings
  .filter(
    (booking) =>
      booking.status === "Completed" &&
      booking.payment_status === "Paid"
  )
  .reduce((total, booking) => total + (Number(booking.price) || 0), 0);

  const totalPaid = bookings
  .filter((booking) => booking.payment_status === "Paid")
  .reduce((total, booking) => total + (Number(booking.price) || 0), 0);

const totalUnpaid = bookings
  .filter((booking) => booking.payment_status !== "Paid")
  .reduce((total, booking) => total + (Number(booking.price) || 0), 0);

const today = new Date().toISOString().split("T")[0];

const todayBookings = bookings.filter(
  (booking) => booking.date === today
);

const todayRevenue = todayBookings
  .filter(
    (booking) =>
      booking.status === "Completed" &&
      booking.payment_status === "Paid"
  )
  .reduce((total, booking) => total + (Number(booking.price) || 0), 0);
  const bookingOverview = {
  pending: bookings.filter((booking) => booking.status === "Pending").length,
  confirmed: bookings.filter((booking) => booking.status === "Confirmed").length,
  completed: bookings.filter((booking) => booking.status === "Completed").length,
  cancelled: bookings.filter((booking) => booking.status === "Cancelled").length,

};
const hasPendingBookings = bookingOverview.pending > 0;
const upcomingBookings = Array.from(
  new Map(
    bookings
      .filter(
        (booking) =>
          booking.date > today &&
          booking.status !== "Cancelled" &&
          booking.status !== "Completed"
      )
      .map((booking) => [booking.id, booking])
  ).values()
).sort((a, b) => {
  const dateA = new Date(`${a.date}T${a.time}`).getTime();
  const dateB = new Date(`${b.date}T${b.time}`).getTime();

  return dateA - dateB;
});

const todayActiveBookings = bookings.filter(
  (booking) =>
    booking.date === today &&
    booking.status !== "Cancelled" &&
    booking.status !== "Completed"
);

  useEffect(() => {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let isMounted = true;

  const checkAdminAndLoadBookings = async () => {
    setChecking(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // No logged-in user
    if (!user) {
      if (!isMounted) return;

      setChecking(false);
      router.replace("/login");
      return;
    }

    // Normal customer → deny access
    if (user.id !== ADMIN_UID) {
      if (!isMounted) return;

      setIsAdmin(false);
      setChecking(false);
      return;
    }

    // Admin verified
    if (!isMounted) return;

    setIsAdmin(true);

    const { data, error } = await supabase
      .from("booking")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);

      if (isMounted) {
        setChecking(false);
      }

      return;
    }

    if (!isMounted) return;

    // Remove duplicate booking IDs
    const uniqueBookings = Array.from(
      new Map(
        (data || []).map((booking) => [
          booking.id,
          booking,
        ])
      ).values()
    );

    setBookings(uniqueBookings);
    setChecking(false);

    // Create realtime channel only while component is mounted
    channel = supabase.channel(
      `admin-new-bookings-${Date.now()}-${Math.random()}`
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "booking",
      },
      (payload) => {
        if (!isMounted) return;

        const newBooking = payload.new;

        setBookings((currentBookings) => {
          const alreadyExists = currentBookings.some(
            (booking) => booking.id === newBooking.id
          );

          if (alreadyExists) {
            return currentBookings;
          }

          return [newBooking, ...currentBookings];
        });

        setNewBookingAlert(newBooking);

        setTimeout(() => {
          if (isMounted) {
            setNewBookingAlert(null);
          }
        }, 5000);
      }
    );

    channel.on(
  "postgres_changes",
  {
    event: "UPDATE",
    schema: "public",
    table: "booking",
  },
  (payload) => {
    if (!isMounted) return;

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === payload.new.id
          ? payload.new
          : booking
      )
    );
  }
);

channel.on(
  "postgres_changes",
  {
    event: "DELETE",
    schema: "public",
    table: "booking",
  },
  (payload) => {
    if (!isMounted) return;

    setBookings((currentBookings) =>
      currentBookings.filter(
        (booking) => booking.id !== payload.old.id
      )
    );
  }
);

await channel.subscribe();
  };

  checkAdminAndLoadBookings();

  return () => {
    isMounted = false;

    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}, [router]);
      


  // Loading
  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white px-8 py-6 rounded-2xl shadow-md text-center">
          <div className="text-4xl mb-3">🔐</div>

          <p className="text-gray-700 font-semibold">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  // Access denied
  // Access denied
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md border border-red-100 p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>

          <h1 className="text-2xl font-bold text-red-600">
            Access Denied
          </h1>

          <p className="text-gray-600 mt-2">
            You do not have permission to access the Admin Dashboard.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">

      {/* Header */}
<div className="max-w-6xl mx-auto mb-8">
  <h1 className="text-3xl sm:text-4xl font-bold text-blue-600">
    Admin Dashboard
  </h1>

  <p className="text-gray-500 mt-2">
    Manage customer bookings
  </p>
  {newBookingAlert && (
  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-blue-800 font-bold text-lg">
          🔔 New Booking Received!
        </p>

        <p className="text-gray-700 mt-2">
          <strong>{newBookingAlert.name}</strong> booked{" "}
          <strong>{newBookingAlert.service}</strong>
        </p>

        <p className="text-sm text-gray-600 mt-1">
          🚗 {newBookingAlert.car_number} •{" "}
          {newBookingAlert.date} •{" "}
          {formatTimeRange(newBookingAlert.time)}
        </p>

        <p className="text-sm font-bold text-green-600 mt-1">
          ₹{newBookingAlert.price}
        </p>
      </div>

      <button
        onClick={() => setNewBookingAlert(null)}
        className="text-gray-500 hover:text-gray-800 font-bold text-xl"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>

    <button
      onClick={() => {
        setSearchTerm(newBookingAlert.name);
        setStatusFilter("All");
        setPaymentFilter("All");
        setDateFilter("All");
        setCustomDate("");
        setSortOrder("Newest");
        setNewBookingAlert(null);

        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }}
      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
    >
      View Booking
    </button>
  </div>
)}

  {hasPendingBookings && (
  <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl font-semibold">
    <div>
      🔔 You have {bookingOverview.pending} pending booking
      {bookingOverview.pending !== 1 ? "s" : ""} waiting for confirmation.
    </div>

    <button
      onClick={() => {
        setStatusFilter("Pending");
        setSearchTerm("");
        setPaymentFilter("All");
        setDateFilter("All");
        setCustomDate("");
        setSortOrder("Newest");
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }}
      className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition"
    >
      View Pending Bookings
    </button>
  </div>
)}
</div>

      {/* Check admin */}
      {bookings.length === 0 ? (
        <div className="max-w-6xl mx-auto">

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center">
            <div className="text-5xl mb-3">📋</div>

            <h2 className="text-xl font-bold text-gray-800">
              No bookings yet
            </h2>

            <p className="text-gray-500 mt-2">
              Customer bookings will appear here.
            </p>
          </div>

        </div>
      ) : (
        <div className="max-w-6xl mx-auto">

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            <div className="p-5 rounded-2xl bg-white shadow-md border border-gray-100">
              <h2 className="text-gray-500 font-semibold">
                Total
              </h2>

              <p className="text-2xl font-bold text-gray-800 mt-1">
                {bookings.length}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white shadow-md border border-yellow-200">
              <h2 className="text-gray-500 font-semibold">
                Pending
              </h2>

              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {
                  bookings.filter(
                    (b) => b.status === "Pending"
                  ).length
                }
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white shadow-md border border-blue-200">
              <h2 className="text-gray-500 font-semibold">
                Confirmed
              </h2>

              <p className="text-2xl font-bold text-blue-600 mt-1">
                {
                  bookings.filter(
                    (b) => b.status === "Confirmed"
                  ).length
                }
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white shadow-md border border-green-200">
              <h2 className="text-gray-500 font-semibold">
                Completed
              </h2>

              <p className="text-2xl font-bold text-green-600 mt-1">
                {
                  bookings.filter(
                    (b) => b.status === "Completed"
                  ).length
                }
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white shadow-md border border-red-200">
              <h2 className="text-gray-500 font-semibold">
                Cancelled
              </h2>

              <p className="text-2xl font-bold text-red-600 mt-1">
                {
                  bookings.filter(
                    (b) => b.status === "Cancelled"
                  ).length
                }
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white shadow-md border border-green-200">
  <h2 className="text-gray-500 font-semibold">
    Revenue
  </h2>

  <p className="text-2xl font-bold text-green-600 mt-1">
    ₹{totalRevenue}
  </p>
</div>

<div className="p-5 rounded-2xl bg-white shadow-md border border-blue-200">
  <h2 className="text-gray-500 font-semibold">
    Today's Bookings
  </h2>

  <p className="text-2xl font-bold text-blue-600 mt-1">
    {todayBookings.length}
  </p>
</div>

<div className="p-5 rounded-2xl bg-white shadow-md border border-purple-200">
  <h2 className="text-gray-500 font-semibold">
    Today's Revenue
  </h2>

  <p className="text-2xl font-bold text-purple-600 mt-1">
    ₹{todayRevenue}
  </p>
</div>

<div className="p-5 rounded-2xl bg-white shadow-md border border-green-200">
  <h2 className="text-gray-500 font-semibold">
    Total Paid
  </h2>

  <p className="text-2xl font-bold text-green-600 mt-1">
    ₹{totalPaid}
  </p>
</div>

<div className="p-5 rounded-2xl bg-white shadow-md border border-yellow-200">
  <h2 className="text-gray-500 font-semibold">
    Total Unpaid
  </h2>

  <p className="text-2xl font-bold text-yellow-600 mt-1">
    ₹{totalUnpaid}
  </p>
</div>

          </div>

          {/* Booking Overview */}
<div className="mb-8 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
  <h2 className="text-xl font-bold text-gray-800 mb-4">
    Booking Overview
  </h2>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div className="bg-yellow-50 rounded-xl p-4 text-center">
      <p className="text-sm font-semibold text-yellow-700">
        Pending
      </p>
      <p className="text-2xl font-bold text-yellow-600 mt-1">
        {bookingOverview.pending}
      </p>
    </div>

    <div className="bg-blue-50 rounded-xl p-4 text-center">
      <p className="text-sm font-semibold text-blue-700">
        Confirmed
      </p>
      <p className="text-2xl font-bold text-blue-600 mt-1">
        {bookingOverview.confirmed}
      </p>
    </div>

    <div className="bg-green-50 rounded-xl p-4 text-center">
      <p className="text-sm font-semibold text-green-700">
        Completed
      </p>
      <p className="text-2xl font-bold text-green-600 mt-1">
        {bookingOverview.completed}
      </p>
    </div>

    <div className="bg-red-50 rounded-xl p-4 text-center">
      <p className="text-sm font-semibold text-red-700">
        Cancelled
      </p>
      <p className="text-2xl font-bold text-red-600 mt-1">
        {bookingOverview.cancelled}
      </p>
    </div>
  </div>
</div>

{/* Today's Active Bookings */}
<div className="mb-8 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
  <h2 className="text-xl font-bold text-gray-800 mb-4">
    Today's Active Bookings
  </h2>

  {todayActiveBookings.length === 0 ? (
    <p className="text-gray-500 text-center py-6">
      No active bookings for today.
    </p>
  ) : (
    <div className="space-y-3">
      {todayActiveBookings
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateA - dateB;
        })
        .map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <div>
              <p className="font-bold text-gray-800">
                {item.name}
              </p>

              <p className="text-sm text-gray-600">
                🚗 {item.car_number} • {item.service}
              </p>
            </div>

            <div className="text-sm sm:text-right">
  <p className="font-semibold text-blue-600">
    {formatTimeRange(item.time)}
  </p>

  <span
    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
      item.status === "Pending"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-blue-100 text-blue-700"
    }`}
  >
    {item.status}
  </span>

  <button
    onClick={() => {
      setSearchTerm(item.name);
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }}
    className="mt-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
  >
    Manage Booking
  </button>
</div>
          </div>
        ))}
    </div>
  )}
</div>

{/* Upcoming Bookings */}
<div className="mb-8 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
  <h2 className="text-xl font-bold text-gray-800 mb-4">
    Upcoming Bookings
  </h2>

  {upcomingBookings.length === 0 ? (
    <p className="text-gray-500 text-center py-6">
      No upcoming bookings.
    </p>
  ) : (
    <div className="space-y-3">
      {upcomingBookings.slice(0, 5).map((item) => (
  <div
    key={item.id}
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
  >
          <div>
            <p className="font-bold text-gray-800">
              {item.name}
            </p>
            {item.car_company && item.car_model && (
  <p className="text-sm text-gray-600 mt-2">
    🚘 {item.car_company} {item.car_model}
  </p>
)}

            <p className="text-sm text-gray-600">
              🚗 {item.car_number} • {item.service}
            </p>
          </div>

          <div className="text-sm sm:text-right">
  <p className="font-semibold text-blue-600">
    {item.date}
  </p>

  <p className="text-gray-600">
    {formatTimeRange(item.time)}
  </p>

  <button
    onClick={() => {
      setSearchTerm(item.name);
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }}
    className="mt-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
  >
    Manage Booking
  </button>
</div>
        </div>
      ))}
    </div>
  )}
</div>

{/* Search & Filter */}
<div className="mb-8 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Search Bookings
      </label>

      <input
        type="text"
        placeholder="Search by name, phone, car number or service..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Filter by Status
      </label>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="All">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="Confirmed">Confirmed</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    </div>
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Filter by Payment
  </label>

  <select
    value={paymentFilter}
    onChange={(e) => setPaymentFilter(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="All">All Payments</option>
    <option value="Unpaid">Unpaid</option>
    <option value="Paid">Paid</option>
  </select>
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Sort Bookings
  </label>

  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="Newest">Newest First</option>
    <option value="Oldest">Oldest First</option>
  </select>
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Filter by Date
  </label>

  <select
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="All">All Dates</option>
    <option value={today}>Today</option>
    <option
      value={new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]}
    >
      Tomorrow
    </option>
    <option value="Custom">Custom Date</option>
  </select>

  {dateFilter === "Custom" && (
    <input
      type="date"
      value={customDate}
      onChange={(e) => setCustomDate(e.target.value)}
      className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )}
</div>
  </div>

  <button
    onClick={() => {
  setSearchTerm("");
  setStatusFilter("All");
  setPaymentFilter("All");
  setSortOrder("Newest");
  setDateFilter("All");
  setCustomDate("");
}}
    className="mt-4 w-full sm:w-auto bg-gray-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition"
  >
    Clear Filters
  </button>
</div>

{/* Booking Cards */}
{filteredBookings.length === 0 ? (
  <div className="text-center py-12">
    <div className="text-5xl mb-4">📋</div>

    <h2 className="text-2xl font-bold text-gray-800 mb-2">
      No Bookings Found
    </h2>

    <p className="text-gray-500">
      There are no bookings matching this search or filter.
    </p>
  </div>
) : (
  sortedBookings.map((item) => (
            <div
              key={item.id}
              className="mb-5 p-6 rounded-2xl border border-gray-100 shadow-md bg-white"
            >

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

                <div>
  <h2 className="text-xl font-bold text-gray-800">
    Booking Details
  </h2>
  <p
  className="text-sm text-gray-500 mt-1"
  title={item.id}
>
  Booking ID: {item.id.slice(0, 8).toUpperCase()}
</p>
</div>

                <span
                  className={`inline-block w-fit px-3 py-1 rounded-full text-sm font-bold ${
                    item.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : item.status === "Confirmed"
                      ? "bg-blue-100 text-blue-700"
                      : item.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.status}
                </span>
                {item.status === "Cancelled" && (
  <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
    <p className="text-sm font-semibold text-red-700">
      ⚠️ This booking has been cancelled.
    </p>
  </div>
)}

              </div>

              <div className="space-y-2 text-gray-700">

                <p>
                  <strong>Name:</strong>{" "}
                  {item.name}
                </p>

                <p>
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
{item.car_company && item.car_model && (
  <p className="text-sm text-gray-700 mt-2">
    🚘 Car: {item.car_company} {item.car_model}
  </p>
)}
                <p>
                  <strong>Car Number:</strong>{" "}
                  {item.car_number}
                </p>
                <p>
  <strong>📍 Service Location:</strong>{" "}
  {item.location_address || "Location not provided"}
</p>

{item.latitude && item.longitude && (
  <a
    href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block mt-2 text-blue-600 font-semibold hover:underline"
  >
    🗺️ Open Location in Google Maps
  </a>
)}

                <p>
                  <strong>Service:</strong>{" "}
                  {item.service}
                </p>

                <p>
                  <strong>Date:</strong>{" "}
                  {item.date}
                </p>

                <p>
                  <strong>Time:</strong>{" "}
                  {formatTimeRange(item.time)}
                </p>

                <p>
                  <strong>Price:</strong>{" "}
                  ₹{item.price}
                </p>
                <p className="flex flex-wrap items-center gap-2">
  <strong className="text-gray-800">Payment:</strong>

  <span
    className={`px-3 py-1 rounded-full text-sm font-bold ${
      item.payment_status === "Paid"
        ? "bg-green-100 text-green-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {item.payment_status || "Unpaid"}
  </span>

  {item.payment_status !== "Paid" && (
    <button
      onClick={async () => {
        const { error } = await supabase
          .from("booking")
          .update({ payment_status: "Paid" })
          .eq("id", item.id);

        if (error) {
          console.error(error);
          alert("Failed to update payment status!");
          return;
        }

        setBookings((currentBookings) =>
          currentBookings.map((booking) =>
            booking.id === item.id
              ? { ...booking, payment_status: "Paid" }
              : booking
          )
        );
      }}
      className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
    >
      Mark Paid
    </button>
  )}
</p>

              </div>

              {/* Status */}
              <div className="mt-5">

                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Update Booking Status
                </label>

                <select
                  value={item.status}
                  disabled={item.status === "Cancelled" || item.status === "Completed"}
                  className="w-full sm:w-auto min-h-11 px-4 py-2.5 border border-gray-300 rounded-xl font-semibold bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={async (e) => {

                    const newStatus = e.target.value;

if (
  item.status === "Cancelled" &&
  newStatus !== "Cancelled"
) {
  alert("A cancelled booking cannot be reopened.");
  return;
}

if (
  item.status === "Completed" &&
  newStatus !== "Completed"
) {
  alert("A completed booking cannot be changed.");
  return;
}

if (
  item.status === "Confirmed" &&
  newStatus === "Pending"
) {
  alert("A confirmed booking cannot go back to Pending.");
  return;
}

if (
  item.status === "Completed" &&
  newStatus !== "Completed"
) {
  alert("A completed booking cannot be changed.");
  return;
}

                    const { error } = await supabase
                      .from("booking")
                      .update({
                        status: newStatus,
                      })
                      .eq("id", item.id);

                    if (error) {
                      console.error(error);
                      alert("Status update failed!");
                      return;
                    }

                    setBookings((currentBookings) =>
  currentBookings.map((b) =>
    b.id === item.id
      ? {
          ...b,
          status: newStatus,
        }
      : b
  )
);

setStatusMessage("Booking status updated successfully!");

setTimeout(() => {
  setStatusMessage("");
}, 3000);
                  }}
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Confirmed">
                    Confirmed
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>

              </div>

            </div>
          ))
        )}

        </div>
      )}

    </main>
  );
}

function sort(arg0: (a: any, b: any) => number) {
    throw new Error("Function not implemented.");
}
