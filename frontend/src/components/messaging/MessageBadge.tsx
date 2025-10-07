'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import Cookies from 'js-cookie';

export const MessageBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
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
