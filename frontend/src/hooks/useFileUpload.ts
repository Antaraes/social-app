import { useState } from 'react';
import axios from '@/lib/axios';

export interface Attachment {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
}

export interface UploadResponse {
  success: boolean;
  attachments: Attachment[];
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: File[]): Promise<Attachment[]> => {
    if (!files || files.length === 0) {
      throw new Error('No files to upload');
    }

    // Validate file count
    if (files.length > 5) {
      throw new Error('Maximum 5 files allowed per message');
    }

    // Validate file sizes and types
    const maxImageDocSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    const maxAudioSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isDocument =
        file.type === 'application/pdf' ||
        file.type.includes('document') ||
        file.type.includes('sheet') ||
        file.type === 'text/plain';

      if (!isImage && !isVideo && !isAudio && !isDocument) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      if ((isImage || isDocument) && file.size > maxImageDocSize) {
        throw new Error(`${file.name} exceeds maximum size of 10MB`);
      }

      if (isVideo && file.size > maxVideoSize) {
        throw new Error(`${file.name} exceeds maximum size of 50MB`);
      }

      if (isAudio && file.size > maxAudioSize) {
        throw new Error(`${file.name} exceeds maximum size of 10MB`);
      }
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await axios.post<UploadResponse>(
        '/messaging/upload-attachments',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setProgress(percentCompleted);
          },
        }
      );

      setUploading(false);
      setProgress(100);

      return response.data.attachments;
    } catch (err: any) {
      setUploading(false);
      setProgress(0);
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadFiles,
    uploading,
    progress,
    error,
    reset,
  };
};
