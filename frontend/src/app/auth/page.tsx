import { Metadata } from "next";

import { Suspense } from "react";
import AuthClient from "./auth-client";

export const metadata: Metadata = {
  title: "Welcome to Social - Login or Sign Up",
  description:
    "Join our community or sign in to connect with friends and share your moments",
  keywords: [
    "social media",
    "login",
    "register",
    "account",
    "community",
    "sign up",
  ],
  openGraph: {
    title: "Welcome to Social - Login or Sign Up",
    description:
      "Join our community or sign in to connect with friends and share your moments",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
              <div className="h-8 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>

            {/* Switch skeleton */}
            <div className="h-12 bg-gray-200 rounded-2xl mb-8"></div>

            {/* Form skeleton */}
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <AuthClient />
    </Suspense>
  );
}
