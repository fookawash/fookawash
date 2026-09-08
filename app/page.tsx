

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="flex min-h-[70vh] sm:min-h-[80vh] items-center justify-center text-center px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-extrabold text-blue-600 tracking-tight leading-tight">
            FOOKA WASH
          </h2>

          <p className="mt-5 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
            Premium car care, At your doorstep
          </p>

          <a
            href="/booking"
            className="inline-block mt-7 rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            Book Now
          </a>

          <p className="mt-5 text-sm sm:text-base text-gray-500">
            ✨ Reliable service • Easy booking • Professional car care
          </p>

          {/* Feature Cards */}
          <div className="mt-10 grid w-full grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-3">🚿</div>

              <h3 className="text-lg font-bold text-gray-800">
                Quality Wash
              </h3>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Professional car cleaning
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-3">⚡</div>

              <h3 className="text-lg font-bold text-gray-800">
                Easy Booking
              </h3>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Book your preferred time
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-3">✨</div>

              <h3 className="text-lg font-bold text-gray-800">
                Premium Care
              </h3>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Care your car deserves
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}