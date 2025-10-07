import { useEffect, useState, useCallback, useRef } from 'react';
import { messagingSocket, SocketMessage, TypingIndicator, UserStatus } from '../lib/socket';

interface UseMessagingOptions {
  token: string;
  userId: number;
  conversationId?: number;
}

export function useMessaging({ token, userId, conversationId }: UseMessagingOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SocketMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    try {
      messagingSocket.connect(token, userId);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnected(false);
    }

    return () => {
      messagingSocket.disconnect();
      setIsConnected(false);
    };
  }, [token, userId]);

  // Join conversation when conversationId changes
  useEffect(() => {
    if (!conversationId || !isConnected) return;

    messagingSocket.joinConversation(conversationId);

    return () => {
      messagingSocket.leaveConversation(conversationId);
    };
  }, [conversationId, isConnected]);

  // Listen for incoming messages
  useEffect(() => {
    const handleMessage = (message: SocketMessage) => {
      setMessages((prev) => [...prev, message]);

      // Auto-mark as delivered if message is for current user
      if (message.receiverId === userId) {
        messagingSocket.markDelivered(message.id);
      }
    };

    messagingSocket.onMessageReceive(handleMessage);

    return () => {
      messagingSocket.off('message:receive');
    };
  }, [userId]);

  // Listen for message status updates
  useEffect(() => {
    const handleStatus = (status: any) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (status.messageId === msg.id || status.messageIds?.includes(msg.id)) {
            return { ...msg, status: status.status.toUpperCase() };
          }
          return msg;
        })
      );
    };

    messagingSocket.onMessageStatus(handleStatus);

    return () => {
      messagingSocket.off('message:status');
    };
  }, []);

  // Listen for typing indicators
  useEffect(() => {
    const handleTyping = (data: TypingIndicator) => {
      if (data.conversationId !== conversationId) return;

      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    messagingSocket.onTypingIndicator(handleTyping);

    return () => {
      messagingSocket.off('typing:indicator');
    };
  }, [conversationId]);

  // Listen for user status
  useEffect(() => {
    const handleUserStatus = (status: UserStatus) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (status.status === 'online') {
          newSet.add(status.userId);
        } else {
          newSet.delete(status.userId);
        }
        return newSet;
      });
    };

    messagingSocket.onUserStatus(handleUserStatus);

    return () => {
      messagingSocket.off('user:status');
    };
  }, []);

  // Listen for offline messages
  useEffect(() => {
    const handleOfflineMessages = (offlineMessages: SocketMessage[]) => {
      setMessages((prev) => [...prev, ...offlineMessages]);
    };

    messagingSocket.onOfflineMessages(handleOfflineMessages);

    return () => {
      messagingSocket.off('offline:messages');
    };
  }, []);

  // Send message
  const sendMessage = useCallback(
    (content: string, receiverId: number, attachments?: any[]) => {
      const tempId = `temp_${Date.now()}`;

      try {
        messagingSocket.sendMessage({
          receiverId,
          content,
          attachments,
          tempId,
        });

        // Optimistically add message to UI
        const optimisticMessage: SocketMessage = {
          id: -1,
          conversationId: conversationId || 0,
          senderId: userId,
          receiverId,
          content,
          attachments,
          status: 'SENT',
          createdAt: new Date(),
          sender: { id: userId, name: 'You', avatar: undefined },
        };

        setMessages((prev) => [...prev, optimisticMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    },
    [conversationId, userId]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (messageIds: number[]) => {
      if (!conversationId) return;
      messagingSocket.markRead(messageIds, conversationId);
    },
    [conversationId]
  );

  // Start typing
  const startTyping = useCallback(
    (receiverId: number) => {
      if (!conversationId) return;

      messagingSocket.startTyping(conversationId, receiverId);

      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        messagingSocket.stopTyping(conversationId, receiverId);
      }, 3000);
    },
    [conversationId]
  );

  // Stop typing
  const stopTyping = useCallback(
    (receiverId: number) => {
      if (!conversationId) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      messagingSocket.stopTyping(conversationId, receiverId);
    },
    [conversationId]
  );

  return {
    isConnected,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    error,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  };
}
