"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const FAQS = [
  {
    q: "Do I need to provide electricity or water for the wash?",
    a: "No! Our mobile wash partner brings self-powered equipment and an onboard water tank. We only need space to park next to your vehicle.",
  },
  {
    q: "How do I track my assigned car washer?",
    a: "Navigate to the 'My Bookings' section from the top navigation bar. You will see real-time milestone updates and live GPS tracking when the partner is en route.",
  },
  {
    q: "When and how do I pay?",
    a: "Payment is strictly pay-on-completion. Once your car wash is inspected and completed, you can pay using cash or UPI directly to the partner.",
  },
  {
    q: "Can I reschedule or cancel a booking?",
    a: "Yes. You can cancel directly from the booking tracking card under 'My Bookings' while the status is still marked as 'Pending' or 'Confirmed'.",
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 select-none">
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
            href="/my-bookings"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Bookings
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#FF6B00] via-[#FF3366] to-[#E11D48] rounded-3xl p-6 text-white shadow-xl shadow-rose-900/15">
          <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2.5 py-0.5 rounded-md">
            Customer Care
          </span>
          <h1 className="text-2xl font-black mt-2">How can we help you?</h1>
          <p className="text-xs text-rose-100 mt-1 font-medium">
            Quick answers, live contact, and doorstep service resolution.
          </p>
        </div>

        {/* Instant Contact Channels */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:+917482073309"
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition text-center flex flex-col items-center justify-center space-y-1 active:scale-95"
          >
            <span className="text-2xl">📞</span>
            <span className="text-xs font-black text-slate-800">Direct Call</span>
            <span className="text-[10px] text-slate-500">Mon-Sun 8am - 8pm</span>
          </a>

          <a
            href="https://wa.me/917482073309?text=Hello%20FOOKA%20WASH%20Support,%20I%20need%20help%20with%20my%20booking."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition text-center flex flex-col items-center justify-center space-y-1 active:scale-95"
          >
            <span className="text-2xl">💬</span>
            <span className="text-xs font-black text-emerald-600">WhatsApp Chat</span>
            <span className="text-[10px] text-slate-500">Quick Response</span>
          </a>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Frequently Asked Questions
          </h2>

          <div className="divide-y divide-slate-100">
            {FAQS.map((faq, index) => (
              <div key={index} className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 hover:text-orange-600 transition gap-2"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 font-black">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>
                {openFaq === index && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pr-4 animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}