"use client";
import { usePosts } from "../../hooks/usePosts";

import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export const PostFeed = () => {
  const {
    posts,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = usePosts();

  useInfiniteScroll(hasNextPage, isFetchingNextPage, fetchNextPage);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading posts. Please try again.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CreatePost />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!hasNextPage && posts.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              You've reached the end!
            </div>
          )}

          {posts.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No posts yet. Be the first to share!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
