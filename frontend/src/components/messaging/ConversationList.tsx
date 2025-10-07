'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    name: string;
    avatar?: string;
  };
  lastMessageText?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  isOnline: boolean;
}

interface ConversationListProps {
  token: string;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
  token,
  onSelectConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messaging/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchConversations}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className="flex items-center p-4 hover:bg-gray-100 cursor-pointer border-b transition-colors"
        >
          <div className="relative mr-3">
            <img
              src={conversation.otherUser.avatar || '/default-avatar.png'}
              alt={conversation.otherUser.name}
              className="w-12 h-12 rounded-full"
            />
            {conversation.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate">
                {conversation.otherUser.name}
              </h3>
              {conversation.lastMessageAt && (
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 truncate">
                {conversation.lastMessageText || 'No messages yet'}
              </p>
              {conversation.unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
