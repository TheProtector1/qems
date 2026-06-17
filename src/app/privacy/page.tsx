import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy Policy — QEMS" };

export default function PrivacyPage() {
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
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-gray-150 p-8 shadow-sm">
        <h1 className="font-display text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
        <p className="text-xs text-gray-400">Last updated: June 15, 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">1. Information We Collect</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We collect student details (e.g. name, age, gender), parent information (phone, email), and lesson progression metrics (accuracy, fluency) strictly to generate analytical dashboard logs for your institute.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">2. How We Protect Student Data</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            All stored student records are encrypted. Only authorized administrators, assigned class instructors, and confirmed student guardians can access progress details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">3. Cookies & Local Storage</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We use secure cookies and local storage tokens solely to maintain portal session authentication state and user preference parameters.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">4. Third-Party Sharing</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            QEMS does not monetize, sell, or disclose personal student records or institute statistics to any third-party marketing entities.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} QEMS. All rights reserved.</p>
      </footer>
    </div>
  );
}
