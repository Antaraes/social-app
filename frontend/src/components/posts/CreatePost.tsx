"use client";
import { useState, useRef, useEffect } from "react";
import { usePosts } from "../../hooks/usePosts";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useAuth } from "../../hooks/useAuth";
import { Image, Video, X } from "lucide-react";
import { toast } from "react-toastify";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { createPost, isCreatingPost } = usePosts();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (only images)
      if (!file.type.match(/image\/(jpg|jpeg|png|gif)/)) {
        toast.error("Only JPG, JPEG, PNG, or GIF files are allowed");
        return;
      }
      // Validate file size (max 5MB)
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
    if (!content.trim() || !title.trim()) {
      toast.error("Title and content are required");
      return;
    }

    try {
      await createPost({ content, title, image: image ?? undefined });
      setContent("");
      setTitle("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Post created successfully");
    } catch (error) {
      toast.error("Failed to create post");
      console.error("Error creating post:", error);
    }
  };

  // Clean up image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!user) return null;

  return (
    <Card className="mb-6 bg-white/80 backdrop-blur-sm w-full max-w-2xl mx-auto">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-4 sm:space-y-0">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            {user.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`}
                alt={user.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-none shadow-none focus:outline-none text-base sm:text-lg font-medium bg-transparent"
                maxLength={200}
                aria-label="Post title"
              />
              <Textarea
                placeholder="What's happening in your world?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none border-none shadow-none focus-visible:ring-0 text-base sm:text-lg min-h-[80px] sm:min-h-[100px]"
                rows={3}
                maxLength={500}
                aria-label="Post content"
              />
              {imagePreview && (
                <div className="relative mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="rounded-lg max-h-48 sm:max-h-64 object-cover w-full"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-gray-800 text-white rounded-full h-8 w-8"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 px-3 text-sm sm:text-base"
                    aria-label="Upload photo"
                  >
                    <Image size={18} className="mr-2" />
                    Photo
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    disabled
                    className="h-10 px-3 text-sm sm:text-base"
                    aria-label="Upload video (disabled)"
                  >
                    <Video size={18} className="mr-2" />
                    Video
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    {content.length}/500
                  </span>
                  <Button
                    type="submit"
                    disabled={
                      !content.trim() || !title.trim() || isCreatingPost
                    }
                    className="h-10 px-4 sm:px-6 text-sm sm:text-base"
                    aria-label="Share post"
                  >
                    {isCreatingPost ? "Posting..." : "Share Post"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
