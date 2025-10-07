import axiosInstance from '../axios';

export interface Conversation {
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

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  attachments?: any[];
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  createdAt: Date;
  sender: {
    id: number;
    name: string;
    avatar?: string;
  };
}

export const messagingApi = {
  // Get conversation list
  async getConversations(page: number = 1, limit: number = 20): Promise<Conversation[]> {
    const response = await axiosInstance.get('/messaging/conversations', {
      params: { page, limit },
    });
    return response.data;
  },

  // Get chat history
  async getChatHistory(
    conversationId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: Message[]; source: string }> {
    const response = await axiosInstance.get(
      `/messaging/conversations/${conversationId}/messages`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  // Send message via HTTP (fallback)
  async sendMessage(receiverId: number, content: string, attachments?: any[]): Promise<Message> {
    const response = await axiosInstance.post('/messaging/send', {
      receiverId,
      content,
      attachments,
    });
    return response.data;
  },

  // Mark messages as read
  async markAsRead(messageIds: number[], conversationId: number): Promise<void> {
    await axiosInstance.post('/messaging/mark-read', {
      messageIds,
      conversationId,
    });
  },

  // Search messages in conversation
  async searchMessages(conversationId: number, query: string): Promise<Message[]> {
    const response = await axiosInstance.get(
      `/messaging/conversations/${conversationId}/search`,
      {
        params: { q: query },
      }
    );
    return response.data;
  },

  // Check if users can message each other
  async canMessage(userId: number): Promise<{ canMessage: boolean }> {
    const response = await axiosInstance.get(`/messaging/can-message/${userId}`);
    return response.data;
  },

  // Get user contacts (mutual follows)
  async getContacts(): Promise<number[]> {
    const response = await axiosInstance.get('/messaging/contacts');
    return response.data;
  },
};
