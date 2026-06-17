import Link from "next/link";
import {
  BookOpen, Users, BarChart3, Shield, Star, Check, ChevronRight,
  GraduationCap, Heart, Globe, Award, TrendingUp, Bell, CreditCard, ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Hifz Tracking",
    desc: "Track Sabaq, Sabqi & Manzil daily. Visual 30-Juz progress map with quality scoring.",
    color: "from-emerald-500 to-green-700",
  },
  {
    icon: Users,
    title: "Student Management",
    desc: "Complete student profiles, admission workflow, class enrollment & parent linking.",
    color: "from-blue-500 to-indigo-700",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    desc: "Real-time institute KPIs, attendance trends, fee collection & Hifz quality analytics.",
    color: "from-violet-500 to-purple-700",
  },
  {
    icon: Bell,
    title: "Parent Communication",
    desc: "Instant alerts for absence, performance dips & achievements via app, SMS & email.",
    color: "from-amber-500 to-orange-700",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    desc: "Online payments, scholarships, donor tracking & detailed financial reports.",
    color: "from-rose-500 to-pink-700",
  },
  {
    icon: Shield,
    title: "Safeguarding",
    desc: "Child protection complaint tracking with immutable audit trail & case management.",
    color: "from-teal-500 to-cyan-700",
  },
  {
    icon: Award,
    title: "Gamification",
    desc: "Motivate students with badges, milestones & achievement walls for memorization goals.",
    color: "from-yellow-500 to-amber-700",
  },
  {
    icon: Globe,
    title: "Multi-Branch",
    desc: "Manage multiple campuses from one dashboard with centralized reporting & comparison.",
    color: "from-sky-500 to-blue-700",
  },
];

const stats = [
  { value: "10,000+", label: "Students Managed" },
  { value: "500+", label: "Institutes Served" },
  { value: "98%", label: "Attendance Accuracy" },
  { value: "40+", label: "Countries" },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    desc: "Perfect for small institutes",
    limit: "Up to 50 students",
    features: [
      "Student & teacher profiles",
      "Hifz & Nazra tracking",
      "Attendance management",
      "Basic reports",
      "Parent portal",
    ],
    cta: "Start Free",
    href: "/auth/register?plan=starter",
    accent: false,
  },
  {
    name: "Growth",
    price: "PKR 4,999",
    period: "/ month",
    desc: "For growing academies",
    limit: "Up to 500 students",
    features: [
      "Everything in Starter",
      "Multi-branch support",
      "Fee & finance module",
      "Online payments",
      "Advanced analytics",
      "WhatsApp notifications",
      "Assessment module",
      "Gamification & badges",
    ],
    cta: "Start 14-day Trial",
    href: "/auth/register?plan=growth",
    accent: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    desc: "For large institutions",
    limit: "Unlimited students & branches",
    features: [
      "Everything in Growth",
      "Unlimited branches",
      "Custom domain",
      "API access",
      "Dedicated support",
      "Custom integrations",
      "AI prediction engine",
      "White-label option",
    ],
    cta: "Contact Sales",
    href: "/contact",
    accent: false,
  },
];

const testimonials = [
  {
    quote:
      "QEMS transformed how we track our 300 huffaz. The Sabaq/Sabqi/Manzil tracking is exactly what we needed.",
    name: "Mufti Asim Hafeez",
    role: "Director, Dar ul Uloom Karachi",
    initials: "MA",
  },
  {
    quote:
      "Parents love the real-time progress updates. Enrolment went up 40% after we started using QEMS.",
    name: "Ustaz Bilal Ahmad",
    role: "Principal, Al-Noor Hifz Academy",
    initials: "BA",
  },
  {
    quote:
      "The analytics dashboard helps me compare all 5 branches instantly. Incredible platform.",
    name: "Sheikh Tariq Jameel",
    role: "Founder, Islamic Learning Network",
    initials: "TJ",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 glass border-b border-white/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow-green">
                <span className="text-white text-sm font-bold font-arabic">ق</span>
              </div>
              <span className="font-display text-xl font-bold text-primary-900">QEMS</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-primary-700 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-primary-700 transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-primary-700 transition-colors">Testimonials</a>
              <Link href="/about" className="hover:text-primary-700 transition-colors">About</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-hero pattern-overlay">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.15),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="text-center">
            {/* Arabic Bismillah */}
            <p className="arabic text-2xl text-gold-light mb-6 animate-fade-in">
              بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-gold-dark/30 bg-gold/10 px-4 py-1.5 text-sm text-gold-light mb-6 animate-fade-in delay-100">
              <Star className="h-3.5 w-3.5 fill-gold-light" />
              The World's Most Comprehensive Quran Education Platform
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up delay-200">
              Manage Your Quran
              <br />
              <span className="text-gradient-gold">Education Institute</span>
              <br />
              Like Never Before
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-green-100/80 mb-10 animate-fade-in-up delay-300">
              From Hifz tracking to fee management, parent communication to analytics —
              QEMS is the all-in-one operating system for modern Islamic education institutions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-400">
              <Link
                href="/auth/register"
                className="btn-accent text-base px-8 py-3.5 shadow-glow-gold"
              >
                Start Free Today
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="flex items-center gap-2 text-green-100 hover:text-white font-medium transition-colors"
              >
                See all features
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Stats strip */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-3xl font-bold text-gradient-gold">{s.value}</p>
                  <p className="text-green-100/70 text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-700 font-semibold text-sm uppercase tracking-widest mb-3">
              Everything You Need
            </p>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
              Built for Quran Education Excellence
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every feature designed specifically for the unique needs of Hifz institutes,
              Nazra academies, Tajweed centers, and Islamic schools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="dash-card p-6 group animate-fade-in-up"
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} shadow-md group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Visual showcase ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary-700 font-semibold text-sm uppercase tracking-widest mb-3">
                Hifz Progress Tracking
              </p>
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-6">
                Visual Quran Progress Map for Every Student
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                See exactly how far each student has come in their memorization journey.
                Track Sabaq (new lesson), Sabqi (recent revision), and Manzil (long-term retention)
                with daily records and automatic quality scoring.
              </p>
              <ul className="space-y-4">
                {[
                  "30 Juz visual progress grid",
                  "Daily Sabaq, Sabqi & Manzil logging",
                  "Automatic weekly & monthly quality scores",
                  "Error count & fluency tracking",
                  "Predictive completion date",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-primary-700" />
                    </span>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fake Juz Grid Demo */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-50 to-emerald-50 rounded-3xl p-8 border border-primary-100">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary-700" />
                  Ahmad Al-Rashid — Hifz Progress
                </h4>
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {Array.from({ length: 30 }, (_, i) => {
                    const juz = i + 1;
                    const done = juz <= 12;
                    const partial = juz === 13;
                    return (
                      <div
                        key={juz}
                        className={`juz-cell text-xs font-bold py-2 ${
                          done
                            ? "juz-cell-completed"
                            : partial
                            ? "juz-cell-partial"
                            : "juz-cell-empty"
                        }`}
                      >
                        {juz}
                        {done && (
                          <span className="absolute top-0.5 right-0.5 text-[8px]">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-primary-800" />
                      <span className="text-gray-500">Completed</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-accent-700" />
                      <span className="text-gray-500">In Progress</span>
                    </span>
                  </div>
                  <span className="font-semibold text-primary-700">12.5 / 30 Juz</span>
                </div>
                <div className="mt-4 bg-white rounded-xl p-4 border border-primary-100">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Overall Progress</span>
                    <span className="font-semibold text-primary-700">41.7%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: "41.7%" }} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Quality Score</p>
                      <p className="font-bold text-primary-700">8.4/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Attendance</p>
                      <p className="font-bold text-green-600">96%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Est. Completion</p>
                      <p className="font-bold text-amber-600">Jun 2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-gradient-hero pattern-overlay">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-gold-light font-semibold text-sm uppercase tracking-widest mb-3">
              Trusted by Educators
            </p>
            <h2 className="font-display text-4xl font-bold text-white">
              What Scholars & Educators Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-dark rounded-2xl p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-DEFAULT text-gold-DEFAULT" />
                  ))}
                </div>
                <p className="text-green-50 italic mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{t.initials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-green-200/70 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-700 font-semibold text-sm uppercase tracking-widest mb-3">
              Simple Pricing
            </p>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
              Plans for Every Institute Size
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 border ${
                  plan.accent
                    ? "bg-gradient-primary border-primary-700 shadow-glow-green text-white scale-105"
                    : "bg-white border-gray-200 shadow-sm"
                }`}
              >
                {plan.accent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-gold text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-glow-gold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <h3 className={`font-display text-xl font-bold mb-1 ${plan.accent ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.accent ? "text-green-100" : "text-gray-400"}`}>
                  {plan.desc}
                </p>
                <div className="mb-2">
                  <span className={`font-display text-4xl font-bold ${plan.accent ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ml-1 ${plan.accent ? "text-green-100" : "text-gray-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-xs font-semibold mb-6 ${plan.accent ? "text-gold-light" : "text-primary-600"}`}>
                  {plan.limit}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 flex-shrink-0 ${plan.accent ? "text-gold-light" : "text-primary-600"}`} />
                      <span className={plan.accent ? "text-green-50" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={plan.accent ? "btn-accent w-full justify-center" : "btn-ghost w-full justify-center"}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Heart className="h-5 w-5 text-primary-600 fill-primary-200" />
            <p className="text-primary-700 font-semibold">Built with love for Quran education</p>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your
            <br />
            <span className="text-gradient-green">Quran Institute?</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-10">
            Join hundreds of Hifz institutes, Nazra academies, and Islamic schools already
            using QEMS to deliver world-class Quran education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5">
              Register Your Institute
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact" className="btn-ghost text-base px-8 py-3.5">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-white text-xs font-bold font-arabic">ق</span>
                </div>
                <span className="font-display text-white font-bold text-lg">QEMS</span>
              </div>
              <p className="text-sm leading-relaxed">
                The world's most comprehensive Quran Education Management System.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                {["Features", "Pricing", "Security", "Roadmap"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {["About", "Blog", "Careers", "Contact"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} QEMS. All rights reserved. Built for Quran education excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
