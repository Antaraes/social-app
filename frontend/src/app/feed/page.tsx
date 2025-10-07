'use client';

import { useEffect } from 'react';
import { useFeed } from '@/hooks/useFeed';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import PostCard from '@/components/posts/PostCard';
import { Card } from '@/components/ui/card';

export default function FeedPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFeed();

  const { observerRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card className="p-6 text-center">
          <p className="text-red-500">Error loading feed</p>
        </Card>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Feed</h1>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">No posts yet. Follow some users to see their posts!</p>
          </Card>
        ) : (
          <>
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll observer */}
            <div ref={observerRef} className="h-10 flex items-center justify-center">
              {isFetchingNextPage && (
                <div className="text-sm text-gray-500">Loading more...</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
