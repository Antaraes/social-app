import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

export const useFollow = () => {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.post(`/follow/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus'] });
      queryClient.invalidateQueries({ queryKey: ['followCounts'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.delete(`/follow/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus'] });
      queryClient.invalidateQueries({ queryKey: ['followCounts'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
  };
};

export const useFollowStatus = (userId: number) => {
  return useQuery({
    queryKey: ['followStatus', userId],
    queryFn: async () => {
      const response = await axios.get(`/follow/status/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useFollowCounts = (userId: number) => {
  return useQuery({
    queryKey: ['followCounts', userId],
    queryFn: async () => {
      const response = await axios.get(`/follow/counts/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useFollowers = (userId: number, page: number = 1) => {
  return useQuery({
    queryKey: ['followers', userId, page],
    queryFn: async () => {
      const response = await axios.get(`/follow/followers/${userId}?page=${page}`);
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useFollowing = (userId: number, page: number = 1) => {
  return useQuery({
    queryKey: ['following', userId, page],
    queryFn: async () => {
      const response = await axios.get(`/follow/following/${userId}?page=${page}`);
      return response.data;
    },
    enabled: !!userId,
  });
};
