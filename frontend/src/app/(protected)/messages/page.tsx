"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useConversations,
  useCreateConversation,
  useChatHistory,
  useSendMessage,
  useFriends,
  type Conversation,
  type Friend,
} from "@/hooks/useMessagingAPI";
import { useMessaging } from "@/hooks/useMessaging";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  PenSquare,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Circle,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

export default function MessagesPage() {
  const { user } = useAuth();
  const token = Cookies.get("accessToken") || "";

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");

  // Ref for messages container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // React Query hooks
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: friends } = useFriends();
  const { data: chatData } = useChatHistory(selectedConversation?.id || null);
  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();

  // Socket hook for real-time updates
  const messaging = useMessaging({
    token,
    userId: user?.id || 0,
    conversationId: selectedConversation?.id,
  });

  // Merge API messages with socket messages and remove duplicates
  const allMessages = [
    ...(chatData?.messages || []),
    ...messaging.messages,
  ];

  // Remove duplicates by id and tempId
  const uniqueMessages = allMessages.reduce((acc, msg) => {
    const exists = acc.some(
      (m) =>
        (m.id === msg.id && m.id > 0) || // Match by real ID
        (m.content === msg.content &&
          Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000) // Same content within 5 seconds
    );
    if (!exists) acc.push(msg);
    return acc;
  }, [] as any[]);

  const messages = uniqueMessages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // Trigger when new messages arrive

  // Also scroll when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedConversation?.id]);

  // Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    const receiverId = selectedConversation.otherUser.id;
    const content = messageInput;

    // Clear input immediately for better UX
    setMessageInput("");

    // Send ONLY via API - socket will handle real-time delivery
    try {
      await sendMessageMutation.mutateAsync({
        receiverId,
        content,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setMessageInput(content);
    }
  };

  // Handle creating conversation
  const handleStartConversation = async (friend: Friend) => {
    const conversation = await createConversationMutation.mutateAsync(friend.id);
    setSelectedConversation(conversation);
    setIsNewMessageOpen(false);
  };

  // Filter conversations by search
  const filteredConversations = conversations?.filter((conv) =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter friends by search
  const [friendSearch, setFriendSearch] = useState("");
  const filteredFriends = friends?.filter((friend) =>
    friend.name.toLowerCase().includes(friendSearch.toLowerCase())
  );

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to access messages</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 flex bg-gray-50">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 bg-white border-r flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <PenSquare size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search friends..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredFriends?.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleStartConversation(friend)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.name[0]}</AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <Circle
                            className="absolute bottom-0 right-0 fill-green-500 text-green-500"
                            size={10}
                          />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{friend.name}</p>
                        {friend.bio && <p className="text-sm text-gray-500 truncate">{friend.bio}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="p-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredConversations?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            filteredConversations?.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-100 transition-colors ${
                  selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.otherUser.avatar} />
                    <AvatarFallback>{conversation.otherUser.name[0]}</AvatarFallback>
                  </Avatar>
                  {conversation.isOnline && (
                    <Circle
                      className="absolute bottom-0 right-0 fill-green-500 text-green-500"
                      size={12}
                    />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{conversation.otherUser.name}</p>
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-gray-500 ml-2 shrink-0">
                        {formatMessageTime(conversation.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessageText || "No messages yet"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 shrink-0 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.otherUser.avatar} />
                    <AvatarFallback>{selectedConversation.otherUser.name[0]}</AvatarFallback>
                  </Avatar>
                  {selectedConversation.isOnline && (
                    <Circle
                      className="absolute bottom-0 right-0 fill-green-500 text-green-500"
                      size={10}
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedConversation.otherUser.name}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.isOnline ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Phone size={18} />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Video size={18} />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Info size={18} />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <>
                {messages.map((message, index) => {
                  const isOwn = message.senderId === user.id;
                  const showDate = index === 0 || !isSameDay(String(messages[index - 1].createdAt), String(message.createdAt));

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <div className="px-4 py-1 bg-white border rounded-full text-xs text-gray-500">
                            {formatDate(String(message.createdAt))}
                          </div>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-md ${isOwn ? "flex-row-reverse" : ""}`}>
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={message.sender.avatar} />
                            <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwn ? "bg-blue-600 text-white" : "bg-white border"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? "justify-end" : ""}`}>
                              <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                              {isOwn && (
                                <>
                                  {message.status === "READ" && <CheckCheck size={14} className="text-blue-500" />}
                                  {message.status === "DELIVERED" && <CheckCheck size={14} />}
                                  {message.status === "SENT" && <Check size={14} />}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messaging.typingUsers.size > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </div>
                    <span>{selectedConversation.otherUser.name} is typing...</span>
                  </div>
                )}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <Paperclip size={18} />
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <Smile size={18} />
                </Button>
                <Input
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    messaging.startTyping(selectedConversation.otherUser.id);
                  }}
                  placeholder={`Message ${selectedConversation.otherUser.name}...`}
                  className="flex-1"
                />
                <Button type="submit" disabled={!messageInput.trim()} className="h-9">
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <PenSquare size={40} className="text-gray-400" />
              </div>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatMessageTime(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function formatDate(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function isSameDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
}
