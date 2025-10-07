"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Post, PostsResponse } from "../types";
import api from "../lib/axios";

export const usePosts = () => {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam }: { pageParam?: number }) => {
      const response = await api.get("/posts", {
        params: {
          cursor: pageParam,
          limit: 10,
        },
      });
      return response.data as PostsResponse;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  const createPostMutation = useMutation({
    mutationFn: async ({
      content,
      title,
      image,
    }: {
      content: string;
      title: string;
      image?: File;
    }) => {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("title", title);
      if (image) formData.append("image", image);
      const response = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    },
  });

  const editPostMutation = useMutation({
    mutationFn: async ({
      postId,
      title,
      content,
      image,
    }: {
      postId: number;
      title: string;
      content: string;
      image?: File | null;
    }) => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (image) formData.append("image", image);
      const response = await api.put(`/posts/${postId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async ({
      postId,
      reactionType,
    }: {
      postId: number;
      reactionType: string;
    }) => {
      const response = await api.post(`/reactions/posts/${postId}`, {
        type: reactionType,
      });
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({
      postId,
      content,
      parentId,
    }: {
      postId: number;
      content: string;
      parentId?: number;
    }) => {
      const response = await api.post(`/comments/posts/${postId}`, {
        content,
        parentId,
      });
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  return {
    posts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    createPost: createPostMutation.mutate,
    editPost: editPostMutation.mutate,
    deletePost: deletePostMutation.mutate,
    likePost: likePostMutation.mutate,
    addComment: addCommentMutation.mutate,
    isCreatingPost: createPostMutation.isPending,
    isEditingPost: editPostMutation.isPending,
    isDeletingPost: deletePostMutation.isPending,
    isLikingPost: likePostMutation.isPending,
    isAddingComment: addCommentMutation.isPending,
  };
};
