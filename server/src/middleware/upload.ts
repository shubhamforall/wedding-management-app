import multer from 'multer';

// Memory storage — documentService decides the final on-disk path itself
// (tenant-scoped directory, sanitized generated filename), so multer never
// touches the filesystem directly.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
