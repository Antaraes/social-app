// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  bio?: string;
  avatar?: string;
  postsCount: number;
  commentsCount: number;
  reactionsCount: number;
  followersCount?: number;
  followingCount?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar?: File;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  postId: number;
  parentId?: number;
  user: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  children: Comment[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  image?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  reactionCount: number;
  user: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  _count: {
    comments: number;
    reactions: number;
  };
  userReaction: "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY" | null;
  reactionCounts: {
    LIKE: number;
    LOVE: number;
    HAHA: number;
    WOW: number;
    SAD: number;
    ANGRY: number;
  };
}

export interface PostsResponse {
  data: Post[];
  nextCursor: number | null;
}

export interface CreateReactionDto {
  type: "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";
}
