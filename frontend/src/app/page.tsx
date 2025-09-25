import { PostFeed } from "@/components/posts/PostFeed";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Social - Discover and Share Moments",
  description:
    "Explore posts, connect with friends, and share your moments on Social. Join our vibrant community today!",
  keywords: [
    "social media",
    "posts",
    "community",
    "share moments",
    "connect",
    "friends",
  ],
  openGraph: {
    title: "Social - Discover and Share Moments",
    description:
      "Explore posts, connect with friends, and share your moments on Social. Join our vibrant community today!",
    type: "website",
    images: [
      {
        url: "/images/mountains.jpg",
        width: 1200,
        height: 630,
        alt: "Social platform preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Social - Discover and Share Moments",
    description:
      "Explore posts, connect with friends, and share your moments on Social. Join our vibrant community today!",
  },
  robots: {
    index: true,
    follow: true,
  },
};
export default function Home() {
  return <PostFeed />;
}
