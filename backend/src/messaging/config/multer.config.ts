import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

// Allowed file types
const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
];

const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
];

const ALL_ALLOWED_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
];

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for images/documents
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB for audio

export const messageAttachmentConfig: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', 'messages');

      // Ensure directory exists
      fs.mkdirSync(uploadPath, { recursive: true });

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-random-originalname
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!ALL_ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          `Invalid file type. Allowed types: images, documents, videos (mp4, webm), audio`,
        ),
        false,
      );
    }

    cb(null, true);
  },
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use max size, we'll check specific types in the service
    files: 5, // Maximum 5 files per message
  },
};

export function validateFileSize(file: Express.Multer.File): void {
  if (IMAGE_MIME_TYPES.includes(file.mimetype) || DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File ${file.originalname} exceeds maximum size of 10MB`,
      );
    }
  } else if (VIDEO_MIME_TYPES.includes(file.mimetype)) {
    if (file.size > MAX_VIDEO_SIZE) {
      throw new BadRequestException(
        `Video ${file.originalname} exceeds maximum size of 50MB`,
      );
    }
  } else if (AUDIO_MIME_TYPES.includes(file.mimetype)) {
    if (file.size > MAX_AUDIO_SIZE) {
      throw new BadRequestException(
        `Audio ${file.originalname} exceeds maximum size of 10MB`,
      );
    }
  }
}

export function getFileType(mimetype: string): 'image' | 'document' | 'video' | 'audio' | 'other' {
  if (IMAGE_MIME_TYPES.includes(mimetype)) return 'image';
  if (DOCUMENT_MIME_TYPES.includes(mimetype)) return 'document';
  if (VIDEO_MIME_TYPES.includes(mimetype)) return 'video';
  if (AUDIO_MIME_TYPES.includes(mimetype)) return 'audio';
  return 'other';
}
