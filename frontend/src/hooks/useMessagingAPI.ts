import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  status: "SENT" | "DELIVERED" | "READ";
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  id: number;
  participant1: number;
  participant2: number;
  lastMessageId?: number;
  lastMessageAt?: string;
  lastMessageText?: string;
  createdAt: string;
  updatedAt: string;
  otherUser: {
    id: number;
    name: string;
    avatar?: string;
  };
  unreadCount: number;
  isOnline: boolean;
}

export interface Friend {
  id: number;
  name: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  mutualFollows: boolean;
}

// Fetch conversations list
export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<Conversation[]> => {
      const { data } = await axios.get("/messaging/conversations");
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

// Fetch chat history for a conversation
export const useChatHistory = (conversationId: number | null) => {
  return useQuery({
    queryKey: ["chatHistory", conversationId],
    queryFn: async (): Promise<{ messages: Message[]; source: string }> => {
      if (!conversationId) return { messages: [], source: "none" };
      const { data } = await axios.get(
        `/messaging/conversations/${conversationId}/messages`
      );
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 3000,
  });
};

// Fetch mutual follows (friends)
export const useFriends = () => {
  return useQuery({
    queryKey: ["friends"],
    queryFn: async (): Promise<Friend[]> => {
      const { data } = await axios.get("/follow/mutual");
      return data;
    },
  });
};

// Create or get conversation
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId: number): Promise<Conversation> => {
      const { data } = await axios.post("/messaging/conversations", {
        participantId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

// Send message
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      receiverId: number;
      content: string;
      attachments?: any[];
    }): Promise<Message> => {
      const { data } = await axios.post("/messaging/send", payload);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate chat history for this conversation
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

// Mark messages as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: number[]): Promise<{ success: boolean }> => {
      const { data } = await axios.post("/messaging/mark-read", { messageIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    },
  });
};

// Get unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: async (): Promise<number> => {
      const { data } = await axios.get("/messaging/unread-count");
      return data.count || 0;
    },
    refetchInterval: 5000,
  });
};

// Check if can message user
export const useCanMessage = (userId: number | null) => {
  return useQuery({
    queryKey: ["canMessage", userId],
    queryFn: async (): Promise<{ canMessage: boolean }> => {
      if (!userId) return { canMessage: false };
      const { data } = await axios.get(`/messaging/can-message/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
};
