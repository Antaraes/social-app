import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";

interface UpdateCommentParams {
  commentId: number;
  content: string;
}

interface DeleteCommentParams {
  commentId: number;
  postId: number;
}

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }: UpdateCommentParams) => {
      const { data } = await api.put(`/comments/${commentId}`, { content });
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all comment queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }: DeleteCommentParams) => {
      const { data } = await api.delete(`/comments/${commentId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific post's comments
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
    },
  });
};
