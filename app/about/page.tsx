export default function About() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:py-20 text-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-5xl mb-4">🚗✨</div>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight">
            About FOOKA WASH
          </h2>

          <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Professional car care made simple, convenient, and reliable.
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="px-4 pb-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Who We Are */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🚿</div>

            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Who We Are
            </h3>

            <p className="text-gray-600 leading-relaxed">
              CarWash is a simple online car wash booking platform designed
              to make car cleaning easier for customers. You can choose your
              preferred service, date, and time without any complicated
              process.
            </p>
          </div>

          {/* Our Goal */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🎯</div>

            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Our Goal
            </h3>

            <p className="text-gray-600 leading-relaxed">
              Our goal is to provide convenient booking, professional car
              cleaning services, and a smooth experience from booking to
              completion.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
              Why Choose CarWash?
            </h3>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="text-center p-5 rounded-2xl bg-blue-50">
                <div className="text-4xl mb-3">⚡</div>

                <h4 className="text-lg font-bold text-gray-800">
                  Easy Booking
                </h4>

                <p className="text-sm text-gray-500 mt-2">
                  Book your preferred date and time easily.
                </p>
              </div>

              <div className="text-center p-5 rounded-2xl bg-blue-50">
                <div className="text-4xl mb-3">✨</div>

                <h4 className="text-lg font-bold text-gray-800">
                  Quality Care
                </h4>

                <p className="text-sm text-gray-500 mt-2">
                  Professional cleaning for your car.
                </p>
              </div>

              <div className="text-center p-5 rounded-2xl bg-blue-50">
                <div className="text-4xl mb-3">🛡️</div>

                <h4 className="text-lg font-bold text-gray-800">
                  Reliable Service
                </h4>

                <p className="text-sm text-gray-500 mt-2">
                  A simple and dependable booking experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto text-center bg-blue-600 text-white p-8 sm:p-10 rounded-3xl shadow-lg">
          <h3 className="text-2xl sm:text-3xl font-bold">
            Ready to give your car some care?
          </h3>

          <p className="mt-3 text-blue-100">
            Choose a service and book your preferred time today.
          </p>

          <a
            href="/booking"
            className="inline-block mt-6 bg-white text-blue-600 px-7 py-3 rounded-xl font-bold shadow-md hover:bg-blue-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            Book Your Car Wash
          </a>
        </div>
      </section>
    </main>
  );
}