import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Terms of Service — QEMS" };

export default function TermsPage() {
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
        <h1 className="font-display text-3xl font-extrabold text-gray-900">Terms of Service</h1>
        <p className="text-xs text-gray-400">Last updated: June 15, 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">1. Acceptance of Terms</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            By creating an account or registering an institute on QEMS, you agree to comply with and be bound by these Terms of Service. If you do not agree, you are prohibited from using the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">2. Institute Owner Responsibilities</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            As an Institute Owner, you are solely responsible for verifying the credentials of the instructors you invite to your tenant, managing parental access controls, and ensuring student data complies with regional safeguarding regulations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">3. Fee Management & Collection</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            All student fee collections processed digitally or logged offline are governed by the policies of individual institutions. QEMS is not liable for fee disputes between parents and the institute owners.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">4. Modifications to the Service</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We reserve the right to deploy maintenance updates, visual dashboard enhancements, or change subscription tier options with advance platform notice.
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
