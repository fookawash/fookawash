"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const servicePrices: { [key: string]: number } = {
  "Basic Wash": 299,
  "Premium Wash": 399,
  "Interior Cleaning": 499,
  "Full Car Cleaning": 599,
};
const carModels: { [key: string]: string[] } = {
  "Maruti Suzuki": [
    "Alto",
    "Swift",
    "Baleno",
    "Wagon R",
    "Dzire",
    "Brezza",
    "Ertiga",
    "Fronx",
  ],
  Hyundai: [
    "Grand i10 Nios",
    "i20",
    "Exter",
    "Venue",
    "Verna",
    "Creta",
    "Alcazar",
  ],
  Tata: [
    "Tiago",
    "Tigor",
    "Altroz",
    "Punch",
    "Nexon",
    "Harrier",
    "Safari",
  ],
  Mahindra: [
    "XUV 3XO",
    "Bolero",
    "Scorpio",
    "Thar",
    "XUV700",
  ],
  Toyota: [
    "Glanza",
    "Urban Cruiser Hyryder",
    "Innova Crysta",
    "Innova Hycross",
    "Fortuner",
  ],
  Honda: [
    "Amaze",
    "City",
    "Elevate",
  ],
  Kia: [
    "Sonet",
    "Seltos",
    "Carens",
  ],
  Volkswagen: [
    "Polo",
    "Virtus",
    "Taigun",
  ],
  Skoda: [
    "Slavia",
    "Kushaq",
    "Kodiaq",
  ],
  Renault: [
    "Kwid",
    "Triber",
    "Kiger",
  ],
  Nissan: [
    "Magnite",
  ],
  BMW: [
    "2 Series",
    "3 Series",
    "5 Series",
    "X1",
    "X3",
  ],
  "Mercedes-Benz": [
    "A-Class",
    "C-Class",
    "E-Class",
    "GLA",
    "GLC",
  ],
  Audi: [
    "A4",
    "A6",
    "Q3",
    "Q5",
  ],
  Other: [
    "Other Model",
  ],
};

const timeSlots = [
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
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [carCompany, setCarCompany] = useState("");
const [carModel, setCarModel] = useState("");
const [locationAddress, setLocationAddress] = useState("");
const [latitude, setLatitude] = useState<number | null>(null);
const [longitude, setLongitude] = useState<number | null>(null);
const [locationLoading, setLocationLoading] = useState(false);
const [service, setService] = useState("");
const [date, setDate] = useState("");
const [time, setTime] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check login
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = "/login";
        return;
      }

      setUser(session.user);

      // Load saved name
      const savedName = session.user.user_metadata?.full_name;

      if (savedName) {
        setName(savedName);
      }
    };

    checkUser();
  }, []);

  // Read service from Services page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedService = params.get("service");

    if (selectedService) {
      setService(selectedService);
    }
  }, []);

  const getCurrentLocation = () => {
  setLocationLoading(true);

  const getLocation = (highAccuracy: boolean) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        console.log("GPS location:", latitude, longitude);

        setLatitude(latitude);
        setLongitude(longitude);

        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          console.log("Reverse geocoding response:", response);

          if (!response.ok) {
            throw new Error("Unable to find address");
          }

          const data = await response.json();

          console.log("Reverse geocoding data:", data);

          const readableLocation = [
            data.locality,
            data.city,
            data.principalSubdivision,
            data.postcode,
          ]
            .filter(Boolean)
            .filter(
              (value, index, array) =>
                array.indexOf(value) === index
            )
            .join(", ");

          setLocationAddress(
            readableLocation ||
              `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
          );
        } catch (error) {
          console.error("Reverse geocoding error:", error);

          setLocationAddress(
            `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error(
          `Location attempt failed (${highAccuracy ? "high" : "low"} accuracy):`,
          error
        );

        if (!highAccuracy) {
          console.log("Retrying location with high accuracy...");

          getLocation(true);
          return;
        }

        setLocationLoading(false);

        alert(
          `Unable to get your location (${error.code}): ${error.message}`
        );
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 60000 : 30000,
        maximumAge: 300000,
      }
    );
  };

  getLocation(false);
};

  const handleBooking = async () => {
    if (!user) {
      alert("Please login first!");
      return;
    }

    if (!name || !carNumber || !phone || !locationAddress || !service || !date || !time) {
  const missingFields = [];

  if (!name) missingFields.push("Name");
  if (!carNumber) missingFields.push("Car Number");
  if (!phone) missingFields.push("Phone Number");
  if (!locationAddress) missingFields.push("Service Location");
  if (!service) missingFields.push("Service");
  if (!date) missingFields.push("Date");
  if (!time) missingFields.push("Time");

  alert(`Missing field(s): ${missingFields.join(", ")}`);
  return;
}
  if (!/^[6-9]\d{9}$/.test(phone)) {
  alert("Please enter a valid Indian mobile number.");
  return;
}

const today = new Date().toISOString().split("T")[0];

if (date < today) {
  alert("Please select today or a future date.");
  return;
}

const validTimeSlots = timeSlots.map((slot) => slot.value);

if (!validTimeSlots.includes(time)) {
  alert("Please select a valid booking time.");
  return;
}

if (isTimeSlotPast(time)) {
  alert("This time slot has already passed. Please select a future time.");
  setTime("");
  return;
}

setSubmitting(true);

    const bookingPrice = servicePrices[service];

    const { data: newBooking, error } = await supabase
  .from("booking")
  .insert([
    {
      name,
      car_number: carNumber,
      car_company: carCompany,
      car_model: carModel,
      phone: phone,
      location_address: locationAddress,
      latitude: latitude,
      longitude: longitude,
      service,
      date,
      time,
      user_id: user.id,
      status: "Pending",
      price: bookingPrice,
    },
  ])
  .select()
  .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setMessage(
  `Booking confirmed! ID: ${newBooking.id.slice(0, 8).toUpperCase()} — Redirecting to My Bookings...`
);

setTimeout(() => {
  window.location.href = "/bookings";
}, 1000);

    setTimeout(() => {
      window.location.href = "/bookings";
    }, 1000);
  };
  const isTimeSlotPast = (slotValue: string) => {
  const now = new Date();

  const todayLocal =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

  if (date !== todayLocal) {
    return false;
  }

  const [hour, minute] = slotValue.split(":").map(Number);

  const slotMinutes = hour * 60 + minute;
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  return slotMinutes <= currentMinutes;
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-3 sm:px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🚗</div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
  Book Your Car Wash
</h1>

            <p className="text-gray-500 mt-2">
              Choose your preferred service, date and time
            </p>
          </div>

          {/* Name */}
          <div className="mb-6 sm:mb-5">
            <label className="block font-semibold text-gray-700 mb-2">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Car Number */}
          <div className="mb-5">
            <label className="block font-semibold text-gray-700 mb-2">
              Car Number
            </label>

            <input
  type="text"
  placeholder="E.G. WB45DR6583"
  maxLength={10}
  autoCapitalize="characters"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>
          <div className="mb-5">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Car Company
  </label>

  <select
    value={carCompany}
    onChange={(e) => {
      setCarCompany(e.target.value);
      setCarModel("");
    }}
    className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select car company</option>

    {Object.keys(carModels).map((company) => (
      <option key={company} value={company}>
        {company}
      </option>
    ))}
  </select>
</div>

{carCompany && (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Car Model
    </label>

    <select
      value={carModel}
      onChange={(e) => setCarModel(e.target.value)}
      className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select car model</option>

      {carModels[carCompany].map((model) => (
        <option key={model} value={model}>
          {model}
        </option>
      ))}
    </select>
  </div>
)}
          <div className="mb-5">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Phone Number
  </label>

  <input
    type="tel"
    placeholder="Enter your phone number"
    maxLength={10}
    value={phone}
    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
    className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />

         </div>

{/* Service Location */}
<div className="mb-5">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    📍 Service Location
  </label>

  <input
    type="text"
    placeholder="Enter your service address"
    value={locationAddress}
    onChange={(e) => {
      setLocationAddress(e.target.value);
      setLatitude(null);
      setLongitude(null);
    }}
    className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />

  <button
    type="button"
    onClick={getCurrentLocation}
    disabled={locationLoading}
    className="w-full mt-3 border border-blue-500 text-blue-600 rounded-xl p-3 font-semibold hover:bg-blue-50 transition"
  >
    {locationLoading
      ? "📍 Getting your location..."
      : "📍 Use My Current Location"}
  </button>

  {latitude !== null && longitude !== null && (
    <p className="text-sm text-green-600 font-semibold mt-2">
      ✓ Current location selected
    </p>
  )}
</div>


          {/* Service */}
          <div className="mb-5">
            <label className="block font-semibold text-gray-700 mb-2">
              Service
            </label>

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a service</option>

              <option value="Basic Wash">
                Basic Wash - ₹299
              </option>

              <option value="Premium Wash">
                Premium Wash - ₹399
              </option>

              <option value="Interior Cleaning">
                Interior Cleaning - ₹499
              </option>

              <option value="Full Car Cleaning">
                Full Car Cleaning - ₹599
              </option>
            </select>

            {service && (
              <p className="mt-2 text-lg font-bold text-blue-600">
                Price: ₹{servicePrices[service]}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="mb-5">
            <label className="block font-semibold text-gray-700 mb-2">
              Date
            </label>

            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              aria-label="Select booking date"
              onChange={(e) => {
  const newDate = e.target.value;
  setDate(newDate);

  if (newDate !== date) {
    setTime("");
  }
}}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-2">
  📅 You can book from today onward.
</p>
          </div>

          {/* Time */}
          <div className="mb-6">
            <label className="block font-semibold text-gray-700 mb-2">
              Time
            </label>


            <select
              value={time}
              onChange={(e) => {
  const selectedTime = e.target.value;

  if (isTimeSlotPast(selectedTime)) {
    setTime("");
    return;
  }

  setTime(selectedTime);
}}
              aria-label="Select booking time"
              className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                
              <option value="">Select time</option>

              {timeSlots.map((slot) => {
  const isPast = isTimeSlotPast(slot.value);

  return (
    <option
      key={slot.value}
      value={slot.value}
      disabled={isPast}
    >
      {slot.label}
      {isPast ? " — Passed" : ""}
    </option>
  );
})}
            </select>

            <p className="text-sm text-gray-500 mt-2">
              Available booking time: 6:00 AM – 8:00 PM
            </p>
            <p className="text-sm text-blue-600 font-semibold mt-2">
  💵 Payment method: Pay after service
</p>
          </div>

          {/* Confirm */}
<button
  onClick={handleBooking}
  disabled={
    submitting ||
    !name ||
    !carNumber ||
    !(/^[6-9]\d{9}$/.test(phone)) ||
    !carCompany ||
    !carModel ||
    !locationAddress ||
    !service ||
    !date ||
    !time ||
    !timeSlots.some((slot) => slot.value === time || isTimeSlotPast(time))
  }
  className={`w-full py-4 px-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition ${
    submitting ||
    !name ||
    !carNumber ||
    !(/^[6-9]\d{9}$/.test(phone)) ||
     !carCompany ||
    !carModel ||
    !locationAddress ||
    !service ||
    !date ||
    !time ||
    !timeSlots.some((slot) => slot.value === time || isTimeSlotPast(time))
      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
      : "bg-blue-600 text-white hover:bg-blue-700"
  }`}
>
  {submitting ? "Booking..." : "Confirm Booking"}
</button>

{/* Success Message */}
{message && (
  <div className="mt-4 flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-center font-semibold shadow-sm">
    <span className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-sm">
      ✓
    </span>
    <span>{message}</span>
  </div>
)}
        </div>
      </div>
    </main>
  );
}