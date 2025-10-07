import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import api from '../lib/axios';
import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { toast } from 'react-toastify';

export const useNotifications = (options?: { unreadOnly?: boolean }) => {
  return useInfiniteQuery({
    queryKey: ['notifications', options?.unreadOnly ? 'unread' : 'all'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get('/notifications', {
        params: {
          skip: pageParam,
          take: 20,
          unreadOnly: options?.unreadOnly,
        },
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore
        ? (lastPage.notifications?.length || 0) + (lastPage.skip || 0)
        : undefined;
    },
    initialPageParam: 0,
  });
};

export const useNotificationCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await api.patch(`/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Real-time notifications hook
export const useRealtimeNotifications = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handleNotification = (event: any) => {
      console.log('📬 Notification event received:', event.type);

      if (event.type === 'new') {
        // Show toast notification
        const actorName = event.data.actor?.name || 'Someone';
        toast.info(`${actorName} ${event.data.message}`, {
          autoClose: 5000,
          position: 'top-right',
        });

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } else if (event.type === 'marked-read') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } else if (event.type === 'all-marked-read') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [queryClient]);
};
