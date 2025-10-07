'use client';

import { useState, useEffect, useRef } from 'react';
import { useMessaging } from '../../hooks/useMessaging';
import { SocketMessage } from '../../lib/socket';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Smile,
  Paperclip,
  Send,
  MoreVertical,
  Phone,
  Video,
  Info,
  Search,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

interface ChatBoxProps {
  conversationId: number;
  receiverId: number;
  receiverName: string;
  receiverAvatar?: string;
  token: string;
  userId: number;
}

export function ChatBox({
  conversationId,
  receiverId,
  receiverName,
  receiverAvatar,
  token,
  userId,
}: ChatBoxProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    error,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  } = useMessaging({ token, userId, conversationId });

  const isReceiverOnline = onlineUsers.has(receiverId);
  const isReceiverTyping = typingUsers.has(receiverId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when they appear
  useEffect(() => {
    const unreadMessages = messages
      .filter((msg) => msg.receiverId === userId && msg.status !== 'READ')
      .map((msg) => msg.id);

    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages);
    }
  }, [messages, userId, markAsRead]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    sendMessage(inputMessage, receiverId);
    setInputMessage('');
    stopTyping(receiverId);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    startTyping(receiverId);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, message) => {
    const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - Slack Style */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9">
            {receiverAvatar ? (
              <AvatarImage
                src={`${process.env.NEXT_PUBLIC_API_URL}${receiverAvatar}`}
                alt={receiverName}
              />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {receiverName.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
            {isReceiverOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-bold text-sm text-gray-900">{receiverName}</h3>
            <div className="flex items-center space-x-1">
              {isReceiverOnline ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-gray-600">Active now</span>
                </>
              ) : (
                <span className="text-xs text-gray-500">Offline</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
          >
            <Phone size={18} className="text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
          >
            <Video size={18} className="text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
          >
            <Search size={18} className="text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
          >
            <Info size={18} className="text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="mx-4 mt-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span>Reconnecting...</span>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
          <div key={date}>
            {/* Date Divider */}
            <div className="flex items-center justify-center my-4">
              <div className="px-4 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 shadow-sm">
                {formatDate(date)}
              </div>
            </div>

            {/* Messages for this date */}
            {msgs.map((message: SocketMessage, index: number) => {
              const isOwnMessage = message.senderId === userId;
              const showAvatar =
                index === 0 ||
                msgs[index - 1].senderId !== message.senderId;

              return (
                <div
                  key={message.id || index}
                  className={`group flex items-start space-x-2 mb-2 hover:bg-gray-100 px-2 py-1 rounded transition-colors ${
                    isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8 mt-0.5">
                      {showAvatar ? (
                        receiverAvatar ? (
                          <AvatarImage
                            src={`${process.env.NEXT_PUBLIC_API_URL}${receiverAvatar}`}
                            alt={receiverName}
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {receiverName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </Avatar>
                  )}

                  <div
                    className={`flex-1 ${isOwnMessage ? 'flex flex-col items-end' : ''}`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`inline-block max-w-[70%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>

                    {/* Timestamp and Status */}
                    <div
                      className={`flex items-center space-x-1 mt-1 px-2 ${
                        isOwnMessage ? 'justify-end' : ''
                      }`}
                    >
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </span>
                      {isOwnMessage && (
                        <span className="text-xs">
                          {message.status === 'READ' && (
                            <CheckCheck size={14} className="text-blue-500" />
                          )}
                          {message.status === 'DELIVERED' && (
                            <CheckCheck size={14} className="text-gray-400" />
                          )}
                          {message.status === 'SENT' && (
                            <Check size={14} className="text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-200 rounded"
                    >
                      <MoreVertical size={14} className="text-gray-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {isReceiverTyping && (
          <div className="flex items-start space-x-2 px-2 py-1">
            <Avatar className="h-8 w-8">
              {receiverAvatar ? (
                <AvatarImage
                  src={`${process.env.NEXT_PUBLIC_API_URL}${receiverAvatar}`}
                  alt={receiverName}
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                  {receiverName.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Slack Style */}
      <div className="border-t bg-white px-4 py-3">
        <div className="border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onBlur={() => stopTyping(receiverId)}
            placeholder={`Message ${receiverName}`}
            className="w-full px-4 py-3 text-sm resize-none focus:outline-none rounded-t-lg"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            disabled={!isConnected}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={18} className="text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded"
              >
                <Paperclip size={18} className="text-gray-600" />
              </Button>
            </div>

            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || !isConnected}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send size={16} className="mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
