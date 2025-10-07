'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useSearchSuggestions } from '@/hooks/useSearch';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: suggestions } = useSearchSuggestions(query);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (type: 'user' | 'hashtag', value: string | number) => {
    setShowSuggestions(false);
    if (type === 'user') {
      router.push(`/profile/${value}`);
    } else {
      router.push(`/hashtag/${value}`);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search users, posts, hashtags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10"
        />
      </form>

      {showSuggestions && query.length >= 2 && (suggestions?.users?.length > 0 || suggestions?.hashtags?.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions?.users && suggestions.users.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500">Users</div>
              {suggestions.users.map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => handleSuggestionClick('user', user.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium">{user.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{user.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {suggestions?.hashtags && suggestions.hashtags.length > 0 && (
            <div className="p-2 border-t">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500">Hashtags</div>
              {suggestions.hashtags.map((hashtag: any) => (
                <button
                  key={hashtag.id}
                  onClick={() => handleSuggestionClick('hashtag', hashtag.name)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-left"
                >
                  <div className="font-medium text-sm text-blue-600">#{hashtag.name}</div>
                  <div className="text-xs text-gray-500">{hashtag.postsCount} posts</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
