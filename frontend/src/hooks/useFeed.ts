import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';

export const useFeed = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: ['feed', limit],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axios.get(`/feed?page=${pageParam}&limit=${limit}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useExploreFeed = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: ['exploreFeed', limit],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axios.get(`/feed/explore?page=${pageParam}&limit=${limit}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};
