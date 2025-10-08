"use client";

import {
  X,
  File,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../ui/button";

export interface AttachmentItem {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  type: "image" | "document" | "video" | "audio" | "other";
}

interface AttachmentPreviewProps {
  attachments: AttachmentItem[];
  onRemove?: (index: number) => void;
  editable?: boolean;
}

export function AttachmentPreview({
  attachments,
  onRemove,
  editable = true,
}: AttachmentPreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={20} />;
      case "video":
        return <Film size={20} />;
      case "audio":
        return <Music size={20} />;
      case "document":
        return <FileText size={20} />;
      default:
        return <File size={20} />;
    }
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2">
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="relative group bg-gray-100 rounded-lg overflow-hidden"
          style={{ maxWidth: "500px" }}
        >
          {/* Preview based on type */}
          {attachment.type === "image" ? (
            <div className="w-full h-32 overflow-hidden">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${attachment.path}`}
                alt={attachment.originalName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : attachment.type === "video" ? (
            <video
              src={`${process.env.NEXT_PUBLIC_API_URL}${attachment.path}`}
              className="w-full h-32 object-cover"
              controls={!editable}
            />
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-200">
              {getIcon(attachment.type)}
            </div>
          )}

          {/* File info
          <div className="p-2 bg-white border-t">
            <p className="text-xs font-medium truncate" title={attachment.originalName}>
              {attachment.originalName}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
          </div> */}

          {/* Remove button */}
          {editable && onRemove && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(index)}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
