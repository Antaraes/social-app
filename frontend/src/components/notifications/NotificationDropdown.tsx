"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Link from "next/link";

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown = ({
  onClose,
}: NotificationDropdownProps) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useNotifications();

  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } =
    useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const { observerRef } = useInfiniteScroll({
    hasNextPage: hasNextPage || false,
    isFetchingNextPage,
    fetchNextPage,
  });

  const notifications = data?.pages.flatMap((page) => page.notifications) || [];

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onClose();
  };

  const getNotificationLink = (notification: any) => {
    switch (notification.entityType) {
      case "post":
        return `/posts`;
      case "user":
        return `/profile/${notification.entityId}`;
      default:
        return "#";
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAllAsRead()}
          disabled={isMarkingAllRead || notifications.length === 0}
          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3"
        >
          {isMarkingAllRead ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Check size={14} className="mr-1" />
              Mark all read
            </>
          )}
        </Button>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg
              className="w-16 h-16 mb-3 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              We'll notify you when something happens
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification: any) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => handleNotificationClick(notification)}
              >
                <div
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex space-x-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {notification.actor?.avatar ? (
                        <AvatarImage
                          src={`${process.env.NEXT_PUBLIC_API_URL}${notification.actor.avatar}`}
                          alt={notification.actor.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {notification.actor?.name?.charAt(0).toUpperCase() ||
                            "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          {notification.actor?.name || "Someone"}
                        </span>{" "}
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <div className="flex items-start space-x-1">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-4" />

            {isFetchingNextPage && (
              <div className="flex justify-center p-4">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
