import Link from 'next/link';
import { Package, TrendingUp, Clock, Shield, ChevronRight, Search } from 'lucide-react';

export default function Home() {
  const categories = [
    {
      name: 'Engine Components',
      description: 'Pistons, camshafts, timing chains',
      image: '/categories/engine.jpg',
      icon: Package,
    },
    {
      name: 'Brake Systems',
      description: 'Discs, pads, calipers',
      image: '/categories/brakes.jpg',
      icon: Shield,
    },
    {
      name: 'Suspension',
      description: 'Springs, dampers, bushings',
      image: '/categories/suspension.jpg',
      icon: TrendingUp,
    },
  ];

  const features = [
    {
      icon: Clock,
      title: 'Live Availability',
      body: 'Real-time stock levels and lead times across our entire product range.',
    },
    {
      icon: Shield,
      title: 'Account Pricing',
      body: 'Personalized pricing bands and entitlements applied automatically.',
    },
    {
      icon: TrendingUp,
      title: 'Fast Reordering',
      body: 'Repeat previous orders and track status in one unified dashboard.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">HB</span>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">Hotbray</div>
              <div className="text-[10px] text-slate-500 leading-none">Parts Distribution</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/about" className="text-slate-600 hover:text-blue-600 transition">
              About
            </Link>
            <Link href="/products" className="text-slate-600 hover:text-blue-600 transition">
              Products
            </Link>
            <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition">
              Contact
            </Link>
          </nav>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all"
          >
            Sign In
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-white opacity-60" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
                <Package className="w-4 h-4" />
                B2B Parts Platform
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Genuine and aftermarket{' '}
                <span className="text-blue-600">parts</span>, priced for your account
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                Distributing quality spare parts worldwide since 1972. Search, order, and track in minutes with our advanced B2B platform.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/40 transition-all"
                >
                  Access Portal
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="/dealer/search"
                  className="inline-flex items-center rounded-full border-2 border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Browse Parts
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl" />
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="aspect-[4/3] flex items-center justify-center p-12">
                  {/* Placeholder for hero image - replace with actual product photo */}
                  <div className="text-center text-white space-y-4">
                    <Package className="w-24 h-24 mx-auto opacity-40" />
                    <div className="text-sm font-medium opacity-60">
                      Professional automotive parts imagery
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Product Categories
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Explore our comprehensive range of genuine and aftermarket parts for Jaguar, Land Rover, and Rover vehicles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  href="/dealer/search"
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-600 transition-all hover:shadow-xl"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center p-8">
                    {/* Placeholder for category image */}
                    <Icon className="w-20 h-20 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="p-6 bg-white">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-600">{category.description}</p>
                    <div className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                      View Products
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Why Choose Hotbray
            </h2>
            <p className="text-lg text-slate-600">
              Advanced features designed for professional parts distributors
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Access thousands of genuine and aftermarket parts with personalized pricing
          </p>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-xl hover:shadow-2xl hover:bg-blue-50 transition-all"
          >
            Access the Portal
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HB</span>
                </div>
                <span className="text-white font-bold">Hotbray Ltd</span>
              </div>
              <p className="text-sm leading-relaxed">
                Original Jaguar, Land Rover and Rover vehicle parts specialist. Distributing quality spare parts worldwide since 1972.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/products" className="hover:text-white transition">Products</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Hotbray Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
