"use client";
import { useState, useRef, useEffect } from "react";
import { Post } from "../../types";
import { usePosts } from "../../hooks/usePosts";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

const EditPostModal = ({ post, isOpen, onClose }: EditPostModalProps) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    post.image ? `${process.env.NEXT_PUBLIC_API_URL}${post.image}` : null
  );
  const { editPost, isEditingPost } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/image\/(jpg|jpeg|png|gif)/)) {
        toast.error("Only JPG, JPEG, PNG, or GIF files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    try {
      await editPost({ postId: post.id, title, content, image });
      toast.success("Post updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update post");
      console.error("Error updating post:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 w-full max-w-lg mx-auto rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Post
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]"
          >
            {/* Title Input */}
            <div className="space-y-2">
              <Input
                placeholder="Give your post a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="text-lg font-medium border-0 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
              />
              <div className="text-xs text-gray-400 text-right">
                {title.length}/200
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                maxLength={500}
                className="resize-none border-0 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200 text-base leading-relaxed"
              />
              <div className="text-xs text-gray-400 text-right">
                {content.length}/500
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-auto max-h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Media Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors duration-200"
              >
                <ImageIcon size={20} />
                <span className="font-medium">Add Photo</span>
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || !content.trim() || isEditingPost}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isEditingPost ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditPostModal;
