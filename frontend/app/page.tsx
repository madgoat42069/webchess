import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white">
              Play Chess Online
            </h1>
            <p className="text-xl text-gray-400">
              Free online chess with friends and players worldwide. No registration required.
            </p>
            <div className="space-x-4">
              <Link href="/play" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Play Now
              </Link>
              <Link href="/learn" className="inline-block border border-gray-700 text-gray-300 px-6 py-3 rounded-lg hover:bg-[#2a2a2a]">
                Learn Chess
              </Link>
            </div>
          </div>
          <div className="bg-[#2a2a2a] p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-white">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1.2M+</div>
                <div className="text-sm text-gray-400">Games Today</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">350K+</div>
                <div className="text-sm text-gray-400">Players Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
