import UserProfile from "@/components/profile/UserProfile";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Profile | MyApp",
  description: "View and manage your user profile",
};

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-purple-50 to-blue-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <UserProfile />
    </Suspense>
  );
}
