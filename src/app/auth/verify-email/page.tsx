"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl border border-gray-100 sm:px-10 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
              <h2 className="text-xl font-bold text-gray-900">Verifying Email...</h2>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900">Email Verified!</h2>
              <p className="text-sm text-gray-500">{message}</p>
              <Link href="/auth/login" className="mt-4 btn-primary w-full justify-center">
                Proceed to Login
              </Link>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
              <p className="text-sm text-gray-500">{message}</p>
              <Link href="/auth/login" className="mt-4 btn-ghost w-full justify-center">
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
