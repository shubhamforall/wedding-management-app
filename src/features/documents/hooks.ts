import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { DocumentMetaInput } from './types';

export const documentsQueryKey = (weddingId: string) => ['documents', weddingId] as const;

export function useDocuments(weddingId: string) {
  return useQuery({ queryKey: documentsQueryKey(weddingId), queryFn: () => api.fetchDocuments(weddingId) });
}

export function useUploadDocument(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: DocumentMetaInput }) => api.uploadDocument(weddingId, file, meta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQueryKey(weddingId) }),
  });
}

export function useUpdateDocumentMeta(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, meta }: { id: string; meta: DocumentMetaInput }) =>
      api.updateDocumentMeta(weddingId, id, meta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQueryKey(weddingId) }),
  });
}

export function useDeleteDocument(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; storagePath: string }) => api.deleteDocument(weddingId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQueryKey(weddingId) }),
  });
}
