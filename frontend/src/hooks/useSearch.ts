import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

export const useSearch = (query: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['search', query, limit],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return { users: [], posts: [], hashtags: [] };
      }
      const response = await axios.get(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data;
    },
    enabled: !!query && query.trim().length > 0,
  });
};

export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ['searchSuggestions', query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return { users: [], hashtags: [] };
      }
      const response = await axios.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: query.length >= 2,
  });
};

export const useHashtagSearch = (hashtagName: string, page: number = 1) => {
  return useQuery({
    queryKey: ['hashtagSearch', hashtagName, page],
    queryFn: async () => {
      const response = await axios.get(`/search/hashtag/${hashtagName}?page=${page}`);
      return response.data;
    },
    enabled: !!hashtagName,
  });
};

export const useSearchHistory = () => {
  return useQuery({
    queryKey: ['searchHistory'],
    queryFn: async () => {
      const response = await axios.get('/search/history');
      return response.data;
    },
  });
};

export const useClearSearchHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.delete('/search/history');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });
};
