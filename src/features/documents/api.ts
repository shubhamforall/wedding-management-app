import { api, downloadFileUrl, uploadFile } from '@/lib/api';
import { toCamelCaseObject, toSnakeCaseArray, toSnakeCaseObject } from '@/lib/caseMapping';
import type { DocumentMetaInput, DocumentRow } from './types';

export async function fetchDocuments(weddingId: string): Promise<DocumentRow[]> {
  const { documents } = await api.get<{ documents: Record<string, unknown>[] }>(`/weddings/${weddingId}/documents`);
  return toSnakeCaseArray<DocumentRow>(documents);
}

export async function uploadDocument(weddingId: string, file: File, meta: DocumentMetaInput): Promise<DocumentRow> {
  const { document } = await uploadFile<{ document: Record<string, unknown> }>(
    `/weddings/${weddingId}/documents`,
    file,
    toCamelCaseObject(meta) as Record<string, string>
  );
  return toSnakeCaseObject<DocumentRow>(document);
}

export async function updateDocumentMeta(weddingId: string, id: string, meta: DocumentMetaInput) {
  await api.patch(`/weddings/${weddingId}/documents/${id}`, toCamelCaseObject(meta));
}

export async function deleteDocument(weddingId: string, id: string) {
  await api.delete(`/weddings/${weddingId}/documents/${id}`);
}

// Downloads are now a direct authenticated (cookie-based) GET against the
// backend, not a Supabase Storage signed URL — same tenant/membership check
// runs server-side on every request instead of a time-limited pre-signed link.
export function getDownloadUrl(weddingId: string, documentId: string): string {
  return downloadFileUrl(`/weddings/${weddingId}/documents/${documentId}/download`);
}
