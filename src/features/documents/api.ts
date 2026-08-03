import { supabase } from '@/lib/supabase';
import type { DocumentMetaInput, DocumentRow } from './types';

const BUCKET = 'documents';

export async function fetchDocuments(weddingId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('date_added', { ascending: false })
    .returns<DocumentRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function uploadDocument(weddingId: string, file: File, meta: DocumentMetaInput): Promise<DocumentRow> {
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userRes.user) throw new Error('Not signed in.');

  const storagePath = `${weddingId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('documents')
    .insert({ ...meta, wedding_id: weddingId, storage_path: storagePath, uploaded_by: userRes.user.id })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }
  if (!data) throw new Error('Document creation returned no data.');
  return data as DocumentRow;
}

export async function updateDocumentMeta(id: string, meta: DocumentMetaInput) {
  const { error } = await supabase.from('documents').update(meta).eq('id', id);
  if (error) throw error;
}

export async function deleteDocument(id: string, storagePath: string) {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (storageError) throw storageError;
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

export async function getDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}
