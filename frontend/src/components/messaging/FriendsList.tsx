'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { MessageCircle, Loader2, UserPlus } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

interface Friend {
  id: number;
  name: string;
  avatar?: string;
  isOnline: boolean;
  mutualFollows: boolean; // Both users follow each other
}

interface FriendsListProps {
  onStartConversation: (friend: Friend) => void;
}

export function FriendsList({ onStartConversation }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = Cookies.get('accessToken');
      if (!token) return;

      // Fetch mutual follows (friends who follow you back)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/follow/mutual`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }

      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      toast.error('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-4">
        <UserPlus size={48} className="mb-3 text-gray-300" />
        <p className="text-sm font-medium text-center mb-1">No friends yet</p>
        <p className="text-xs text-center text-gray-400">
          Follow users and have them follow you back to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No friends found
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 border-b transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    {friend.avatar ? (
                      <AvatarImage
                        src={`${process.env.NEXT_PUBLIC_API_URL}${friend.avatar}`}
                        alt={friend.name}
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {friend.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {friend.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {friend.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {friend.isOnline ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => onStartConversation(friend)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full"
              >
                <MessageCircle size={18} />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
