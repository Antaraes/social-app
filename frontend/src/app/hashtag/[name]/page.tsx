'use client';

import { use } from 'react';
import { useHashtagSearch } from '@/hooks/useSearch';
import PostCard from '@/components/posts/PostCard';
import { Card } from '@/components/ui/card';

export default function HashtagPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const { data, isLoading } = useHashtagSearch(name);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-600">#{name}</h1>
        {data?.hashtag && (
          <p className="text-gray-500 mt-2">{data.hashtag.postsCount} posts</p>
        )}
      </div>

      {!data?.hashtag || data.posts.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No posts found with this hashtag</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
