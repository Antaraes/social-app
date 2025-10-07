"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Post, Comment } from "../../types";
import { usePosts } from "../../hooks/usePosts";
import { useAuth } from "../../hooks/useAuth";
import { useUpdateComment, useDeleteComment } from "../../hooks/useComments";
import api from "../../lib/axios";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  Heart,
  MessageCircle,
  Share,
  Edit2,
  Trash2,
  Check,
  X,
  Image as ImageIcon,
  Loader2,
  Reply,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { toast } from "react-toastify";
import { parseTextWithHashtagsAndMentions } from "@/lib/textParser";
import Link from "next/link";

interface PostCardProps {
  post: Post;
}

interface EditState {
  title: string;
  content: string;
  image: File | null;
  imagePreview: string | null;
}

interface ReactionConfig {
  icons: Record<string, string>;
  types: string[];
}

interface FlatComment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  postId: number;
  parentId?: number;
  user: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  level: number;
  parentUserName?: string;
}

// Configuration following Open/Closed Principle (OCP)
const REACTION_CONFIG: ReactionConfig = {
  icons: {
    LIKE: "👍",
    LOVE: "❤️",
    HAHA: "😂",
    WOW: "😮",
    SAD: "😢",
    ANGRY: "😣",
  },
  types: ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"],
};

// Helper functions following Single Responsibility Principle (SRP)
const fetchComments = async (postId: string | number) => {
  const { data } = await api.get(`/comments/posts/${postId}`);
  return data as Comment[];
};

const flattenComments = (
  comments: Comment[],
  level = 0,
  parentUserName?: string
): FlatComment[] => {
  const result: FlatComment[] = [];

  comments.forEach((comment) => {
    result.push({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      userId: comment.userId,
      postId: comment.postId,
      parentId: comment.parentId,
      user: comment.user,
      level,
      parentUserName,
    });

    if (comment.children && comment.children.length > 0) {
      result.push(
        ...flattenComments(comment.children, level + 1, comment.user.name)
      );
    }
  });

  return result;
};

const validateImageFile = (file: File): string | null => {
  if (!file.type.match(/image\/(jpg|jpeg|png|gif)/)) {
    return "Only JPG, JPEG, PNG, or GIF files are allowed";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "File size must be less than 5MB";
  }
  return null;
};

const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

const usePostEdit = (post: Post) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    title: post.title,
    content: post.content,
    image: null,
    imagePreview: post.image
      ? `${process.env.NEXT_PUBLIC_API_URL}${post.image}`
      : null,
  });

  const resetEditState = () => {
    setEditState({
      title: post.title,
      content: post.content,
      image: null,
      imagePreview: post.image
        ? `${process.env.NEXT_PUBLIC_API_URL}${post.image}`
        : null,
    });
  };

  const startEditing = () => {
    resetEditState();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    resetEditState();
    setIsEditing(false);
  };

  const updateEditState = (updates: Partial<EditState>) => {
    setEditState((prev) => ({ ...prev, ...updates }));
  };

  return {
    isEditing,
    editState,
    setIsEditing,
    updateEditState,
    startEditing,
    cancelEditing,
    resetEditState,
  };
};

const useImageUpload = (
  updateEditState: (updates: Partial<EditState>) => void
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const imagePreview = createImagePreview(file);
    updateEditState({ image: file, imagePreview });
  };

  const removeImage = () => {
    updateEditState({ image: null, imagePreview: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return {
    fileInputRef,
    handleImageChange,
    removeImage,
    triggerImageUpload,
  };
};

// Component following Single Responsibility Principle
const PostHeader = ({
  post,
  timeAgo,
  isOwnPost,
  onEdit,
  onDelete,
  isDeletingPost,
}: {
  post: Post;
  timeAgo: string;
  isOwnPost: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeletingPost: boolean;
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-3">
      <Avatar className="h-12 w-12">
        {post.user.avatar ? (
          <AvatarImage
            src={`${process.env.NEXT_PUBLIC_API_URL}${post.user.avatar}`}
            alt={`${post.user.name}'s avatar`}
          />
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
            {post.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <div>
        <Link href={`/profile/${post.user.id}`} className="hover:underline">
          <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
        </Link>
        <span className="text-gray-500 text-sm">{timeAgo}</span>
      </div>
    </div>
    {isOwnPost && (
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full h-9 w-9 p-0"
          aria-label="Edit post"
        >
          <Edit2 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeletingPost}
          className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9 p-0"
          aria-label="Delete post"
        >
          {isDeletingPost ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </Button>
      </div>
    )}
  </div>
);

const PostEditForm = ({
  editState,
  updateEditState,
  onSave,
  onCancel,
  isSaving,
  imageUpload,
}: {
  editState: EditState;
  updateEditState: (updates: Partial<EditState>) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSaving: boolean;
  imageUpload: ReturnType<typeof useImageUpload>;
}) => (
  <div className="space-y-4 bg-gray-50/50 rounded-2xl p-6">
    <form onSubmit={onSave} className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Give your post a title..."
          value={editState.title}
          onChange={(e) => updateEditState({ title: e.target.value })}
          maxLength={200}
          className="border-0 bg-white rounded-xl px-4 py-3 text-lg font-medium shadow-sm focus:shadow-md transition-shadow"
          aria-label="Post title"
        />
        <div className="text-xs text-gray-400 text-right">
          {editState.title.length}/200
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="What's on your mind?"
          value={editState.content}
          onChange={(e) => updateEditState({ content: e.target.value })}
          rows={4}
          maxLength={500}
          className="resize-none border-0 bg-white rounded-xl px-4 py-3 shadow-sm focus:shadow-md transition-shadow"
          aria-label="Post content"
        />
        <div className="text-xs text-gray-400 text-right">
          {editState.content.length}/500
        </div>
      </div>

      {editState.imagePreview && (
        <div className="relative rounded-xl overflow-hidden shadow-sm">
          <img
            src={editState.imagePreview}
            alt="Preview"
            className="w-full h-auto max-h-64 object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={imageUpload.removeImage}
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-black/70 hover:bg-black/80 text-white rounded-full backdrop-blur-sm"
            aria-label="Remove image"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={imageUpload.triggerImageUpload}
          className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          aria-label="Upload image"
        >
          <ImageIcon size={18} />
          <span>Add Photo</span>
        </Button>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 hover:bg-white rounded-xl"
            aria-label="Cancel edit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={
              !editState.title.trim() || !editState.content.trim() || isSaving
            }
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center space-x-2 shadow-sm hover:shadow-md transition-all"
            aria-label="Save post"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={imageUpload.fileInputRef}
        onChange={imageUpload.handleImageChange}
        className="hidden"
      />
    </form>
  </div>
);

// Post content display component
const PostContent = ({ post }: { post: Post }) => (
  <div className="space-y-4">
    <h4 className="text-xl font-semibold text-gray-900 leading-tight">
      {post.title}
    </h4>
    <p className="text-gray-700 leading-relaxed text-base">
      {parseTextWithHashtagsAndMentions(post.content)}
    </p>
    {post.image && (
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}${post.image}`}
          alt={`Post ${post.id}`}
          className="w-full h-auto max-h-96 object-cover"
        />
      </div>
    )}
  </div>
);

// Reaction picker component
const ReactionPicker = ({
  isVisible,
  userReaction,
  onReactionSelect,
}: {
  isVisible: boolean;
  userReaction: string | null;
  onReactionSelect: (type: string) => void;
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-10 left-0 bg-white shadow-xl rounded-2xl p-3 flex space-x-2 z-50 border-0">
      {REACTION_CONFIG.types.map((type) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          onClick={() => onReactionSelect(type)}
          className={`text-2xl hover:scale-125 transition-all duration-200 rounded-xl h-12 w-12 p-0 ${
            userReaction === type ? "bg-blue-50 scale-110" : ""
          }`}
          aria-label={`React with ${type.toLowerCase()}`}
        >
          {REACTION_CONFIG.icons[type]}
        </Button>
      ))}
    </div>
  );
};

// Improved flat comment component
const CommentItem = ({
  comment,
  postId,
  onReply,
}: {
  comment: FlatComment;
  postId: number;
  onReply: (commentId: number, userName: string) => void;
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showActions, setShowActions] = useState(false);
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  const isOwnComment = user && Number(comment.userId) === Number(user.id);

  const handleUpdate = () => {
    if (!editContent.trim()) return;

    updateComment(
      { commentId: comment.id, content: editContent },
      {
        onSuccess: () => {
          toast.success("Comment updated successfully");
          setIsEditing(false);
        },
        onError: () => {
          toast.error("Failed to update comment");
        },
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteComment(
        { commentId: comment.id, postId },
        {
          onSuccess: () => {
            toast.success("Comment deleted successfully");
          },
          onError: () => {
            toast.error("Failed to delete comment");
          },
        }
      );
    }
  };

  const cancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div
      className={`flex space-x-3 ${
        comment.level > 0 ? "ml-12 border-l-2 border-gray-100 pl-4" : ""
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar className="h-9 w-9 flex-shrink-0">
        {comment.user.avatar ? (
          <AvatarImage
            src={`${process.env.NEXT_PUBLIC_API_URL}${comment.user.avatar}`}
            alt={`${comment.user.name}'s avatar`}
          />
        ) : (
          <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
            {comment.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-2xl px-4 py-3 relative group">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm text-gray-900">
                {comment.user.name}
              </span>
              {comment.parentUserName && comment.level > 0 && (
                <>
                  <Reply size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {comment.parentUserName}
                  </span>
                </>
              )}
            </div>
            {isOwnComment && showActions && !isEditing && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                  aria-label="Edit comment"
                >
                  <Edit2 size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                  aria-label="Delete comment"
                >
                  {isDeleting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </Button>
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] text-sm border-0 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={!editContent.trim() || isUpdating}
                  className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs"
                >
                  {isUpdating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEdit}
                  className="h-7 px-3 text-gray-600 hover:bg-gray-100 rounded-lg text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">
              {comment.content}
            </p>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>{timeAgo}</span>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id, comment.user.name)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg px-2 py-1 h-auto text-xs font-medium transition-colors"
                aria-label={`Reply to ${comment.user.name}'s comment`}
              >
                Reply
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main PostCard component
const PostCard = ({ post }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: number;
    userName: string;
  } | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const {
    likePost,
    addComment,
    deletePost,
    editPost,
    isDeletingPost,
    isEditingPost,
  } = usePosts();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { isEditing, editState, updateEditState, startEditing, cancelEditing } =
    usePostEdit(post);
  const imageUpload = useImageUpload(updateEditState);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });
  const isOwnPost = user && Number(post.userId) === Number(user.id);

  // Clean up image preview on unmount
  useEffect(() => {
    return () => {
      if (
        editState.imagePreview &&
        editState.imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(editState.imagePreview);
      }
    };
  }, [editState.imagePreview]);

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["comments", post.id],
    queryFn: () => fetchComments(post.id),
    enabled: showComments,
  });

  const flatComments = flattenComments(comments);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState.title.trim() || !editState.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    try {
      await editPost({
        postId: post.id,
        title: editState.title,
        content: editState.content,
        image: editState.image,
      });
      toast.success("Post updated successfully");
      cancelEditing();
    } catch (error) {
      toast.error("Failed to update post");
      console.error("Error updating post:", error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    try {
      await likePost({ postId: post.id, reactionType });
      setShowReactionPicker(false);
    } catch (error) {
      toast.error("Failed to toggle reaction");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsCommentSubmitting(true);
    try {
      await addComment({
        postId: post.id,
        content: commentContent,
        parentId: replyTo?.id,
      });
      setCommentContent("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleReply = (commentId: number, userName: string) => {
    setReplyTo({ id: commentId, userName });
    setCommentContent(`@${userName} `);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setCommentContent("");
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(post.id);
        toast.success("Post deleted successfully");
      } catch (error) {
        toast.error("Failed to delete post");
      }
    }
  };

  return (
    <Card className="mb-8 bg-white shadow-sm hover:shadow-md transition-all duration-300 border-0 rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <PostHeader
          post={post}
          timeAgo={timeAgo}
          isOwnPost={!!isOwnPost}
          onEdit={startEditing}
          onDelete={handleDelete}
          isDeletingPost={isDeletingPost}
        />

        {isEditing ? (
          <PostEditForm
            editState={editState}
            updateEditState={updateEditState}
            onSave={handleEditSave}
            onCancel={cancelEditing}
            isSaving={isEditingPost}
            imageUpload={imageUpload}
          />
        ) : (
          <>
            <PostContent post={post} />

            {/* Reaction Counts */}
            {post.reactionCount > 0 && (
              <div className="flex items-center space-x-3 mt-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  {Object.entries(post.reactionCounts ?? {}).map(
                    ([type, count]) =>
                      count > 0 ? (
                        <span
                          key={type}
                          className="flex items-center space-x-1 bg-gray-50 rounded-full px-2 py-1"
                        >
                          <span className="text-base">
                            {REACTION_CONFIG.icons[type]}
                          </span>
                          <span className="text-xs font-medium">{count}</span>
                        </span>
                      ) : null
                  )}
                </div>
                <span className="text-gray-400 text-xs">
                  {post.reactionCount}{" "}
                  {post.reactionCount === 1 ? "reaction" : "reactions"}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReactionPicker((prev) => !prev)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      post.userReaction
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    aria-label="React to post"
                  >
                    <Heart
                      size={18}
                      className={post.userReaction ? "fill-current" : ""}
                    />
                    <span className="font-medium text-sm">
                      {post.userReaction || "React"}
                    </span>
                  </Button>
                  <ReactionPicker
                    isVisible={showReactionPicker}
                    userReaction={post.userReaction}
                    onReactionSelect={handleReaction}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments((prev) => !prev)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                  aria-label="Toggle comments"
                >
                  <MessageCircle size={18} />
                  <span className="font-medium text-sm">
                    {post._count.comments}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                  aria-label="Share post"
                >
                  <Share size={18} />
                  <span className="font-medium text-sm">Share</span>
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-8 space-y-6 border-t border-gray-100 pt-6">
                {user && (
                  <div className="space-y-3">
                    {replyTo && (
                      <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2">
                        <span className="text-sm text-blue-700">
                          Replying to{" "}
                          <span className="font-medium">
                            @{replyTo.userName}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelReply}
                          className="text-blue-600 hover:text-blue-800 h-6 w-6 p-0 rounded-full"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    )}
                    <form
                      onSubmit={handleCommentSubmit}
                      className="flex space-x-3"
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {user.avatar ? (
                          <AvatarImage
                            src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`}
                            alt={`${user.name}'s avatar`}
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 flex space-x-3">
                        <Textarea
                          placeholder={
                            replyTo
                              ? `Reply to ${replyTo.userName}...`
                              : "Write a comment..."
                          }
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="flex-1 resize-none border-0 bg-gray-50 rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all min-h-[44px] max-h-32"
                          rows={1}
                          aria-label="Comment content"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            !commentContent.trim() || isCommentSubmitting
                          }
                          className="self-end h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all"
                          aria-label="Submit comment"
                        >
                          {isCommentSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            "Post"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex space-x-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-50 rounded-2xl p-4">
                            <Skeleton className="h-3 w-1/4 mb-2" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : flatComments.length > 0 ? (
                  <div className="space-y-4">
                    {flatComments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
                        onReply={handleReply}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle
                      size={48}
                      className="mx-auto text-gray-300 mb-3"
                    />
                    <p className="text-sm">No comments yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Be the first to share your thoughts!
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
