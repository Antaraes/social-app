'use client';

import { Button } from '@/components/ui/button';
import { useFollow, useFollowStatus } from '@/hooks/useFollow';
import { useAuth } from '@/hooks/useAuth';

interface FollowButtonProps {
  userId: number;
  className?: string;
}

export default function FollowButton({ userId, className }: FollowButtonProps) {
  const { user } = useAuth();
  const { follow, unfollow, isLoading } = useFollow();
  const { data: followStatus } = useFollowStatus(userId);

  if (!user || user.id === userId) {
    return null;
  }

  const isFollowing = followStatus?.isFollowing || false;

  const handleClick = () => {
    if (isFollowing) {
      unfollow(userId);
    } else {
      follow(userId);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={isFollowing ? 'outline' : 'default'}
      className={className}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
