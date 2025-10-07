'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import PostCard from '@/components/posts/PostCard';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { Post, User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import FollowButton from '@/components/follow/FollowButton';
import { useAuth } from '@/hooks/useAuth';
import { useFollowCounts } from '@/hooks/useFollow';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = parseInt(id);
  const { user: currentUser } = useAuth();

  // Fetch user profile
  const { data: profileUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}`);
      return data;
    },
  });

  // Fetch user's posts
  const { data: userPosts = [], isLoading: isPostsLoading } = useQuery<Post[]>({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      const { data } = await api.get(`/posts/user/${userId}`, {
        params: { page: 1, limit: 20 },
      });
      return data.data || [];
    },
  });

  // Fetch follow counts
  const { data: followCounts } = useFollowCounts(userId);

  if (isUserLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-6 text-center">
          <p className="text-gray-500">User not found</p>
        </Card>
      </div>
    );
  }

  const joinedDate = format(new Date(profileUser.createdAt), 'MMMM yyyy');
  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              {profileUser.avatar ? (
                <AvatarImage
                  src={`${process.env.NEXT_PUBLIC_API_URL}${profileUser.avatar}`}
                  alt={profileUser.name}
                />
              ) : (
                <AvatarFallback className="text-3xl">
                  {profileUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileUser.name}
                  </h1>
                  <p className="text-gray-500">{profileUser.email}</p>
                  {profileUser.bio && (
                    <p className="text-gray-700 mt-2">{profileUser.bio}</p>
                  )}
                </div>

                {/* Follow Button - only show if not own profile */}
                {!isOwnProfile && <FollowButton userId={userId} />}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 mt-3 text-gray-500 text-sm">
                <Calendar size={16} />
                <span>Joined {joinedDate}</span>
              </div>

              <div className="flex space-x-4 mt-3 text-gray-500 text-sm flex-wrap gap-y-2">
                <span>
                  <strong>{profileUser.postsCount || 0}</strong> Posts
                </span>
                <span>
                  <strong>{followCounts?.followersCount || profileUser.followersCount || 0}</strong> Followers
                </span>
                <span>
                  <strong>{followCounts?.followingCount || profileUser.followingCount || 0}</strong> Following
                </span>
                <span>
                  <strong>{profileUser.commentsCount || 0}</strong> Comments
                </span>
                <span>
                  <strong>{profileUser.reactionsCount || 0}</strong> Reactions
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          {isOwnProfile ? 'Your Posts' : `${profileUser.name}'s Posts`}
        </h2>

        {isPostsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : userPosts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">
              {isOwnProfile ? "You haven't posted anything yet" : 'No posts yet'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
