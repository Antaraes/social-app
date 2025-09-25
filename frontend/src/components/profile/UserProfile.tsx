"use client";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import PostCard from "../posts/PostCard";
import { Calendar, Edit2, Image as ImageIcon, X } from "lucide-react";
import { format } from "date-fns";
import api from "../../lib/axios";
import { Post, User } from "@/types";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { Skeleton } from "../ui/skeleton";

const UserProfile = () => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    avatar: null as File | null,
    avatarPreview: user?.avatar
      ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`
      : null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: userPosts = [], isLoading: isPostsLoading } = useQuery<Post[]>({
    queryKey: ["my-posts"],
    queryFn: async () => {
      const { data } = await api.get("/posts/my-posts", {
        params: { page: 1, limit: 10 },
      });
      return data.data;
    },
    enabled: !!user,
  });

  // Sync editState with user changes
  useEffect(() => {
    if (user) {
      setEditState({
        name: user.name,
        bio: user.bio || "",
        avatar: null,
        avatarPreview: user.avatar
          ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`
          : null,
      });
    } else {
    }
  }, [user]);

  // Clean up avatar preview
  useEffect(() => {
    return () => {
      if (
        editState.avatarPreview &&
        editState.avatarPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(editState.avatarPreview);
      }
    };
  }, [editState.avatarPreview]);

  if (!user || authLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditState((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpg|jpeg|png|gif)/)) {
      toast.error("Only JPG, JPEG, PNG, or GIF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setEditState((prev) => ({
      ...prev,
      avatar: file,
      avatarPreview: URL.createObjectURL(file),
    }));
  };

  const handleRemoveAvatar = () => {
    setEditState((prev) => ({ ...prev, avatar: null, avatarPreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editState.name.length > 100) {
      toast.error("Name must be 100 characters or less");
      return;
    }
    if (editState.bio && editState.bio.length > 160) {
      toast.error("Bio must be 160 characters or less");
      return;
    }

    try {
      const result = await updateProfile({
        name: editState.name,
        bio: editState.bio,
        avatar: editState.avatar ?? undefined,
      });
      if (result.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const joinedDate = format(new Date(user.createdAt), "MMMM yyyy");

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 sm:p-6">
      {/* User Info */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
        <CardContent className="p-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          {isEditing ? (
            <div className="flex flex-col items-center sm:items-start space-y-4">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  {editState.avatarPreview ? (
                    <AvatarImage
                      src={editState.avatarPreview}
                      alt="Avatar preview"
                    />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {editState.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {editState.avatarPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="absolute top-0 right-0 bg-black/60 hover:bg-black/80 text-white rounded-full h-8 w-8"
                    aria-label="Remove avatar"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 text-blue-600 hover:bg-blue-50"
                aria-label="Upload avatar"
              >
                <ImageIcon size={18} />
                <span>Change Avatar</span>
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          ) : (
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              {user.avatar ? (
                <AvatarImage
                  src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`}
                  alt={`${user.name}'s avatar`}
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          )}
          <div className="flex-1 space-y-4">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <Input
                    name="name"
                    value={editState.name}
                    onChange={handleInputChange}
                    placeholder="Name"
                    maxLength={100}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    aria-label="Name"
                  />
                  <div className="text-xs text-gray-400 text-right mt-1">
                    {editState.name.length}/100
                  </div>
                </div>
                <div>
                  <Textarea
                    name="bio"
                    value={editState.bio}
                    onChange={handleInputChange}
                    placeholder="Bio (optional)"
                    maxLength={160}
                    rows={3}
                    className="resize-none text-sm sm:text-base"
                    aria-label="Bio"
                  />
                  <div className="text-xs text-gray-400 text-right mt-1">
                    {editState.bio.length}/160
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEditToggle}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    aria-label="Cancel edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    disabled={!editState.name.trim()}
                    aria-label="Save profile"
                  >
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl font-bold">{user.name}</h1>
                <p className="text-gray-600">
                  @{user.name.toLowerCase().replace(/\s+/g, "")}
                </p>
                {user.bio && <p className="mt-2 text-gray-800">{user.bio}</p>}
                <div className="flex items-center space-x-4 mt-3 text-gray-500 text-sm">
                  <Calendar size={16} />
                  <span>Joined {joinedDate}</span>
                </div>
                <div className="flex space-x-4 mt-3 text-gray-500 text-sm">
                  <span>
                    <strong>{user.postsCount}</strong> Posts
                  </span>
                  <span>
                    <strong>{user.commentsCount}</strong> Comments
                  </span>
                  <span>
                    <strong>{user.reactionsCount}</strong> Reactions
                  </span>
                </div>
                <Button
                  onClick={handleEditToggle}
                  className="mt-4 h-10 sm:h-11 text-sm sm:text-base"
                  variant="outline"
                  aria-label="Edit profile"
                >
                  <Edit2 size={16} className="mr-2" />
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Posts */}
      <div className="backdrop-blur-sm">
        <h2 className="font-bold text-2xl sm:text-3xl pb-6 sm:pb-10">
          Your Posts
        </h2>
        {isPostsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No posts yet. Share your first post!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
