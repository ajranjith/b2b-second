import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between">
          <div className="text-2xl font-bold text-slate-900">Hotbray Portal</div>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              B2B Parts Platform
            </p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-slate-900">
              Genuine and aftermarket parts, priced for your account
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Distributing quality spare parts throughout the world since 1972. Search, order, and
              track in minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-700 transition"
              >
                Access the Portal
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-slate-700 font-semibold hover:border-slate-400 transition"
              >
                Browse Parts
              </Link>
            </div>
          </div>
          <div
            className="rounded-3xl overflow-hidden border border-slate-200 shadow-lg"
            style={{
              backgroundImage: "url('/hero-b2b.svg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="aspect-[4/3]" />
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Live Availability",
              body: "See stock levels and lead times across core lines.",
            },
            {
              title: "Account Pricing",
              body: "Band pricing and entitlements applied automatically.",
            },
            { title: "Fast Reordering", body: "Repeat orders and track status in one dashboard." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-lg font-semibold text-slate-900">{item.title}</div>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 text-center text-sm text-slate-500">
          <p>(c) 2024 Hotbray Ltd. All rights reserved.</p>
          <p className="mt-1">Original Jaguar, Land Rover and Rover vehicle parts specialist</p>
        </footer>
      </div>
    </div>
  );
}
