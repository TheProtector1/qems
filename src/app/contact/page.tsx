"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSuccess(false), 3000);
    }, 1200);
  };

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
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center space-y-4 mb-12">
          <h1 className="font-display text-4xl font-extrabold text-gray-900 tracking-tight">
            Get In Touch With Us
          </h1>
          <p className="text-base text-gray-500 max-w-lg mx-auto">
            Have questions about our plans, pricing, or setting up your academy? Fill out the form below.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Details */}
          <div className="space-y-6">
            <div className="dash-card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">Support Channels</h3>
              
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-gray-400">Email Us</p>
                    <p className="font-medium">support@qems.io</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-gray-400">Call Us</p>
                    <p className="font-medium">+92 (300) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-gray-400">Headquarters</p>
                    <p className="font-medium">F-7 Sector, Islamabad, Pakistan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 dash-card p-8 bg-white">
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Message sent successfully! We will get back to you shortly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Qari Bilal"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="bilal@academy.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Sibling discount question"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message</label>
                <textarea
                  placeholder="How can we help your institution?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="form-input resize-none"
                  required
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 text-sm font-semibold"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-xs text-gray-400 mt-12">
        <p>© {new Date().getFullYear()} QEMS Quran Education Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
