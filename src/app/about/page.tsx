import Link from "next/link";
import { ArrowLeft, BookOpen, Sparkles, ShieldCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "About QEMS — Quran Education Management System" };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 py-5">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-white text-lg font-bold font-arabic">ق</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-gray-900">QEMS</span>
          </div>
          <Link href="/" className="btn-ghost text-xs py-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="font-display text-4xl font-extrabold text-gray-900 tracking-tight">
            Empowering Quranic Institutions Globally
          </h1>
          <p className="text-lg text-gray-550 max-w-2xl mx-auto">
            QEMS is a modern, cloud-based platform specifically designed to standardize Quranic pedagogy, improve memorization quality, and streamline institute management.
          </p>
        </div>

        {/* Vision Statement */}
        <div className="dash-card p-8 bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-100 grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-display text-xl font-bold text-primary-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-700" /> Our Core Vision
            </h3>
            <p className="text-sm text-primary-855 leading-relaxed">
              We aim to bridge the gap between traditional Quran education and modern software efficiency. By equipping educators, parents, and students with robust progress tracking tools, we foster a structured, transparent, and rewarding Quran learning environment.
            </p>
          </div>
          <div className="text-center">
            <span className="text-5xl">📖</span>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-gray-900 text-center">Platform Core Pillars</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Pedagogical Standards",
                desc: "Granular lesson logging (Sabaq, Sabqi, Manzil) with visual milestone tracking for Hifz, Nazra, and Tajweed.",
                icon: BookOpen,
                color: "bg-blue-50 text-blue-700"
              },
              {
                title: "Institution Integrity",
                desc: "Secure multi-tenant architecture designed to scale seamlessly from tiny home circles to multi-branch networks.",
                icon: ShieldCheck,
                color: "bg-green-50 text-green-700"
              },
              {
                title: "Parent Engagement",
                desc: "Instant progress logs, automated attendance records, and direct digital messaging keeping parents informed.",
                icon: Heart,
                color: "bg-purple-50 text-purple-700"
              }
            ].map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="dash-card p-5 space-y-4">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", p.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-gray-950 text-base">{p.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} QEMS Quran Education Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
