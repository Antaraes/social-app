'use client';

import { useSearchParams } from 'next/navigation';
import { useSearch } from '@/hooks/useSearch';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/posts/PostCard';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { data, isLoading } = useSearch(query);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </Card>
      </div>
    );
  }

  const hasResults = data && (data.users?.length > 0 || data.posts?.length > 0 || data.hashtags?.length > 0);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Search results for <span className="text-blue-600">&quot;{query}&quot;</span>
      </h1>

      {!hasResults ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No results found</p>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="users">Users ({data.users?.length || 0})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({data.posts?.length || 0})</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags ({data.hashtags?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            {data.users && data.users.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Users</h2>
                <div className="space-y-2">
                  {data.users.map((user: any) => (
                    <Card key={user.id} className="p-4">
                      <Link href={`/profile/${user.id}`} className="flex items-center gap-3 hover:opacity-80">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          {user.bio && <div className="text-sm text-gray-500 line-clamp-1">{user.bio}</div>}
                          <div className="text-xs text-gray-400">
                            {user.followersCount} followers · {user.followingCount} following
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {data.posts && data.posts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Posts</h2>
                <div className="space-y-4">
                  {data.posts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {data.hashtags && data.hashtags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Hashtags</h2>
                <div className="space-y-2">
                  {data.hashtags.map((hashtag: any) => (
                    <Card key={hashtag.id} className="p-4">
                      <Link href={`/hashtag/${hashtag.name}`} className="hover:opacity-80">
                        <div className="font-medium text-blue-600">#{hashtag.name}</div>
                        <div className="text-sm text-gray-500">{hashtag.postsCount} posts</div>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {data.users && data.users.length > 0 ? (
              <div className="space-y-2">
                {data.users.map((user: any) => (
                  <Card key={user.id} className="p-4">
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        {user.bio && <div className="text-sm text-gray-500">{user.bio}</div>}
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-500">No users found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            {data.posts && data.posts.length > 0 ? (
              <div className="space-y-4">
                {data.posts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-500">No posts found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hashtags" className="mt-6">
            {data.hashtags && data.hashtags.length > 0 ? (
              <div className="space-y-2">
                {data.hashtags.map((hashtag: any) => (
                  <Card key={hashtag.id} className="p-4">
                    <Link href={`/hashtag/${hashtag.name}`} className="hover:opacity-80">
                      <div className="font-medium text-blue-600">#{hashtag.name}</div>
                      <div className="text-sm text-gray-500">{hashtag.postsCount} posts</div>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-500">No hashtags found</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
