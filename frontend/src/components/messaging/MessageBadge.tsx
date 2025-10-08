'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { messagingSocket } from '@/lib/socket';

export const MessageBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();

    const token = Cookies.get('accessToken');
    const userId = Cookies.get('userId');

    if (token && userId) {
      // Connect to messaging socket for real-time updates
      try {
        messagingSocket.connect(token, parseInt(userId));

        // Listen for new messages
        messagingSocket.onMessageReceive(() => {
          setUnreadCount((prev) => prev + 1);
        });

        // Listen for read status updates
        messagingSocket.onMessageStatus((status: any) => {
          if (status.status === 'read' && status.readBy) {
            // Refetch to get accurate count
            fetchUnreadCount();
          }
        });
      } catch (error) {
        console.error('Failed to connect messaging socket:', error);
      }
    }

    // Poll for updates every 60 seconds as backup
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => {
      clearInterval(interval);
      messagingSocket.off('message:receive');
      messagingSocket.off('message:status');
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = Cookies.get('accessToken');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messaging/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
    }
  };

  return (
    <Link href="/messages">
      <Button
        variant="ghost"
        size="sm"
        className="relative h-10 w-10 rounded-full hover:bg-gray-100"
        aria-label="Messages"
      >
        <MessageCircle size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 bg-blue-600 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
};
