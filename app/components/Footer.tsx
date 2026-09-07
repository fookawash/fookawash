"use client";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">

      <div className="max-w-6xl mx-auto px-6 py-12">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-extrabold">
              🚗 CarWash
            </h2>

            <p className="text-gray-400 mt-3 leading-relaxed">
              Professional car care made simple, convenient, and reliable.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              Quick Links
            </h3>

            <div className="flex flex-col gap-2">
              <a
                href="/"
                className="text-gray-400 hover:text-white transition"
              >
                Home
              </a>

              <a
                href="/services"
                className="text-gray-400 hover:text-white transition"
              >
                Services
              </a>

              <a
                href="/about"
                className="text-gray-400 hover:text-white transition"
              >
                About
              </a>

              <a
                href="/booking"
                className="text-gray-400 hover:text-white transition"
              >
                Book Now
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              Our Services
            </h3>

            <div className="flex flex-col gap-2 text-gray-400">
              <p>Basic Wash</p>
              <p>Premium Wash</p>
              <p>Interior Cleaning</p>
              <p>Full Car Cleaning</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              Contact Us
            </h3>

            <div className="flex flex-col gap-3 text-gray-400">
              <p>📞 +91 98765 43210</p>
              <p>📧 support@carwash.com</p>
              <p>📍 Kolkata, India</p>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-700 mt-10 pt-6 text-center">

          <p className="text-gray-400 text-sm">
            © 2026 CarWash. All rights reserved.
          </p>

          <p className="text-gray-500 text-xs mt-2">
            Professional car care at your doorstep.
          </p>

        </div>

      </div>

    </footer>
  );
}