import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import {
  createDocument,
  deleteDocumentRow,
  findDocumentById,
  findDocuments,
  updateDocumentMeta as updateDocumentMetaRow,
} from '../repositories/documentRepository';

function sanitizeFilename(name: string): string {
  // Strip path separators / traversal / control chars — the resulting
  // string is only ever used as the tail of a filename we generate
  // ourselves (never as a path on its own), see uploadDocument below.
  return name.replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_').slice(0, 200);
}

function weddingDir(weddingId: string): string {
  return path.join(env.uploadDir, weddingId);
}

export async function listDocuments(weddingId: string) {
  return findDocuments(weddingId);
}

export async function uploadDocument(input: {
  weddingId: string;
  uploadedBy: string;
  originalName: string;
  category: string | null;
  relatedTo: string | null;
  buffer: Buffer;
}) {
  const dir = weddingDir(input.weddingId);
  await fs.mkdir(dir, { recursive: true });

  const storedName = `${randomUUID()}-${sanitizeFilename(input.originalName)}`;
  const absolutePath = path.join(dir, storedName);
  const storagePath = `${input.weddingId}/${storedName}`;

  await fs.writeFile(absolutePath, input.buffer);

  try {
    return await createDocument({
      weddingId: input.weddingId,
      documentName: input.originalName,
      category: input.category,
      relatedTo: input.relatedTo,
      storagePath,
      uploadedBy: input.uploadedBy,
    });
  } catch (err) {
    // Roll back the file if the DB insert fails — mirrors the old
    // Supabase Storage upload's rollback-on-insert-failure behavior.
    await fs.unlink(absolutePath).catch(() => {});
    throw err;
  }
}

export async function getDocumentForDownload(documentId: string, weddingId: string) {
  const doc = await findDocumentById(documentId);
  if (!doc || doc.wedding_id !== weddingId || !doc.storage_path) throw AppError.notFound('Document not found.');

  // storage_path always comes from our own DB row, never from client input
  // directly — this is the only path-traversal-safe way to resolve it.
  const absolutePath = path.join(env.uploadDir, doc.storage_path);
  return { doc, absolutePath };
}

export async function updateDocumentMeta(
  documentId: string,
  weddingId: string,
  meta: { documentName?: string; category?: string | null; relatedTo?: string | null; dateAdded?: string }
) {
  const doc = await findDocumentById(documentId);
  if (!doc || doc.wedding_id !== weddingId) throw AppError.notFound('Document not found.');
  await updateDocumentMetaRow(documentId, meta);
  return findDocumentById(documentId);
}

export async function deleteDocument(documentId: string, weddingId: string) {
  const doc = await findDocumentById(documentId);
  if (!doc || doc.wedding_id !== weddingId) throw AppError.notFound('Document not found.');

  if (doc.storage_path) {
    await fs.unlink(path.join(env.uploadDir, doc.storage_path)).catch(() => {});
  }
  await deleteDocumentRow(documentId);
}
