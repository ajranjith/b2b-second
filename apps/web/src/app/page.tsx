import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="relative text-center max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-white mb-4">Hotbray Portal</h1>
        <p className="text-2xl text-slate-300 mb-12">
          Distributing quality spare parts throughout the world since 1972
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Dealer Portal */}
          <Link
            href="/dealer/login"
            className="group bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-5xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-white mb-2">Dealer Portal</h2>
            <p className="text-slate-300 mb-4">
              Access your account, search parts, and place orders
            </p>
            <div className="text-blue-400 group-hover:text-blue-300 font-medium">
              Login as Dealer →
            </div>
          </Link>

          {/* Admin Portal */}
          <Link
            href="/admin/login"
            className="group bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2>
            <p className="text-slate-300 mb-4">
              Manage dealers, imports, and system operations
            </p>
            <div className="text-purple-400 group-hover:text-purple-300 font-medium">
              Admin Login →
            </div>
          </Link>
        </div>

        <div className="mt-12 text-slate-400 text-sm">
          <p>© 2024 Hotbray Ltd. All rights reserved.</p>
          <p className="mt-2">Original Jaguar, Land Rover and Rover vehicle parts specialist</p>
        </div>
      </div>
    </div>
  );
}
