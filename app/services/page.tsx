"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Service = {
  id: number;
  name: string;
  price: number;
};

export default function Services() {
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
        console.error(error);
        setError("Unable to load services.");
        setLoading(false);
        return;
      }

      setServices(data || []);
      setLoading(false);
    };

    loadServices();
  }, []);

  const getIcon = (name: string) => {
    if (name === "Basic Wash") return "🚿";
    if (name === "Premium Wash") return "✨";
    if (name === "Interior Cleaning") return "🧹";
    if (name === "Full Car Cleaning") return "🚗";

    return "🧽";
  };

  const getDescription = (name: string) => {
    if (name === "Basic Wash") {
      return "Exterior cleaning for a fresh and clean car.";
    }

    if (name === "Premium Wash") {
      return "Deep exterior cleaning with premium care.";
    }

    if (name === "Interior Cleaning") {
      return "Detailed interior cleaning for a fresh cabin.";
    }

    if (name === "Full Car Cleaning") {
      return "Complete interior and exterior car cleaning.";
    }

    return "Professional car cleaning service.";
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">

      <h1 className="text-4xl font-bold text-blue-600 text-center">
        Our Services
      </h1>

      <p className="text-center text-gray-500 mt-2">
        Choose the perfect service for your car
      </p>

      {loading && (
        <p className="text-center text-gray-500 mt-10">
          Loading services...
        </p>
      )}

      {error && (
        <p className="text-center text-red-500 font-semibold mt-10">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="max-w-6xl mx-auto mt-10 grid grid-cols-4 gap-6">

          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition duration-200"
            >

              <div className="text-4xl mb-3">
                {getIcon(service.name)}
              </div>

              <h2 className="text-xl font-bold text-gray-800">
                {service.name}
              </h2>

              <p className="text-gray-500 mt-3 leading-relaxed">
                {getDescription(service.name)}
              </p>

              <p className="text-2xl font-bold text-blue-600 mt-4">
                ₹{service.price}
              </p>

              <a
                href={`/booking?service=${encodeURIComponent(service.name)}`}
                className="inline-block mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md transition"
              >
                Book Now
              </a>

            </div>
          ))}

        </div>
      )}

    </main>
  );
}