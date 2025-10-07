import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

interface DraftData {
  title?: string;
  content: string;
  image?: string;
}

export const useDrafts = () => {
  return useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const response = await axios.get('/drafts');
      return response.data;
    },
  });
};

export const useDraft = (draftId: number) => {
  return useQuery({
    queryKey: ['draft', draftId],
    queryFn: async () => {
      const response = await axios.get(`/drafts/${draftId}`);
      return response.data;
    },
    enabled: !!draftId,
  });
};

export const useSaveDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ draftData, draftId }: { draftData: DraftData; draftId?: number }) => {
      if (draftId) {
        const response = await axios.put(`/drafts/${draftId}`, draftData);
        return response.data;
      } else {
        const response = await axios.post('/drafts', draftData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
};

export const useDeleteDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: number) => {
      const response = await axios.delete(`/drafts/${draftId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
};

export const useDeleteAllDrafts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.delete('/drafts');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
};
