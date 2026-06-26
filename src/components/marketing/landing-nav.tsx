"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "/about", label: "About", isRoute: true },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow-green">
              <span className="text-white text-sm font-bold font-arabic">ق</span>
            </div>
            <span className="font-display text-xl font-bold text-primary-900">QEMS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            {links.map((link) =>
              link.isRoute ? (
                <Link key={link.href} href={link.href} className="hover:text-primary-700 transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="hover:text-primary-700 transition-colors">
                  {link.label}
                </a>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-primary-50"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            open ? "max-h-80 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-2 border-t border-gray-100">
            {links.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50"
                >
                  {link.label}
                </a>
              )
            )}
            <div className="flex flex-col gap-2 pt-2 mt-1">
              <Link href="/auth/login" className="btn-ghost text-sm py-2 justify-center" onClick={() => setOpen(false)}>
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm py-2 justify-center" onClick={() => setOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
