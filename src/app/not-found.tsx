import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="text-center">
        <p className="arabic text-4xl text-gold-light mb-4">٤٠٤</p>
        <h1 className="font-display text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-green-100/70 text-lg mb-8">Page not found</p>
        <Link href="/" className="btn-accent">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
