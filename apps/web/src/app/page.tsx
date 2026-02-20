'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Cog,
  Facebook,
  Headphones,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  Search,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  TrendingUp,
  Twitter,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

/* ── Scroll-animated wrapper ─────────────────────────────────────── */
function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'flip-up';
  delay?: number;
  className?: string;
}) {
  const ref = useScrollAnimation<HTMLDivElement>(animation, { delay });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GARAZE-STYLE LANDING PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-amber-400" /> +44 (0) 1onal 555-0199
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-amber-400" /> sales@hotbray.com
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-amber-400" /> Coventry, United Kingdom
            </span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/login" className="hover:text-white transition-colors">
              <User className="h-3.5 w-3.5" />
            </Link>
            <span className="text-slate-700">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">Track Order</span>
          </div>
        </div>
      </div>

      {/* ── Main Header (Garaze-style dark sticky) ──────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-900/98 backdrop-blur-md shadow-2xl shadow-black/20'
            : 'bg-slate-900'
        }`}
        style={{ animation: 'garaze-slideDown 0.6s ease-out' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-0">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow">
                  <span className="text-slate-900 font-bold text-xl">H</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="text-xl font-bold text-white tracking-tight">HOTBRAY</div>
                <div className="text-[10px] text-amber-400/80 uppercase tracking-[0.2em] font-semibold">
                  Auto Parts
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Products', href: '/dealer/search' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors duration-200
                             after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-amber-400
                             after:transition-all after:duration-300 hover:after:w-2/3"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/dealer/cart"
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all relative"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                  0
                </span>
              </Link>
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-6 py-2.5 rounded-lg text-sm font-bold
                           hover:from-amber-300 hover:to-amber-400 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5
                           transition-all duration-300"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-2">
              {['Home', 'About', 'Products', 'Contact'].map((label) => (
                <Link
                  key={label}
                  href={label === 'Home' ? '/' : label === 'Products' ? '/dealer/search' : `/${label.toLowerCase()}`}
                  className="block px-4 py-3 text-sm font-semibold text-slate-300 hover:text-amber-400 hover:bg-slate-800/50 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/login"
                className="block mt-4 text-center bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-6 py-3 rounded-lg text-sm font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[600px]">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          {/* Floating gear decoration */}
          <div className="absolute top-20 right-20 hidden xl:block" style={{ animation: 'garaze-spin-slow 20s linear infinite' }}>
            <Cog className="w-24 h-24 text-amber-500/10" />
          </div>
          <div className="absolute bottom-20 left-20 hidden xl:block" style={{ animation: 'garaze-spin-slow 30s linear infinite reverse' }}>
            <Cog className="w-16 h-16 text-slate-500/10" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 px-5 py-2 rounded-full text-sm font-semibold">
                  <Wrench className="w-4 h-4" />
                  Professional B2B Parts Platform
                </div>
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                  Premium Auto{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
                    Parts
                  </span>
                  , Dealer Pricing
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                  Genuine and aftermarket parts for Jaguar, Land Rover and Rover vehicles.
                  Distributing quality worldwide since 1972.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-8 py-4 rounded-lg text-base font-bold
                               hover:from-amber-300 hover:to-amber-400 hover:shadow-2xl hover:shadow-amber-500/30 hover:-translate-y-1
                               transition-all duration-300"
                  >
                    Access Portal
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/dealer/search"
                    className="inline-flex items-center gap-2 border-2 border-slate-600 text-white px-8 py-4 rounded-lg text-base font-semibold
                               hover:border-amber-400 hover:text-amber-400 transition-all duration-300"
                  >
                    <Search className="w-5 h-5" />
                    Browse Parts
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span>Fast Dispatch</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Genuine Parts</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Headphones className="w-4 h-4 text-amber-400" />
                    <span>Expert Support</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left" delay={200}>
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-3xl blur-3xl" />
                <div className="relative rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="aspect-[4/3] flex items-center justify-center p-12">
                    <div className="text-center space-y-6">
                      <div className="relative inline-block" style={{ animation: 'garaze-float 3s ease-in-out infinite' }}>
                        <Package className="w-28 h-28 text-amber-400/40" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white/80">50,000+ Parts</div>
                        <div className="text-sm text-slate-500">In stock and ready to ship</div>
                      </div>
                      <div className="flex justify-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path
              d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50K+', label: 'Parts in Stock', icon: Package },
              { number: '500+', label: 'Active Dealers', icon: User },
              { number: '50+', label: 'Years Experience', icon: Clock },
              { number: '98%', label: 'Order Accuracy', icon: Shield },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} animation="fade-up" delay={i * 100}>
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{stat.number}</div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories Section ──────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-amber-600 text-sm font-bold uppercase tracking-wider mb-4">
                <span className="w-8 h-px bg-amber-400" />
                Our Products
                <span className="w-8 h-px bg-amber-400" />
              </span>
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
                Product Categories
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Genuine and aftermarket parts for Jaguar, Land Rover, and Rover vehicles.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Engine Components', description: 'Pistons, camshafts, timing chains, gaskets and more', icon: Cog, color: 'from-amber-500 to-orange-500' },
              { name: 'Brake Systems', description: 'Discs, pads, calipers, lines and fluid', icon: Shield, color: 'from-red-500 to-rose-500' },
              { name: 'Suspension & Steering', description: 'Springs, dampers, bushings, ball joints', icon: Wrench, color: 'from-blue-500 to-indigo-500' },
            ].map((cat, i) => (
              <ScrollReveal key={cat.name} animation="flip-up" delay={i * 150}>
                <Link
                  href="/dealer/search"
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className={`h-48 bg-gradient-to-br ${cat.color} flex items-center justify-center relative overflow-hidden`}>
                    <cat.icon className="w-20 h-20 text-white/30 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">{cat.description}</p>
                    <span className="inline-flex items-center text-sm font-bold text-amber-600 group-hover:gap-3 gap-1 transition-all duration-300">
                      View Products
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-amber-600 text-sm font-bold uppercase tracking-wider mb-4">
                <span className="w-8 h-px bg-amber-400" />
                Why Choose Us
                <span className="w-8 h-px bg-amber-400" />
              </span>
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
                Built for Professional Dealers
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Advanced features designed for professional parts distributors
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'Live Availability', body: 'Real-time stock levels and lead times across our entire product range.' },
              { icon: Shield, title: 'Account Pricing', body: 'Personalized pricing bands and entitlements applied automatically.' },
              { icon: TrendingUp, title: 'Fast Reordering', body: 'Repeat previous orders and track status in one unified dashboard.' },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} animation="fade-up" delay={i * 150}>
                <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal animation="zoom-in">
            <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-wider mb-6">
              <span className="w-8 h-px bg-amber-400" />
              Get Started
              <span className="w-8 h-px bg-amber-400" />
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Access Dealer Pricing?
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
              Join 500+ dealers accessing thousands of genuine and aftermarket parts with personalized pricing.
            </p>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-10 py-5 rounded-xl text-lg font-bold
                         hover:from-amber-300 hover:to-amber-400 hover:shadow-2xl hover:shadow-amber-500/30 hover:-translate-y-1
                         transition-all duration-300"
            >
              Access the Portal
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer (Garaze-style multi-column dark) ─────────────── */}
      <footer className="bg-slate-950 text-slate-400">
        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Column 1: About */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <span className="text-slate-900 font-bold text-lg">H</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-white tracking-tight">HOTBRAY</div>
                  <div className="text-[9px] text-amber-400/70 uppercase tracking-[0.2em] font-semibold">Auto Parts</div>
                </div>
              </Link>
              <p className="text-sm leading-relaxed mb-6">
                Original Jaguar, Land Rover and Rover vehicle parts specialist.
                Distributing quality spare parts worldwide since 1972.
              </p>
              <div className="flex items-center gap-3">
                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-400 hover:text-white
                               flex items-center justify-center transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-6 h-px bg-amber-400" />
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'About Us', href: '/about' },
                  { label: 'Products', href: '/dealer/search' },
                  { label: 'Dealer Portal', href: '/login' },
                  { label: 'Order Tracking', href: '/dealer/orders' },
                  { label: 'Contact Us', href: '/contact' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors duration-200"
                    >
                      <ChevronRight className="w-3 h-3 text-amber-400/50 group-hover:translate-x-0.5 transition-transform" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Services */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-6 h-px bg-amber-400" />
                Services
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  'Genuine Parts Supply',
                  'Aftermarket Parts',
                  'Technical Support',
                  'Dealer Account Setup',
                  'Worldwide Shipping',
                ].map((item) => (
                  <li key={item}>
                    <span className="group inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors duration-200 cursor-default">
                      <ChevronRight className="w-3 h-3 text-amber-400/50" />
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact & Newsletter */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-6 h-px bg-amber-400" />
                Contact Us
              </h4>
              <ul className="space-y-4 text-sm mb-8">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>Coventry, West Midlands,<br />United Kingdom</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>+44 (0) 1onal 555-0199</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>sales@hotbray.com</span>
                </li>
              </ul>

              {/* Newsletter */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Newsletter</p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-l-lg px-4 py-2.5 text-sm text-white placeholder-slate-500
                               focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <button
                    type="button"
                    className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-4 rounded-r-lg font-bold text-sm
                               hover:from-amber-300 hover:to-amber-400 transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Hotbray Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy</Link>
              <Link href="/help" className="hover:text-amber-400 transition-colors">Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
